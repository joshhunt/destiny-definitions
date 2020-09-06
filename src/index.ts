import dotenv from "dotenv";
import fs from "fs-extra";

import { getManifest } from "./bungie";
import { getManifest as getDbManifest } from "./db";
import processManifest from "./manifest";
import { createIndex, finish } from "./extraTasks";
import diffManifestVersion from "./diff";
import notify from "./notify";

dotenv.config();
const S3_BUCKET = process.env.S3_BUCKET;

if (!S3_BUCKET) {
  throw new Error("S3_BUCKET not defined");
}

async function main() {
  const force = process.argv.some((v) => v.includes("force"));

  console.log("Loading manifest");
  const [manifestResp, latestUploaded] = await Promise.all([
    getManifest(),
    (await fs.readJSON("./latestVersion.json")) as Promise<{ version: string }>,
  ]);

  const manifestData = manifestResp.data.Response;
  if (!force && manifestData.version === latestUploaded.version) {
    console.log("Manifest already exists in latestVersion.json");
    return;
  }

  const prevManifest = await getDbManifest(manifestData.version);

  if (!force && prevManifest) {
    const l = { ...prevManifest };
    delete l.data;
    console.log("Manifest already exists in database");
    console.log(l);

    await fs.writeJSON("./latestVersion.json", {
      version: manifestData.version,
    });

    return;
  }

  console.log("Processing manifest");
  await processManifest(manifestData);

  console.log("Creating diff");
  const diffResults = await diffManifestVersion(manifestData.version);

  console.log("Creating index");
  await createIndex();

  console.log("Finishing up");
  await finish(manifestData.version);

  console.log("Sending notifications");
  await notify(manifestData.version, diffResults);

  console.log("All done");
}

main().catch((err) => {
  console.error("Uncaught top-level error");
  console.error(err);
});
