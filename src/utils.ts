import { DestinyManifest } from "bungie-api-ts/destiny2";

const LANGUAGE = "en";
const GUID_REGEX = /(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}/;

export function getManifestId(manifest: DestinyManifest) {
  const url = manifest.jsonWorldContentPaths[LANGUAGE];

  const reMatch = url.match(GUID_REGEX);

  const id = reMatch?.[0];

  if (!id) {
    console.error("Could not get ID from manifest", manifest);
    throw new Error("Could not get ID from manifest");
  }

  return id;
}
