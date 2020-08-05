import sqlite from "sqlite3";
sqlite.verbose();
export var dbFilePath = "./database.sqlite";
export var db = new sqlite.Database(dbFilePath);
var dbCb = function (result, error) {
    result && console.log("Database init:", result);
    error && console.error("Database init error:", error);
};
db.serialize(function () {
    db.get("PRAGMA foreign_keys = ON");
    db.get("\n    CREATE TABLE IF NOT EXISTS Manifest (\n      version TEXT PRIMARY KEY,\n      s3Key TEXT NOT NULL,\n      createdAt TEXT NOT NULL,\n      updatedAt TEXT NOT NULL,\n      data TEXT NOT NULL\n    );\n  ", dbCb);
    db.get("\n    CREATE TABLE IF NOT EXISTS DefinitionTable (\n      id INTEGER PRIMARY KEY,\n      name TEXT NOT NULL,\n      manifestVersion TEXT NOT NULL,\n      bungiePath TEXT NOT NULL,\n      s3Key TEXT NOT NULL,\n      createdAt TEXT NOT NULL,\n      updatedAt TEXT NOT NULL,\n      FOREIGN KEY(manifestVersion) REFERENCES Manifest(version),\n      UNIQUE(name, manifestVersion)\n    );\n  ", dbCb);
});
