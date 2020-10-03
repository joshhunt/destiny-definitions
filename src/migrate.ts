import { DestinyManifest } from "bungie-api-ts/destiny2";
import fs from "fs-extra";
import path from "path";

import { DefinitionTable, Version } from "./db";
import diffManifestVersion from "./diff";
import { createIndex, finish } from "./extraTasks";
import processManifest from "./manifest";
import { getManifestId } from "./utils";

interface ExportEntry {
  version: Omit<Version, "createdAt"> & {
    createdAt: string;
    data: DestinyManifest;
  };
  tables: DefinitionTable[];
}

async function processVersion(version: ExportEntry["version"]) {
  const manifest = version.data;
  const createdAt = version.createdAt;

  if (!manifest) {
    throw new Error("missing manifest");
  }

  console.log("Processing manifest");
  await processManifest(manifest, new Date(createdAt));

  console.log("Creating diff");
  const diffResults = await diffManifestVersion(manifest);

  console.log("Creating index");
  await createIndex();

  console.log("Finishing up");
  await finish(manifest);
}

async function main() {
  const dataExport: ExportEntry[] = await fs.readJSON("./export.json");

  console.log("Loaded", dataExport.length, "versions from export.json");

  const versions = dataExport.map((data) => {
    if (!data.version.data) {
      throw new Error("missing data.version.data");
    }

    data.version.data.mobileWorldContentPaths[
      "en"
    ] = `https://destiny-definitions-new-source.s3-eu-west-1.amazonaws.com/versions/${
      data.version.version
    }/${path.basename(data.version.data.mobileWorldContentPaths["en"])}`;

    Object.keys(data.version.data.jsonWorldComponentContentPaths["en"]).forEach(
      (tableName) => {
        const table = data.tables.find((v) => v.name === tableName);
        if (!data.version.data || !table) {
          throw new Error("missing table");
        }

        data.version.data.jsonWorldComponentContentPaths["en"][
          tableName
        ] = `https://destiny-definitions-new-source.s3-eu-west-1.amazonaws.com/${table.s3Key}`;
      }
    );

    return data.version;
  });

  await fs.writeJSON("./exportNew.json", versions, {
    spaces: 2,
  });

  for (const version of versions) {
    console.log(
      "\n\nPropcessing verson",
      (version.data || version.manifest).version,
      "->",
      getManifestId(version.data || version.manifest),
      "created at",
      new Date(version.createdAt)
    );
    await processVersion(version);
  }
}

main().catch((err) => {
  console.error("Uncaught top-level error");
  console.error(err);
});
