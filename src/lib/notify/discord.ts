import {
  DestinyInventoryItemDefinition,
  DestinyItemType,
  DestinyManifest,
  TierType,
} from "bungie-api-ts/destiny2/interfaces";
import Discord, { Message, MessageEmbed, TextChannel } from "discord.js";
import { AllTableDiff } from "../../diff";
import logger from "../log";
import { friendlyDiffName, getManifestId } from "../../utils";
import {
  definitionsBotToken,
  definitionsHook,
  newWeaponsHook,
} from "./discordWebhooks";
import { createSortedDiffSummary } from "./utils";
import { getDefinitionTable } from "../../bungie";
import { AllDestinyManifestComponents } from "bungie-api-ts/destiny2";

const GREEN = 0x2ecc71;

const wait = (duration: number) =>
  new Promise((resolve, reject) => setTimeout(reject, duration));

const EMOJI: Record<string, string> = {
  added: "<:new_diff:865996722895060993>",
  removed: "<:removed_diff:865998047540805652>",
  modified: "<:changed_diff:865996674521235507>",
  unclassified: "<:unclassified_diff:865996812267946015>",
  reclassified: "<:reclassified_diff:865996745942499378>",

  damageType_2303181850: "<:damageType_2303181850:876139450843922482>",
  damageType_3454344768: "<:damageType_3454344768:876139450848129084>",
  damageType_151347233: "<:damageType_151347233:876143477572902952>",
  damageType_1847026933: "<:damageType_1847026933:876143520262549525>",
  damageType_3373582085: "<:damageType_3373582085:876143563161886781>",
};

const PERK_SOCKET_TYPES = [2614797986];

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
  const { mainDiff, junkDiff, junkCount, mainCount } =
    createSortedDiffSummary(diffData);

  logger.debug("Main diff", mainDiff);
  logger.debug("Junk diff", junkDiff);

  const embed = new MessageEmbed()
    .setTitle("Definitions have updated!")
    .setColor(GREEN)
    .setDescription([
      `**ID:** ${manifestId}`,
      `**Version:** ${manifest.version}`,
    ])
    .setTimestamp();

  addTablesToEmbed(embed, mainDiff);

  const junkEmbed = new MessageEmbed().setDescription(
    `${mainCount > 0 ? "Plus" : "Only"} ${junkCount} changes to junk tables`
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

async function loadDefs<TTable extends keyof AllDestinyManifestComponents>(
  manifest: DestinyManifest,
  tableName: TTable
): Promise<AllDestinyManifestComponents[TTable]> {
  const url = manifest.jsonWorldComponentContentPaths.en[tableName];
  const json = await getDefinitionTable(tableName, url);

  const defs: AllDestinyManifestComponents[TTable] = JSON.parse(json);

  return defs;
}

export async function notifyDiscordDetailed(
  manifest: DestinyManifest,
  diffData: AllTableDiff
) {
  const itemDefs = await loadDefs(manifest, "DestinyInventoryItemDefinition");
  const damageTypesDefs = await loadDefs(
    manifest,
    "DestinyDamageTypeDefinition"
  );
  const plugSetDefs = await loadDefs(manifest, "DestinyPlugSetDefinition");
  const collectibleDefs = await loadDefs(
    manifest,
    "DestinyCollectibleDefinition"
  );

  await notifyItems(
    diffData.DestinyInventoryItemDefinition.added,
    itemDefs,
    damageTypesDefs,
    plugSetDefs,
    collectibleDefs
  );

  await notifyItems(
    diffData.DestinyInventoryItemDefinition.unclassified,
    itemDefs,
    damageTypesDefs,
    plugSetDefs,
    collectibleDefs
  );
}

function findIntrinsicPerk(
  itemDef: DestinyInventoryItemDefinition,
  definitions: AllDestinyManifestComponents["DestinyInventoryItemDefinition"]
) {
  const socket = itemDef.sockets?.socketEntries?.find((socket) => {
    const def = definitions[socket.singleInitialItemHash];
    return (
      def?.uiItemDisplayStyle === "ui_display_style_intrinsic_plug" &&
      def.displayProperties.name
    );
  });

  return socket && definitions[socket.singleInitialItemHash];
}

const bungieUrl = (path: string) =>
  path ? `https://www.bungie.net${path}` : "";

async function notifyItems(
  itemHashes: number[],
  itemDefs: AllDestinyManifestComponents["DestinyInventoryItemDefinition"],
  damageTypesDefs: AllDestinyManifestComponents["DestinyDamageTypeDefinition"],
  plugSetDefs: AllDestinyManifestComponents["DestinyPlugSetDefinition"],
  collectibleDefs: AllDestinyManifestComponents["DestinyCollectibleDefinition"]
) {
  const itemsToNotify = itemHashes
    .map((v) => itemDefs[v])
    .filter(
      (v) =>
        v?.redacted === false &&
        v.displayProperties.name &&
        v.itemCategoryHashes &&
        !v.itemCategoryHashes.includes(3109687656) && // exclude dummies
        v.itemType === DestinyItemType.Weapon
    )
    .sort((itemA, itemB) => {
      const tierScoreA = (itemA.inventory?.tierType || 0) * -1 * 100000;
      const scoreA = tierScoreA + itemA.index;

      const tierScoreB = (itemB.inventory?.tierType || 0) * -1 * 100000;
      const scoreB = tierScoreB + itemB.index;

      return scoreA - scoreB;
    });

  if (itemsToNotify.length < 1) {
    return;
  }

  const messages: (MessageEmbed | string)[][] = [[]];

  for (const item of itemsToNotify) {
    const damageType = damageTypesDefs[item.defaultDamageTypeHash ?? 0];
    const collectible = collectibleDefs[item.collectibleHash ?? 0];
    const intrinsicPerk = findIntrinsicPerk(item, itemDefs);

    const randomPerkSockets =
      item.sockets?.socketEntries.filter(
        (v) =>
          v.randomizedPlugSetHash &&
          PERK_SOCKET_TYPES.includes(v.socketTypeHash)
      ) ?? [];

    const embed = new MessageEmbed()
      .setTitle(item.displayProperties.name)
      .setAuthor(
        item.itemTypeDisplayName,
        bungieUrl(damageType?.displayProperties?.icon)
      )
      .setDescription([
        `_${item.flavorText ?? item.displayProperties.description ?? ""}_`,
        ...(collectible ? ["", collectible?.sourceString] : []),
      ])
      .setThumbnail(bungieUrl(item.displayProperties.icon))
      .setImage(bungieUrl(item.screenshot));

    if (intrinsicPerk && item.inventory?.tierType === TierType.Exotic) {
      embed.addField(
        `Exotic perk`,
        `**${intrinsicPerk.displayProperties.name}:** ${intrinsicPerk.displayProperties.description}`
      );
    } else if (intrinsicPerk) {
      embed.setAuthor(
        embed.author?.name + " - " + intrinsicPerk.displayProperties.name,
        embed.author?.iconURL
      );
    }

    for (const socket of randomPerkSockets) {
      const plugSet = plugSetDefs[socket.randomizedPlugSetHash ?? 0];
      if (!plugSet) continue;

      const curatedPerk = itemDefs[socket.singleInitialItemHash];

      const randomPerks = plugSet.reusablePlugItems
        .filter(
          (plug) =>
            plug.currentlyCanRoll && plug.plugItemHash !== curatedPerk?.hash
        )
        .map((rpi) => itemDefs[rpi.plugItemHash])
        .map((v) => (v && v.displayProperties.name) as string)
        .reduce(
          (acc, v) => (acc.includes(v) ? acc : [...acc, v]),
          [] as string[]
        )
        .join("\n");

      embed.addField(
        curatedPerk?.displayProperties?.name ?? `_No curated perk_`,
        randomPerks,
        true
      );
    }

    const embeds = messages[messages.length - 1];
    embeds.push(embed);

    if (embeds.length === 10) {
      messages.push([]);
    }
  }

  const totalEmbeds = messages.reduce((acc, embeds) => acc + embeds.length, 0);
  logger.info("Sending detailed Discord notifications", {
    totalEmbeds,
    messageCount: messages.length,
  });

  for (const msg of messages) {
    await newWeaponsHook?.send(msg);
  }
}
