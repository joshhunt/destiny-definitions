import dotenv from "dotenv";
import axios from "axios";
import { DestinyManifest, ServerResponse } from "bungie-api-ts/destiny2";
import logger from "./lib/log";

dotenv.config();
const BUNGIE_API_KEY = process.env.BUNGIE_API_KEY || "";

if (!BUNGIE_API_KEY || BUNGIE_API_KEY === "") {
  throw new Error("BUNGIE_API_KEY not defined");
}

export function getManifest() {
  const url = `https://www.bungie.net/Platform/Destiny2/Manifest?bust=${Date.now()}`;
  logger.info("Requesting Manifest", { url });

  return axios.get<ServerResponse<DestinyManifest>>(url, {
    headers: {
      "x-api-key": BUNGIE_API_KEY,
    },
  });
}

export function bungieUrl(urlBase: string) {
  if (urlBase.includes("https://") || urlBase.includes("http://")) {
    return urlBase;
  }

  return `https://www.bungie.net${urlBase}`;
}
