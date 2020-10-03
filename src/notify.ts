import dotenv from "dotenv";
import axios from "axios";
import discordWebhook from "discord-webhook-node";
import { AllTableDiff } from "./diff";
import Axios from "axios";
import { DestinyManifest } from "bungie-api-ts/destiny2";
import { getManifestId } from "./utils";

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

  await hook.send(embed);
}

async function notifyNetlify(version: string) {
  await axios.post(
    `${process.env.NETLIFY_WEBOOK}?trigger_title=Manifest+version+${version}`,
    {}
  );
}

export default async function notify(
  manifest: DestinyManifest,
  diffData: AllTableDiff
) {
  const manifestId = getManifestId(manifest);

  console.log("Sending Discord notification");
  await notifyDiscord(manifestId, diffData);

  console.log("Triggering Netlify build");
  await notifyNetlify(manifestId);
}
