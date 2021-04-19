import dotenv from "dotenv";

import { getManifest } from "./bungie";
import processManifest from "./manifest";
import { createIndex, finish } from "./extraTasks";
import diffManifestVersion from "./diff";
import notify, { sendInitialNotification } from "./notify";
import { getManifestId } from "./utils";
import { readLastVersionFile } from "./lastVersion";
import logger from "./lib/log";

dotenv.config();
const S3_BUCKET = process.env.S3_BUCKET;

if (!S3_BUCKET) {
  throw new Error("S3_BUCKET not defined");
}

async function main() {
  const force = process.argv.some((v) => v.includes("force"));
  force && logger.warn("Force is set it true");

  logger.info("Loading manifest");
  const [manifestResp, latestUploaded] = await Promise.all([
    getManifest(),
    readLastVersionFile(),
  ]);

  logger.info(`Loaded lastVersion.json`, { manifestId: latestUploaded.id });

  const currentManifest = manifestResp.data.Response;
  const currentManifestId = getManifestId(currentManifest);

  logger.info("Loaded current bungie manifest", {
    manifestId: currentManifestId,
    bungieManifestVersion: currentManifest.version,
  });

  if (!force && currentManifestId === latestUploaded.id) {
    logger.info("Manifest already exists in lastVersion.json, quitting");
    return;
  }

  await sendInitialNotification(currentManifest);

  logger.info("Processing manifest");
  await processManifest(currentManifest);

  logger.info("Creating diff");
  const diffResults = await diffManifestVersion(currentManifest);

  logger.info("Creating index");
  await createIndex();

  logger.info("Finishing up");
  await finish(currentManifest);

  logger.info("Sending notifications");
  await notify(currentManifest, diffResults);

  logger.info("All done");
}

main().catch((err) => {
  logger.error("Uncaught top-level error", err);
});
