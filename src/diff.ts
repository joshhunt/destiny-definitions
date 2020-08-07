import asyncLib, { Dictionary } from "async";
import sortBy from "lodash/sortBy";
import keyBy from "lodash/keyBy";

import {
  getAllManifests,
  Manifest,
  getTablesForVersion,
  DefinitionTable,
} from "./db";

import uploadToS3, { getFromS3, makeDiffKey } from "./s3";
import { AllDestinyManifestComponents } from "bungie-api-ts/destiny2";

const TABLE_CONCURRENCY = 100;

function validateVersionOrder(allManifests: Manifest[]): Manifest[] {
  const byVersion = sortBy(allManifests, (v) => v.version);
  const byCreatedAt = sortBy(allManifests, (v) => v.createdAt);

  for (const index in byVersion) {
    if (byVersion[index] !== byCreatedAt[index]) {
      throw new Error("Version and createdAt sort order is inconsistent");
    }
  }

  return byVersion;
}

type AnyDefinitionTable = AllDestinyManifestComponents[keyof AllDestinyManifestComponents];
type AnyDefinition = AnyDefinitionTable[keyof AnyDefinitionTable];

export type DiffItem = AnyDefinition["hash"];

export interface TableDiff {
  added: DiffItem[];
  unclassified: DiffItem[];
  removed: DiffItem[];
  reclassified: DiffItem[];
}
export type AllTableDiff = {
  [tableName: string]: TableDiff;
};

export default async function diffManifestVersion(currentVersion: string) {
  const allManifests = await getAllManifests();

  const sortedManifests = validateVersionOrder(allManifests);
  const currentVersionIndex = sortedManifests.findIndex(
    (v) => v.version == currentVersion
  );

  const previousVersion = sortedManifests[currentVersionIndex - 1]?.version;

  const [_previousTables, _currentTables] = await Promise.all([
    getTablesForVersion(previousVersion),
    getTablesForVersion(currentVersion),
  ]);

  const previousTables = keyBy(_previousTables, (v) => v.name);
  const currentTables = keyBy(_currentTables, (v) => v.name);

  delete previousTables.DestinyInventoryItemLiteDefinition;
  delete currentTables.DestinyInventoryItemLiteDefinition;

  const data: AllTableDiff = await asyncLib.mapValuesLimit(
    currentTables,
    TABLE_CONCURRENCY,
    asyncLib.asyncify(async (currentTable: DefinitionTable) => {
      const previousTable = previousTables[currentTable.name];

      const [previousDefinitions, currentDefinitions] = await Promise.all([
        getFromS3<AnyDefinitionTable>(previousTable.s3Key),
        getFromS3<AnyDefinitionTable>(currentTable.s3Key),
      ]);

      const { missing: added, classificationChanged: unclassified } = compare(
        currentDefinitions,
        previousDefinitions
      );

      const { missing: removed, classificationChanged: reclassified } = compare(
        previousDefinitions,
        currentDefinitions
      );

      const payload = { removed, added, unclassified, reclassified };
      logDiff(currentTable.name, payload);

      return {
        added,
        unclassified,
        removed,
        reclassified,
      };
    })
  );

  await uploadToS3(
    makeDiffKey(currentVersion),
    JSON.stringify(data),
    "application/json",
    "public-read"
  );

  return data;
}

const compare = (defsA: AnyDefinitionTable, defsB: AnyDefinitionTable) => {
  const missing: DiffItem[] = [];
  const classificationChanged: DiffItem[] = [];

  Object.values(defsA).forEach((currentDef) => {
    const prevDef = defsB[currentDef.hash];

    if (!prevDef) {
      missing.push(currentDef.hash);
    } else if (prevDef.redacted && !currentDef.redacted) {
      classificationChanged.push(currentDef.hash);
    }
  });

  return { missing, classificationChanged };
};

const logDiff = (
  name: string,
  { removed, added, unclassified, reclassified }: TableDiff
) => {
  if (
    removed.length ||
    added.length ||
    unclassified.length ||
    reclassified.length
  ) {
    const messages = [
      removed.length && `${removed.length} removed`,
      added.length && `${added.length} added`,
      unclassified.length && `${unclassified.length} unclassified`,
      reclassified.length && `${reclassified.length} reclassified`,
    ]
      .filter((v) => v)
      .join(", ");

    console.log(`Diff ${name} - ${messages}`);
  }
};
