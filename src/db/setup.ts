import sqlite, { RunResult } from "sqlite3";
sqlite.verbose();

export const dbFilePath = "./database.sqlite";
export const db = new sqlite.Database(dbFilePath);

const dbCb = (result: any, error?: Error) => {
  result && console.log("Database init:", result);
  error && console.error("Database init error:", error);
};

db.serialize(() => {
  db.get("PRAGMA foreign_keys = ON");

  db.get(
    `
    CREATE TABLE IF NOT EXISTS Manifest (
      version TEXT PRIMARY KEY,
      s3Key TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      data TEXT NOT NULL
    );
  `,
    dbCb
  );

  db.get(
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
