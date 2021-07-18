import { DestinyManifest } from "bungie-api-ts/destiny2/interfaces";
import Discord, { Message, MessageEmbed, TextChannel } from "discord.js";
import { AllTableDiff } from "../../diff";
import logger from "../log";
import { friendlyDiffName, getManifestId } from "../../utils";
import { definitionsBotToken, definitionsHook } from "./discordWebhooks";
import { createSortedDiffSummary } from "./utils";

const GREEN = 0x2ecc71;

const wait = (duration: number) =>
  new Promise((resolve, reject) => setTimeout(reject, duration));

const EMOJI: Record<string, string> = {
  added: "<:new_diff:865996722895060993>",
  removed: "<:removed_diff:865998047540805652>",
  modified: "<:changed_diff:865996674521235507>",
  unclassified: "<:unclassified_diff:865996812267946015>",
  reclassified: "<:reclassified_diff:865996745942499378>",
};

// perm 11264
// https://discord.com/oauth2/authorize?client_id=861909035472257055&permissions=11264&scope=bot

async function crosspostMessage(baseMessage: Message) {
  return new Promise<void>((resolve) => {
    const client = new Discord.Client({
      restSweepInterval: -1,
    });

    client.on("ready", () => {
      logger.debug("Discord bot is ready");

      async function run() {
        logger.debug("Discord bot is running run() with channel_ID", {
          channelID: (baseMessage as any).channel_id,
        });
        const channel = await client.channels.fetch(
          (baseMessage as any).channel_id
        );

        logger.debug("Got channel back");

        if (!(channel instanceof TextChannel)) {
          throw new Error("Channel is not an instance of TextChannel");
        }

        logger.debug("Fetching recent messages");
        const recentMessages = await channel.messages.fetch({ limit: 10 });
        logger.debug("Got the messages back", {
          count: recentMessages.size,
        });
        const message = recentMessages.find((v) => v.id === baseMessage.id);

        if (!message) {
          throw new Error("Unable to find message to crosspost");
        }

        logger.debug("Found recent message, crossposting");

        return await Promise.race([message.crosspost(), wait(5 * 1000)]);
      }

      run()
        .then((message) => {
          logger.info("Successfully crossposted message", {
            id: (message as any)?.id,
          });
        })
        .catch((err) => {
          logger.error("Error crossposting discord message", err);
        })
        .finally(() => {
          client.destroy();
          resolve();
        });
    });

    logger.debug("Logging into discord bot");
    client.login(definitionsBotToken);
  });
}

function addTablesToEmbed(
  embed: MessageEmbed,
  diff: ReturnType<typeof createSortedDiffSummary>["mainDiff"]
) {
  diff.forEach((table) => {
    const message = Object.entries(table.diff)
      .filter(([, count]) => count > 0)
      .map(([diffName, count]) => `${EMOJI[diffName]} ${count} ${diffName}`);

    embed.addField(friendlyDiffName(table.tableName), message);
  });
}

export async function notifyDiscordDone(
  manifest: DestinyManifest,
  diffData: AllTableDiff
) {
  const manifestId = getManifestId(manifest);
  const { mainDiff, junkDiff, junkCount } = createSortedDiffSummary(diffData);

  logger.debug("Main diff", mainDiff);
  logger.debug("Junk diff", junkDiff);

  const embed = new MessageEmbed()
    .setTitle("Definitions have updated!")
    .setColor(GREEN)
    .setURL(`https://archive.destiny.report/version/${manifestId}`)
    .setDescription([
      `**ID:** ${manifestId}`,
      `**Version:** ${manifest.version}`,
    ])
    .setTimestamp();

  addTablesToEmbed(embed, mainDiff);

  const junkEmbed = new MessageEmbed().setDescription(
    `Plus ${junkCount} changes to junk tables`
  );
  addTablesToEmbed(junkEmbed, junkDiff);

  if (process.env.SILENT_DISCORD || !definitionsHook) {
    logger.info("Suppressing discord notification", embed);
  } else {
    const message = await definitionsHook.send(
      junkCount > 0 ? [embed, junkEmbed] : [embed]
    );
    await crosspostMessage(message);
  }
}

export async function notifyDiscordStarting(manifest: DestinyManifest) {
  const manifestId = getManifestId(manifest);

  const embed = new MessageEmbed()
    .setTitle("Definitions are updating!")
    .setDescription([
      `**ID:** ${manifestId}`,
      `**Version:** ${manifest.version}`,
    ]);

  if (process.env.SILENT_DISCORD || !definitionsHook) {
    logger.info("Suppressing discord notification", embed);
  } else {
    const message = await definitionsHook.send(embed);
    await crosspostMessage(message);
  }
}
