import { getAllManifests } from "./db";
import getDb from "./db/setup";
import { getGuidFromManifest } from "./utils";

async function main() {
  console.log("hello");

  await getDb(true);

  const manifests = await getAllManifests();

  console.log("\nManifest versions:");
  manifests.forEach((manifest) => {
    const guid = getGuidFromManifest(manifest.data);

    console.log("  version:", manifest.version);
    console.log("  created at:", manifest.createdAt);
    console.log("  json path:", manifest.data.jsonWorldContentPaths.en);
    console.log("  guid:", guid);
    console.log("");
  });
}

main().catch((err) => {
  console.error("Uncaught top-level error");
  console.error(err);
});
