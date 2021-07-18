import Discord from "discord.js";
import logger from "../log";

if (!process.env.DISCORD_DEFINITIONS_HOOK) {
  throw new Error("DISCORD_DEFINITIONS_HOOK not defined");
}

const DISCORD_WEBHOOK_RE =
  /discord\.com\/api\/webhooks\/(?<id>\w+)\/(?<token>[\w-_]+)/i;

function createWebhook(webhookURL: string) {
  const match = webhookURL.match(DISCORD_WEBHOOK_RE);
  const { id, token } = match?.groups ?? {};

  if (!id && !token) {
    return undefined;
  }

  logger.debug("Creating discord webhook", { id, token });

  return new Discord.WebhookClient(id, token, {
    restSweepInterval: -1,
  });
}

export const definitionsHook = createWebhook(
  process.env.DISCORD_DEFINITIONS_HOOK ?? ""
);

export const definitionsBotToken = process.env.DISCORD_BOT_TOKEN;

// export const cmsHook = createWebhook(process.env.DISCORD_CMS_HOOK ?? "");

// export const gtmHook = createWebhook(process.env.DISCORD_GTM_HOOK ?? "");

// export const settingsHook = createWebhook(
//   process.env.DISCORD_SETTINGS_HOOK ?? ""
// );
