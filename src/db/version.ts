import { DestinyManifest } from "bungie-api-ts/destiny2";
import logger from "../lib/log";

import getDb from "./setup";
import { DatabaseRecord } from "./types";

export interface Version {
  id: string;
  version: string;
  s3Key: string;
  manifest: DestinyManifest;
  createdAt: Date;
  updatedAt: Date;
}

export type VersionRecord = DatabaseRecord<Version>;

export const schemaSQL = `
  CREATE TABLE IF NOT EXISTS Version (
    id TEXT PRIMARY KEY,
    version TEXT NOT NULL,
    s3Key TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    manifest TEXT NOT NULL
  );
`;

function deserialiseVersionRecord(obj: VersionRecord): Version {
  return {
    id: obj.id,
    version: obj.version,
    s3Key: obj.s3Key,
    manifest: JSON.parse(obj.manifest) as DestinyManifest,
    createdAt: new Date(obj.createdAt),
    updatedAt: new Date(obj.updatedAt),
  };
}

export async function getAllVerisons(): Promise<Version[]> {
  const { all } = await getDb();

  const rows = await all<VersionRecord>("SELECT * from Version;");

  return rows.map(deserialiseVersionRecord);
}

export async function getVersion(id: string): Promise<Version | null> {
  const { get } = await getDb();
  const result = await get<VersionRecord>(
    `SELECT * from Version WHERE id = $id;`,
    { $id: id }
  );

  if (!result) {
    return null;
  }

  return deserialiseVersionRecord(result);
}

export async function saveVersionRow(
  version: Omit<Version, "createdAt" | "updatedAt"> & { createdAt?: Date }
) {
  const { run } = await getDb();

  if (version.createdAt) {
    logger.warn("version.createdAt was specified when saving version row");
  }

  const payload: Version = {
    ...version,
    updatedAt: new Date(),
    createdAt: version.createdAt || new Date(),
  };

  const sql = `
      INSERT INTO Version( id, version,   s3Key,  manifest,  createdAt,  updatedAt)
                   VALUES($id, $version, $s3Key, $manifest, $createdAt, $updatedAt)

        ON CONFLICT(id) DO UPDATE SET
          version=excluded.version,
          s3Key=excluded.s3Key,
          manifest=excluded.manifest,
          updatedAt=excluded.updatedAt
      ;
    `;

  const params = {
    $id: payload.id,
    $version: payload.version,
    $s3Key: payload.s3Key,
    $manifest: JSON.stringify(payload.manifest),
    $createdAt: payload.createdAt.toISOString(),
    $updatedAt: payload.updatedAt.toISOString(),
  };

  const result = run(sql, params);
  return result;
}
