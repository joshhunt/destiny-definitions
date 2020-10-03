import util from "util";
import fs from "fs-extra";
import sqlite, { RunResult, Database } from "sqlite3";
import { makeDatabaseKey, downloadFromS3 } from "../s3";
import { schemaSql as versionSchemaSql } from "./version";
sqlite.verbose();

export const dbFilePath = "./database.sqlite";

interface Db {
  db: Database;
  all<T = unknown>(sql: string): Promise<T[]>;

  run: (sql: string, params?: any) => Promise<unknown>;

  get<T = unknown>(sql: string): Promise<T>;
  get<T = unknown>(sql: string, params: any): Promise<T>;
}

let initDbPromise: Promise<Db>;

async function downloadDatabase(forceLatest: boolean = false) {
  const dbExists = await fs.pathExists(dbFilePath);

  if (!forceLatest && dbExists) {
    console.log("Database already exists.");
    return;
  }

  console.log("Databse doesnt exist, downloading it from S3");

  await downloadFromS3(makeDatabaseKey(), dbFilePath);
}

export default function getDb(forceLatest: boolean = false) {
  if (initDbPromise) {
    return initDbPromise;
  }

  initDbPromise = new Promise(async (resolve, reject) => {
    await downloadDatabase(forceLatest);

    const db = new sqlite.Database(dbFilePath);
    const all: Db["all"] = util.promisify(db.all.bind(db));
    const get: Db["get"] = util.promisify(db.get.bind(db));
    const run: Db["run"] = util.promisify(db.run.bind(db));

    const dbPayload = {
      db,
      all,
      get,
      run,
    };

    const dbCb = (result: any, error?: Error) => {
      console.log("Database init:", result);

      if (error) {
        console.error("Database init error:", error);
        reject(error);
      } else {
        resolve(dbPayload);
      }
    };

    db.serialize(() => {
      db.get("PRAGMA foreign_keys = ON").get(versionSchemaSql).get(
        `
          CREATE TABLE IF NOT EXISTS DefinitionTable (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            manifestVersion TEXT NOT NULL,
            bungiePath TEXT NOT NULL,
            s3Key TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            FOREIGN KEY(manifestVersion) REFERENCES Manifest(version),
            UNIQUE(name, manifestVersion)
          );
        `,
        dbCb
      );
    });
  });

  return initDbPromise;
}
