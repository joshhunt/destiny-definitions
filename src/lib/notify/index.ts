import dotenv from "dotenv";
import { AllTableDiff } from "../../diff";
import { DestinyManifest } from "bungie-api-ts/destiny2";
import logger from "../log";
import { notifyDiscordDone, notifyDiscordStarting } from "./discord";
import { notifyTwitterDone, notifyTwitterStarting } from "./twitter";

dotenv.config();

async function protect(fn: () => Promise<unknown>, service: string) {
  try {
    return await fn();
  } catch (err) {
    logger.error("Failed to send message", { error: err, service });
  }
}

export default async function notify(
  manifest: DestinyManifest,
  diffData: AllTableDiff
) {
  await protect(async () => {
    logger.info("Sending Discord notification");
    await notifyDiscordDone(manifest, diffData);
  }, "Discord");

  await protect(async () => {
    logger.info("Sending Tweets");
    await notifyTwitterDone(manifest, diffData);
  }, "Twitter");
}

export async function sendInitialNotification(manifest: DestinyManifest) {
  await protect(async () => {
    logger.info("Sending initial Discord notification");
    await notifyDiscordStarting(manifest);
    logger.info("Done sending initial Discord notification");
  }, "Discord");

  await protect(async () => {
    logger.info("Sending initial Twitter notification");
    await notifyTwitterStarting(manifest);
  }, "Twitter");
}
