import dotenv from "dotenv";
import { AllTableDiff } from "../../diff";
import { DestinyManifest } from "bungie-api-ts/destiny2";
import logger from "../log";
import {
  notifyDiscordDetailed,
  notifyDiscordDone,
  notifyDiscordStarting,
} from "./discord";
import { notifyTwitterDone, notifyTwitterStarting } from "./twitter";
import { notifyMastodonStarting } from "./mastodon";

dotenv.config();

async function protect(fn: () => Promise<unknown>, service: string) {
  try {
    return await fn();
  } catch (err: any) {
    const error = err?.toString() ?? "unknown error - no .toString() method";
    logger.error("Failed to send message", { error: error, service });
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

  await protect(async () => {
    logger.info("Sending Mastodon posts");
    await notifyTwitterDone(manifest, diffData);
  }, "Mastodon");

  await protect(async () => {
    logger.info("Detailed Discord notification");
    await notifyDiscordDetailed(manifest, diffData);
  }, "Discord");
}

export async function sendInitialNotification(manifest: DestinyManifest) {
  if (process.env.SUPPRESS_INITIAL_NOTIFICATION) {
    return;
  }

  await protect(async () => {
    logger.info("Sending initial Discord notification");
    await notifyDiscordStarting(manifest);
    logger.info("Done sending initial Discord notification");
  }, "Discord");

  await protect(async () => {
    logger.info("Sending initial Twitter notification");
    await notifyTwitterStarting(manifest);
  }, "Twitter");

  await protect(async () => {
    logger.info("Sending initial Mastodon notification");
    await notifyMastodonStarting(manifest);
  }, "Mastodon");
}
