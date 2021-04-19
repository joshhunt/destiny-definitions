import util from "util";
import fs from "fs-extra";
import sqlite, { Database } from "sqlite3";

import { makeDatabaseKey, downloadFromS3 } from "../s3";

import { schemaSQL as versionSchemaSQL } from "./version";
import { schemaSQL as definitionTableSchemaSQL } from "./definitionTable";
import { DunnoLol } from "./types";
import logger from "../lib/log";

sqlite.verbose();

export const dbFilePath = "./database.sqlite";

interface Db {
  db: Database;
  all<T = unknown>(sql: string): Promise<T[]>;

  run: (sql: string, params?: DunnoLol) => Promise<unknown>;

  get<T = unknown>(sql: string): Promise<T>;
  get<T = unknown>(sql: string, params: DunnoLol): Promise<T>;
}

let initDbPromise: Promise<Db> | undefined;

async function downloadDatabase(forceLatest = false) {
  const dbExists = await fs.pathExists(dbFilePath);
  const argvForce = process.argv.some((v) => v.includes("force"));

  if (!(forceLatest || argvForce) && dbExists) {
    logger.info("Database already exists.", { forceLatest, argvForce });
    return;
  }

  logger.info("Databse doesnt exist, downloading it from S3");

  await downloadFromS3(makeDatabaseKey(), dbFilePath);
}

export function closeDb(db: Database) {
  return new Promise<void>((resolve, reject) => {
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

export default function getDb(forceLatest = false) {
  if (initDbPromise) {
    return initDbPromise;
  }

  initDbPromise = new Promise((resolve, reject) => {
    downloadDatabase(forceLatest).then(() => {
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

      const dbCb = (result: unknown, error?: Error) => {
        logger.info("Database init", { result });

        if (error) {
          logger.error("Database init error", error);
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
  });

  return initDbPromise;
}
