import dotenv from "dotenv";
import axios from "axios";
import { DestinyManifest, ServerResponse } from "bungie-api-ts/destiny2";
import logger from "./lib/log";
import { String } from "aws-sdk/clients/cloudsearch";

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

const cacheBusterStrings = [
  "",
  "?destiny-definitions",
  `?destiny-definitions-${Math.random()}`,
];

export async function getDefinitionTable(
  tableName: string,
  bungiePath: string
): Promise<string> {
  let error: unknown;

  for (const cacheBust of cacheBusterStrings) {
    cacheBust &&
      logger.info("Requesting definition with cache buster", {
        tableName,
        bungiePath,
        cacheBust,
      });

    try {
      const resp = await axios.get(`${bungieUrl(bungiePath)}${cacheBust}`, {
        transformResponse: (res: any) => res,
        responseType: "json",
      });

      if (resp.data) {
        return resp.data;
      }

      error = new Error("resp.data was empty");
      logger.warn("Error loading definition from bungie", {
        tableName,
        bungiePath,
        error,
        status: resp.status,
        statusText: resp.statusText,
      });
    } catch (requestError) {
      error = requestError;

      logger.warn("Exception loading definition from bungie", {
        tableName,
        bungiePath,
        error,
      });
    }
  }

  logger.error("Exhausted all attempts to load definition", {
    tableName,
    error,
  });

  throw new Error(`Exhausted all attempts to load definition ${tableName}`);
}
