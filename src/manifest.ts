import path from "path";
import http from "./lib/http";

import { DestinyManifest } from "bungie-api-ts/destiny2";
import { saveVersionRow, saveDefinitionTableRow } from "./db";
import uploadToS3, {
  makeManifestKey,
  makeDefinitionTableKey,
  makeMobileWorldContentKey,
} from "./s3";
import { getManifestId } from "./utils";
import { bungieUrl, getDefinitionTable } from "./bungie";
import logger from "./lib/log";

const LANGUAGE = "en";

export default async function processManifest(
  manifest: DestinyManifest,
  createdAt?: Date
) {
  const manifestId = getManifestId(manifest);

  const manifestS3Key = makeManifestKey(manifestId);
  await uploadToS3(manifestS3Key, JSON.stringify(manifest));

  await uploadMobileWorldContent(manifestId, manifest);

  logger.info("Saving manifest to database", {
    id: manifestId,
    version: manifest.version,
    s3Key: manifestS3Key,
    createdAt,
  });

  await saveVersionRow({
    id: manifestId,
    version: manifest.version,
    manifest: manifest,
    s3Key: manifestS3Key,
    createdAt,
  });

  const tables = manifest.jsonWorldComponentContentPaths[LANGUAGE];

  const entries = Object.entries(tables);
  for (const [tableName, bungiePath] of entries) {
    await processDefinitionTable(manifestId, tableName, bungiePath);
  }
}

async function uploadMobileWorldContent(
  manifestId: string,
  manifest: DestinyManifest
) {
  const mobileWorldContentPath = manifest.mobileWorldContentPaths[LANGUAGE];

  const resp = await http(bungieUrl(mobileWorldContentPath), {
    responseType: "arraybuffer",
  });

  const fileName = path.basename(mobileWorldContentPath);
  const s3Key = makeMobileWorldContentKey(manifestId, fileName);

  await uploadToS3(s3Key, resp.data, "application/zip", "public-read");

  return s3Key;
}

async function processDefinitionTable(
  manifestId: string,
  tableName: string,
  bungiePath: string
) {
  logger.info("Processing table", { tableName });

  const definition = await getDefinitionTable(tableName, bungiePath);
  const s3Key = makeDefinitionTableKey(manifestId, tableName);

  await uploadToS3(s3Key, definition, "application/json", "public-read");

  if (process.env.MAKE_TEST_DIFFS) {
    await uploadToS3(
      makeDefinitionTableKey("test", tableName),
      definition,
      "application/json",
      "public-read"
    );
  }

  await saveDefinitionTableRow({
    name: tableName,
    versionId: manifestId,
    bungiePath,
    s3Key,
  });
}
