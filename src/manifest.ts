import path from "path";
import axios from "axios";

import { DestinyManifest } from "bungie-api-ts/destiny2";
import { saveVersionRow, saveDefinitionTableRow, getVersion } from "./db";
import uploadToS3, {
  makeManifestKey,
  makeDefinitionTableKey,
  makeMobileWorldContentKey,
} from "./s3";
import { getManifestId } from "./utils";
import { bungieUrl } from "./bungie";

const LANGUAGE = "en";

export default async function processManifest(
  manifest: DestinyManifest,
  createdAt?: Date
) {
  const manifestId = getManifestId(manifest);

  const manifestS3Key = makeManifestKey(manifestId);
  await uploadToS3(manifestS3Key, JSON.stringify(manifest));

  await uploadMobileWorldContent(manifestId, manifest);

  console.log("Saving manifest to DB");
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

  const resp = await axios.get(bungieUrl(mobileWorldContentPath), {
    responseType: "arraybuffer",
  });

  const fileName = path.basename(mobileWorldContentPath);
  const s3Key = makeMobileWorldContentKey(manifestId, fileName);

  await uploadToS3(s3Key, resp.data);

  return s3Key;
}

async function processDefinitionTable(
  manifestId: string,
  tableName: string,
  bungiePath: string
) {
  console.log(`Processing table ${tableName}`);

  const resp = await axios.get(bungieUrl(bungiePath), {
    transformResponse: (res: any) => res,
    responseType: "json",
  });
  const s3Key = makeDefinitionTableKey(manifestId, tableName);

  await uploadToS3(s3Key, resp.data, "application/json", "public-read");

  if (process.env.MAKE_TEST_DIFFS) {
    await uploadToS3(
      makeDefinitionTableKey("test", tableName),
      resp.data,
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
