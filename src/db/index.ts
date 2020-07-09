import util from "util";
import { DestinyManifest } from "bungie-api-ts/destiny2";
import { db as _db, dbFilePath as _dbFilePath } from "./setup";

export const db = _db;
export const dbFilePath = _dbFilePath;

const all = util.promisify(db.all.bind(db));

export interface Manifest {
  version: string;
  s3Key: string;
  data: DestinyManifest;
  createdAt: Date;
  updatedAt: Date;
}

function deserialiseManifest(obj: any): Manifest {
  return {
    version: obj.version,
    s3Key: obj.s3Key,
    data: JSON.parse(obj.data) as DestinyManifest,
    createdAt: new Date(obj.createdAt),
    updatedAt: new Date(obj.updatedAt),
  };
}

export async function getAllManifests(): Promise<Manifest[]> {
  const rows = (await all("SELECT * from Manifest;")) as any[];

  return rows.map(deserialiseManifest);
}

export function getManifest(version: string): Promise<Manifest | null> {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * from Manifest WHERE version = $version;`,
      {
        $version: version,
      },
      (err, result: any) => {
        if (err) {
          return reject(err);
        }

        if (!result) {
          return resolve(null);
        }

        resolve(deserialiseManifest(result));
      }
    );
  });
}

export function saveManifestRow(
  manifest: Omit<Manifest, "createdAt" | "updatedAt">
) {
  return new Promise((resolve, reject) => {
    const payload: Manifest = {
      ...manifest,
      updatedAt: new Date(),
      createdAt: new Date(),
    };

    const sql = `
      INSERT INTO Manifest(version, s3Key, createdAt, updatedAt, data)
        VALUES($version, $s3Key, $createdAt, $updatedAt, $data)
        ON CONFLICT(version) DO UPDATE SET
          data=excluded.data,
          s3Key=excluded.s3Key,
          updatedAt=excluded.updatedAt
      ;
    `;

    const params = {
      $version: payload.version,
      $s3Key: payload.s3Key,
      $data: JSON.stringify(payload.data),
      $createdAt: payload.createdAt.toISOString(),
      $updatedAt: payload.updatedAt.toISOString(),
    };

    const cb = (err: Error | null, result: any) => {
      return err ? reject(err) : resolve(result);
    };

    db.run(sql, params, cb);
  });
}

export interface DefinitionTable {
  // id?: number;
  name: string;
  bungiePath: string;
  s3Key: string;
  manifestVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

export function saveDefinitionTableRow(
  defTable: Omit<DefinitionTable, "createdAt" | "updatedAt">
) {
  return new Promise((resolve, reject) => {
    const payload: DefinitionTable = {
      ...defTable,
      updatedAt: new Date(),
      createdAt: new Date(),
    };

    const sql = `
      INSERT INTO DefinitionTable(name, bungiePath, s3Key, manifestVersion, createdAt, updatedAt)
        VALUES($name, $bungiePath, $s3Key, $manifestVersion, $createdAt, $updatedAt)
        ON CONFLICT(name, manifestVersion) DO UPDATE SET
          bungiePath=excluded.bungiePath,
          s3Key=excluded.s3Key,
          updatedAt=excluded.updatedAt
      ;
    `;

    const params = {
      $name: payload.name,
      $bungiePath: payload.bungiePath,
      $s3Key: payload.s3Key,
      $manifestVersion: payload.manifestVersion,
      $createdAt: payload.createdAt.toISOString(),
      $updatedAt: payload.updatedAt.toISOString(),
    };

    const cb = (err: Error | null, result: any) => {
      return err ? reject(err) : resolve(result);
    };

    db.run(sql, params, cb);
  });
}

function deserialiseDefinitionTable(obj: any): DefinitionTable {
  return {
    name: obj.name,
    bungiePath: obj.bungiePath,
    s3Key: obj.s3Key,
    manifestVersion: obj.manifestVersion,
    createdAt: new Date(obj.createdAt),
    updatedAt: new Date(obj.updatedAt),
  };
}

export async function getTablesForVersion(
  version: string
): Promise<DefinitionTable[]> {
  const rows = (await all(
    `SELECT * from DefinitionTable WHERE manifestVersion = "${version}";`
  )) as any[];

  return rows.map(deserialiseDefinitionTable);
}
