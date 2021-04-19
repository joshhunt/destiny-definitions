import { getAllVerisons } from "./db";
import diffManifestVersion from "./diff";
import logger from "./lib/log";

async function main() {
  const allVersions = await getAllVerisons();

  for (const manifestVersion of allVersions) {
    await diffManifestVersion(manifestVersion.manifest);
  }
}

main().catch((error) => {
  logger.error("Uncaught top-level error", error);
});
