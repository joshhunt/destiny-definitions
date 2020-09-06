import { DestinyManifest } from "bungie-api-ts/destiny2";
import getDb, { dbFilePath as _dbFilePath } from "./setup";

export const dbFilePath = _dbFilePath;

export interface Manifest {
  version: string;
  s3Key: string;
  data: DestinyManifest;
  createdAt: Date;
  updatedAt: Date;
}

type DbRecord = Record<string, string>;

function deserialiseManifest(obj: DbRecord): Manifest {
  return {
    version: obj.version,
    s3Key: obj.s3Key,
    data: JSON.parse(obj.data) as DestinyManifest,
    createdAt: new Date(obj.createdAt),
    updatedAt: new Date(obj.updatedAt),
  };
}

export async function getAllManifests(): Promise<Manifest[]> {
  const { all } = await getDb();

  const rows = (await all("SELECT * from Manifest;")) as any[];

  return rows.map(deserialiseManifest);
}

export async function getManifest(version: string): Promise<Manifest | null> {
  const { get } = await getDb();
  const result = await get<DbRecord>(
    `SELECT * from Manifest WHERE version = $version;`,
    {
      $version: version,
    }
  );

  if (!result) {
    return null;
  }

  return deserialiseManifest(result);
}

export async function saveManifestRow(
  manifest: Omit<Manifest, "createdAt" | "updatedAt">
) {
  const { run } = await getDb();

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

  const result = run(sql, params);
  return result;
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

export async function saveDefinitionTableRow(
  defTable: Omit<DefinitionTable, "createdAt" | "updatedAt">
) {
  const { run } = await getDb();

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

  return run(sql, params);
}

function deserialiseDefinitionTable(obj: DbRecord): DefinitionTable {
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
  const { all } = await getDb();

  const rows = await all<DbRecord>(
    `SELECT * from DefinitionTable WHERE manifestVersion = "${version}";`
  );

  return rows.map(deserialiseDefinitionTable);
}
