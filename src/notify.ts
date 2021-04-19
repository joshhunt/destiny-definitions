import dotenv from "dotenv";
import discordWebhook from "discord-webhook-node";
import { AllTableDiff } from "./diff";
import { DestinyManifest } from "bungie-api-ts/destiny2";
import { getManifestId } from "./utils";
import notifyTwitter, { initialTwitterNotification } from "./notify/twitter";

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
    console.log("Suppressing discord notification", embed);
  } else {
    await hook.send(embed);
  }
}

async function protect(fn: () => Promise<unknown>, message: string) {
  try {
    return await fn();
  } catch (err) {
    console.log(message);
    console.error(err);
  }
}

export default async function notify(
  manifest: DestinyManifest,
  diffData: AllTableDiff
) {
  const manifestId = getManifestId(manifest);

  await protect(async () => {
    console.log("Sending Discord notification");
    await notifyDiscord(manifestId, diffData);
  }, "Failed to send discord notification");

  await protect(async () => {
    console.log("Sending Tweets");
    await notifyTwitter(manifest, diffData);
  }, "Failed to send Tweets");
}

async function initialDiscordNotification(manifest: DestinyManifest) {
  const manifestId = getManifestId(manifest);

  const embed = (new MessageBuilder() as any)
    .setTitle("Definitions are updating...")
    .setDescription(`ID: ${manifestId}\nVersion: ${manifest.version}`);

  if (process.env.SILENT_NOTIFICATIONS) {
    console.log("Suppressing discord notification", embed);
  } else {
    await hook.send(embed);
  }
}

export async function sendInitialNotification(manifest: DestinyManifest) {
  await protect(async () => {
    console.log("Sending initial Discord notification");
    await initialDiscordNotification(manifest);
  }, "Failed to send initial Discord notification");

  await protect(async () => {
    console.log("Sending initial Twitter notification");
    await initialTwitterNotification(manifest);
  }, "Failed to send initial Twitter notification");
}
