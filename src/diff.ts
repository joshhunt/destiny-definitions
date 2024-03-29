import asyncLib from "async";
import sortBy from "lodash/sortBy";
import keyBy from "lodash/keyBy";
import mapValues from "lodash/mapValues";
import pickBy from "lodash/pickBy";
import deepDiffLib from "deep-diff";

import {
  Version,
  getTablesForVersion,
  DefinitionTable,
  getAllVerisons,
} from "./db";

import uploadToS3, {
  getFromS3,
  makeDiffKey,
  makeTableModifiedDiffKey,
} from "./s3";
import {
  AllDestinyManifestComponents,
  DestinyManifest,
} from "bungie-api-ts/destiny2";
import { getManifestId } from "./utils";
import logger from "./lib/log";

enum DiffKind {
  New = "N",
  Deleted = "D",
  Edit = "E",
  Array = "A",
}

const TABLE_CONCURRENCY = 1;

function sortVersions(allManifests: Version[]): Version[] {
  // TODO: do we need to validate the order or something here?
  return sortBy(allManifests, (v) => v.createdAt);
}

type AnyDefinitionTable =
  AllDestinyManifestComponents[keyof AllDestinyManifestComponents];
type AnyDefinition = AnyDefinitionTable[keyof AnyDefinitionTable];

export type DiffItem = AnyDefinition["hash"];

export interface TableDiff {
  added: DiffItem[];
  unclassified: DiffItem[];
  removed: DiffItem[];
  reclassified: DiffItem[];
  modified: DiffItem[];
}
export type AllTableDiff = {
  [tableName: string]: TableDiff;
};

const FIRST_VERSION_ID = "ef65788d-4bda-4a32-9b89-e8d60bc00d7d";

export default async function diffManifestVersion(manifest: DestinyManifest) {
  const manifestId = getManifestId(manifest);
  const allManifests = await getAllVerisons();

  const sortedManifests = sortVersions(allManifests);
  const currentVersionIndex = sortedManifests.findIndex(
    (v) => v.id == manifestId
  );

  const previousVersionId = sortedManifests[currentVersionIndex - 1]?.id;

  const [_previousTables, _currentTables] = await Promise.all([
    getTablesForVersion(previousVersionId),
    getTablesForVersion(manifestId),
  ]);

  const previousTables: Record<string, DefinitionTable | undefined> = keyBy(
    _previousTables,
    (v) => v.name
  );
  const currentTables = keyBy(_currentTables, (v) => v.name);

  delete previousTables.DestinyInventoryItemLiteDefinition;
  delete currentTables.DestinyInventoryItemLiteDefinition;

  const testData: AllTableDiff = {};

  const data: AllTableDiff = await asyncLib.mapValuesLimit(
    currentTables,
    TABLE_CONCURRENCY,
    asyncLib.asyncify(async (currentTable: DefinitionTable) => {
      logger.info("Diffing table", { tableName: currentTable.name });
      const previousTable = previousTables[currentTable.name];

      if (!previousTable && manifestId === FIRST_VERSION_ID) {
        logger.info(
          "Unable to find previous table, and this is the first version, making empty diff",
          {
            tableName: currentTable.name,
          }
        );

        return {
          added: [],
          unclassified: [],
          removed: [],
          reclassified: [],
        };
      } else if (!previousTable) {
        logger.info(
          "Unable to find previous table, assuming this is a new table so all entries are new",
          {
            tableName: currentTable.name,
          }
        );

        const currentDefinitions = await getFromS3<AnyDefinitionTable>(
          currentTable.s3Key
        );
        return {
          added: Object.values(currentDefinitions).map((v) => v.hash),
          removed: [],
          unclassified: [],
          reclassified: [],
          modified: [],
        };
      }

      const [previousDefinitions, currentDefinitions] = await Promise.all([
        getFromS3<AnyDefinitionTable>(previousTable.s3Key),
        getFromS3<AnyDefinitionTable>(currentTable.s3Key),
      ]);

      if (process.env.MAKE_TEST_DIFFS) {
        testData[currentTable.name] = {
          added: Object.values(currentDefinitions).map((v) => v.hash),
          removed: [],
          unclassified: [],
          reclassified: [],
          modified: [],
        };
      }

      const {
        missing: added,
        classificationChanged: unclassified,
        modified,
        diffs,
      } = compare(currentDefinitions, previousDefinitions, true);

      const { missing: removed, classificationChanged: reclassified } = compare(
        previousDefinitions,
        currentDefinitions
      );

      const payload = {
        added,
        unclassified,
        removed,
        reclassified,
        modified,
        diffs, // TODO: don't return diffs like this
      };

      diffHasEntries(payload) &&
        logger.info("Diffed table has entries", {
          tableName: currentTable.name,
          added: added.length,
          unclassified: unclassified.length,
          removed: removed.length,
          reclassified: reclassified.length,
          modified: modified.length,
        });

      return payload;
    })
  );

  const diffDocument = mapValues(data, (v) =>
    pickBy(v, (hashesList, diffName) => diffName !== "diffs")
  );

  await uploadToS3(
    makeDiffKey(manifestId),
    JSON.stringify(diffDocument),
    "application/json",
    "public-read"
  );

  for (const [tableName, tableDiff] of Object.entries(data)) {
    if ((tableDiff as any)?.diffs?.length > 0) {
      await uploadToS3(
        makeTableModifiedDiffKey(manifestId, tableName),
        JSON.stringify((tableDiff as any).diffs),
        "application/json",
        "public-read"
      );
    }
  }

  if (process.env.MAKE_TEST_DIFFS) {
    await uploadToS3(
      makeDiffKey("test"),
      JSON.stringify(testData),
      "application/json",
      "public-read"
    );
  }

  return data;
}

function isImageString(source?: string) {
  if (!source?.match) {
    return false;
  }

  return !!source.match(/\.(png|jpeg|jpg|gif)$/);
}

function deefDiff(oldDef: AnyDefinition, newDef: AnyDefinition) {
  const diffs = deepDiffLib.diff(oldDef, newDef);

  if (!diffs) {
    return undefined;
  }

  const cleanedDiffs = diffs.filter((diff) => {
    const isIndexChange =
      diff.kind == DiffKind.Edit && diff.path?.[0] === "index";

    const isImageChange =
      diff.kind === DiffKind.Edit &&
      isImageString(diff.lhs as any) &&
      isImageString(diff.rhs as any);

    const shouldBeIgnored = isIndexChange || isImageChange;

    return !shouldBeIgnored;
  });

  return cleanedDiffs.length === 0 ? undefined : cleanedDiffs;
}

const compare = (
  defsA: AnyDefinitionTable,
  defsB: AnyDefinitionTable,
  doDeepDiff = false
) => {
  const missing: DiffItem[] = [];
  const classificationChanged: DiffItem[] = [];
  const modified: DiffItem[] = [];
  const diffs: {
    hash: number;
    diff: deepDiffLib.Diff<AnyDefinition, AnyDefinition>[];
  }[] = [];

  Object.values(defsA).forEach((currentDef) => {
    const prevDef = defsB[currentDef.hash];

    if (!prevDef) {
      missing.push(currentDef.hash);
    } else if (prevDef.redacted && !currentDef.redacted) {
      classificationChanged.push(currentDef.hash);
    } else if (doDeepDiff) {
      const diff = deefDiff(prevDef, currentDef);

      if (diff) {
        modified.push(currentDef.hash);
        diffs.push({ hash: currentDef.hash, diff: diff });
      }
    }
  });

  return { missing, classificationChanged, modified, diffs };
};

const diffHasEntries = (diff: TableDiff) => {
  return Object.values(diff).some((v) => v.length);
};
