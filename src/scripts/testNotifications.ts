import { DestinyManifest } from "bungie-api-ts/destiny2";
import httpGet from "../lib/http";
import notify from "../lib/notify";

// const VERSION_ID = "eae0152b-b870-4f29-8b7f-75b0fef50968"; // Splicer launch
const VERSION_ID = "1a7d8d39-ca62-40af-becd-98bca27ed617"; // solstice 2021

async function main() {
  const { data: versionDiff } = await httpGet(
    `https://destiny-definitions.s3-eu-west-1.amazonaws.com/versions/${VERSION_ID}/diff.json`
  );

  // jsonWorldComponentContentPaths.en.DestinyInventoryItemDefinition

  const manifest = {
    version: "94996.21.06.22.1900-3-bnet.38484",
    jsonWorldContentPaths: {
      en: `/common/destiny2_content/json/en/aggregate-${VERSION_ID}.json`,
    },
    jsonWorldComponentContentPaths: {
      en: {
        DestinyInventoryItemDefinition:
          "/common/destiny2_content/json/en/DestinyInventoryItemDefinition-339ab5ed-b919-4d17-9328-cc340f8c2b61.json",
        DestinyPlugSetDefinition:
          "/common/destiny2_content/json/en/DestinyPlugSetDefinition-339ab5ed-b919-4d17-9328-cc340f8c2b61.json",
        DestinyCollectibleDefinition:
          "/common/destiny2_content/json/en/DestinyCollectibleDefinition-339ab5ed-b919-4d17-9328-cc340f8c2b61.json",
        DestinyDamageTypeDefinition:
          "/common/destiny2_content/json/en/DestinyDamageTypeDefinition-339ab5ed-b919-4d17-9328-cc340f8c2b61.json",
        DestinyInventoryBucketDefinition:
          "/common/destiny2_content/json/en/DestinyInventoryBucketDefinition-339ab5ed-b919-4d17-9328-cc340f8c2b61.json",
      },
    },
  } as unknown as DestinyManifest;

  await notify(manifest, versionDiff);
}

// eslint-disable-next-line no-console
main().catch(console.error);
