import fs from "fs-extra";

import { dbFilePath, getAllManifests } from "./db";
import uploadToS3, {
  makeDatabaseKey,
  makeVersionedDatabaseKey,
  makeIndexKey,
} from "./s3";
import getDb from "./db/setup";

export async function createIndex() {
  const allManifests = await getAllManifests();

  const index = allManifests.map((manifest) => {
    return {
      ...manifest,
      data: undefined,
    };
  });

  return uploadToS3(
    makeIndexKey(),
    JSON.stringify(index, null, 2),
    "application/json",
    "public-read"
  );
}

export async function finish(version: string) {
  const { db } = await getDb();

  return new Promise((resolve) => {
    db.close(async (error) => {
      if (error) {
        console.error("Error closing database");
        console.error(error);
      }

      const dbFile = await fs.readFile(dbFilePath);

      await fs.writeJSON("./latestVersion.json", { version });

      await uploadToS3(makeDatabaseKey(), dbFile, "application/vnd.sqlite3");
      await uploadToS3(
        makeVersionedDatabaseKey(version),
        dbFile,
        "application/vnd.sqlite3"
      );

      resolve();
    });
  });
}
