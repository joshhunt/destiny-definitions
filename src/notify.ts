import dotenv from "dotenv";
import axios from "axios";
import discordWebhook from "discord-webhook-node";
import { AllTableDiff } from "./diff";
import Axios from "axios";
import { DestinyManifest } from "bungie-api-ts/destiny2";
import { getManifestId } from "./utils";
import notifyTwitter from "./notify/twitter";

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
    .setURL(`https://destiny-definitions.netlify.app/version/${version}`)
    .setDescription(`Version: ${version}`);

  Object.entries(diffData)
    .filter(([tableName, tableDiff]) => {
      return Object.values(tableDiff).some((v) => v.length > 0);
    })
    .forEach(([tableName, tableDiff]) => {
      const message = Object.entries(tableDiff)
        .filter(([, diffItems]) => diffItems.length > 0)
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

async function notifyNetlify(version: string) {
  if (process.env.SILENT_NOTIFICATIONS) {
    console.log("Suppressing netlify build");
  } else {
    await axios.post(
      `${process.env.NETLIFY_WEBOOK}?trigger_title=Manifest+version+${version}`,
      {}
    );
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

  await protect(async () => {
    console.log("Triggering Netlify build");
    await notifyNetlify(manifestId);
  }, "Failed to trigger Netlify build");
}
