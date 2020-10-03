import fs from "fs-extra";

import { dbFilePath, getAllVerisons } from "./db";
import uploadToS3, {
  makeDatabaseKey,
  makeVersionedDatabaseKey,
  makeIndexKey,
} from "./s3";
import getDb, { closeDb } from "./db/setup";
import { DestinyManifest } from "bungie-api-ts/destiny2";
import { getManifestId } from "./utils";
import { writeLastVersionFile } from "./lastVersion";

export async function createIndex() {
  const allManifests = await getAllVerisons();

  const index = allManifests.map((manifest) => {
    return {
      ...manifest,
      data: undefined,
      manifest: undefined,
    };
  });

  return uploadToS3(
    makeIndexKey(),
    JSON.stringify(index, null, 2),
    "application/json",
    "public-read"
  );
}

export async function finish(manifest: DestinyManifest) {
  const { db } = await getDb();
  const manifestId = getManifestId(manifest);

  await closeDb(db);

  const dbFile = await fs.readFile(dbFilePath);

  await writeLastVersionFile({ id: manifestId });

  await uploadToS3(makeDatabaseKey(), dbFile, "application/vnd.sqlite3");
  await uploadToS3(
    makeVersionedDatabaseKey(manifestId),
    dbFile,
    "application/vnd.sqlite3"
  );
}
