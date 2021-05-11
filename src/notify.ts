import dotenv from "dotenv";
import discordWebhook from "discord-webhook-node";
import { AllTableDiff } from "./diff";
import { DestinyManifest } from "bungie-api-ts/destiny2";
import { getManifestId } from "./utils";
import notifyTwitter, { initialTwitterNotification } from "./notify/twitter";
import logger from "./lib/log";

const { Webhook, MessageBuilder } = discordWebhook;

dotenv.config();
if (!process.env.DISCORD_WEBHOOK) {
  throw new Error("process.env.DISCORD_WEBHOOK not defined");
}
if (!process.env.NETLIFY_WEBOOK) {
  throw new Error("process.env.NETLIFY_WEBOOK not defined");
}

const hook = new Webhook(process.env.DISCORD_WEBHOOK);

async function notifyDiscord(version: string, diffData: AllTableDiff) {
  let embed = (new MessageBuilder() as any)
    .setTitle("Definitions have updated")
    .setURL(`https://archive.destiny.report/version/${version}`)
    .setDescription(`Version: ${version}`);

  Object.entries(diffData)
    .filter(([, tableDiff]) => {
      return Object.values(tableDiff).some((v) => v.length > 0);
    })
    .forEach(([tableName, tableDiff]) => {
      const message = Object.entries(tableDiff)
        .filter(
          ([diffName, diffItems]) =>
            diffItems.length > 0 && diffName !== "diffs"
        )
        .map(([diffName, diffItems]) => `${diffItems.length} ${diffName}`)
        .join(", ");

      embed = embed.addField(tableName, message);
    });

  embed = embed.setColor("#2ecc71").setTimestamp();

  if (process.env.SILENT_NOTIFICATIONS) {
    logger.info("Suppressing discord notification", embed);
  } else {
    await hook.send(embed);
  }
}

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
  const manifestId = getManifestId(manifest);

  await protect(async () => {
    logger.info("Sending Discord notification");
    await notifyDiscord(manifestId, diffData);
  }, "Discord");

  await protect(async () => {
    logger.info("Sending Tweets");
    await notifyTwitter(manifest, diffData);
  }, "Twitter");
}

async function initialDiscordNotification(manifest: DestinyManifest) {
  const manifestId = getManifestId(manifest);

  const embed = (new MessageBuilder() as any)
    .setTitle("Definitions are updating...")
    .setDescription(`ID: ${manifestId}\nVersion: ${manifest.version}`);

  if (process.env.SILENT_NOTIFICATIONS) {
    logger.info("Suppressing discord notification", embed);
  } else {
    await hook.send(embed);
  }
}

export async function sendInitialNotification(manifest: DestinyManifest) {
  await protect(async () => {
    logger.info("Sending initial Discord notification");
    await initialDiscordNotification(manifest);
  }, "Discord");

  await protect(async () => {
    logger.info("Sending initial Twitter notification");
    await initialTwitterNotification(manifest);
  }, "Twitter");
}
