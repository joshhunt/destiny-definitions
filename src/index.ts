import dotenv from "dotenv";

import { getManifest } from "./bungie";
import processManifest from "./manifest";
import { createIndex, finish } from "./extraTasks";
import diffManifestVersion from "./diff";
import notify, { sendInitialNotification } from "./notify";
import { getManifestId } from "./utils";
import { readLastVersionFile } from "./lastVersion";

dotenv.config();
const S3_BUCKET = process.env.S3_BUCKET;

if (!S3_BUCKET) {
  throw new Error("S3_BUCKET not defined");
}

async function main() {
  const force = process.argv.some((v) => v.includes("force"));
  force &&
    console.log(
      "*** Force is set to true, so it's going to run regardless! ***"
    );

  console.log("Loading manifest");
  const [manifestResp, latestUploaded] = await Promise.all([
    getManifest(),
    readLastVersionFile(),
  ]);

  const currentManifest = manifestResp.data.Response;

  const currentManifestId = getManifestId(currentManifest);
  const lastManifestId = latestUploaded.id;

  console.log(`Current API manifest version GUID: ${currentManifestId}`);
  console.log(
    `Current API manifest bungie version: ${currentManifest.version}`
  );
  console.log(`lastVersion.json version GUID: ${lastManifestId}`);

  if (!force && currentManifestId === lastManifestId) {
    console.log("Manifest already exists in lastVersion.json");
    return;
  }

  await sendInitialNotification(currentManifest);

  console.log("Processing manifest");
  await processManifest(currentManifest);

  console.log("Creating diff");
  const diffResults = await diffManifestVersion(currentManifest);

  console.log("Creating index");
  await createIndex();

  console.log("Finishing up");
  await finish(currentManifest);

  console.log("Sending notifications");
  await notify(currentManifest, diffResults);

  console.log("All done");
}

main().catch((err) => {
  console.error("Uncaught top-level error");
  console.error(err);
});
