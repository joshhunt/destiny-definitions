import { getAllVerisons } from "./db";
import diffManifestVersion from "./diff";

async function main() {
  const allVersions = await getAllVerisons();

  for (const manifestVersion of allVersions) {
    await diffManifestVersion(manifestVersion.manifest);
  }
}

main().catch((err) => {
  console.error("Uncaught top-level error");
  console.error(err);
});
