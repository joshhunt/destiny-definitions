import path from "path";
import axios from "axios";
import asyncLib from "async";

import { DestinyManifest } from "bungie-api-ts/destiny2";
import { saveManifestRow, saveDefinitionTableRow, getManifest } from "./db";
import uploadToS3, {
  makeManifestKey,
  makeDefinitionTableKey,
  makeMobileWorldContentKey,
} from "./s3";

const LANGUAGE = "en";

export default async function processManifest(manifest: DestinyManifest) {
  const { version } = manifest;

  const manifestS3Key = makeManifestKey(version);
  await uploadToS3(manifestS3Key, JSON.stringify(manifest));

  await uploadMobileWorldContent(manifest);

  console.log("Saving manifest to DB");
  await saveManifestRow({
    version: version,
    data: manifest,
    s3Key: manifestS3Key,
  });

  const tables = manifest.jsonWorldComponentContentPaths[LANGUAGE];

  const entries = Object.entries(tables);
  for (const [tableName, bungiePath] of entries) {
    await processDefinitionTable(tableName, bungiePath, version);
  }
}

async function uploadMobileWorldContent(manifest: DestinyManifest) {
  const mobileWorldContentPath = manifest.mobileWorldContentPaths[LANGUAGE];

  const resp = await axios.get(
    `https://www.bungie.net${mobileWorldContentPath}`,
    { responseType: "arraybuffer" }
  );

  const fileName = path.basename(mobileWorldContentPath);
  const s3Key = makeMobileWorldContentKey(manifest.version, fileName);

  await uploadToS3(s3Key, resp.data);

  return s3Key;
}

async function processDefinitionTable(
  tableName: string,
  bungiePath: string,
  version: string
) {
  console.log(`Processing table ${tableName}`);
  const resp = await axios.get(`https://www.bungie.net${bungiePath}`, {
    transformResponse: (res: any) => res,
    responseType: "json",
  });
  const s3Key = makeDefinitionTableKey(version, tableName);

  await uploadToS3(s3Key, resp.data, "application/json", "public-read");

  await saveDefinitionTableRow({
    name: tableName,
    manifestVersion: version,
    bungiePath,
    s3Key,
  });
}
