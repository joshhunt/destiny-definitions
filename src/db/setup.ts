import util from "util";
import fs from "fs-extra";
import sqlite, { RunResult, Database } from "sqlite3";

import { makeDatabaseKey, downloadFromS3 } from "../s3";

import { schemaSQL as versionSchemaSQL } from "./version";
import { schemaSQL as definitionTableSchemaSQL } from "./definitionTable";

sqlite.verbose();

export const dbFilePath = "./database.sqlite";

interface Db {
  db: Database;
  all<T = unknown>(sql: string): Promise<T[]>;

  run: (sql: string, params?: any) => Promise<unknown>;

  get<T = unknown>(sql: string): Promise<T>;
  get<T = unknown>(sql: string, params: any): Promise<T>;
}

let initDbPromise: Promise<Db> | undefined;

async function downloadDatabase(forceLatest: boolean = false) {
  const dbExists = await fs.pathExists(dbFilePath);

  if (!forceLatest && dbExists) {
    console.log("Database already exists.");
    return;
  }

  console.log("Databse doesnt exist, downloading it from S3");

  await downloadFromS3(makeDatabaseKey(), dbFilePath);
}

export function closeDb(db: Database) {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
        return;
      }

      initDbPromise = undefined;
      resolve();
    });
  });
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
      db.run("PRAGMA foreign_keys = ON").run(versionSchemaSQL);

      db.run("PRAGMA foreign_keys = ON").run(definitionTableSchemaSQL, dbCb);
    });
  });

  return initDbPromise;
}
