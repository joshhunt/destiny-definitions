import { DestinyManifest } from "bungie-api-ts/destiny2";

const LANGUAGE = "en";
const GUID_REGEX = /(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}/;

export function getGuidFromManifest(manifest: DestinyManifest) {
  const url = manifest.jsonWorldContentPaths[LANGUAGE];

  const reMatch = url.match(GUID_REGEX);
  return reMatch?.[0];
}
