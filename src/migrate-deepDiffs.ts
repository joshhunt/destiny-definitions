import { DestinyManifest } from "bungie-api-ts/destiny2";
import fs from "fs-extra";
import path from "path";

import { DefinitionTable, getAllVerisons, getVersion, Version } from "./db";
import diffManifestVersion from "./diff";
import { createIndex, finish } from "./extraTasks";
import processManifest from "./manifest";
import { getManifestId } from "./utils";

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
