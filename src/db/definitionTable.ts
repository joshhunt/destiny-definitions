import getDb from "./setup";
import { DatabaseRecord } from "./types";

export interface DefinitionTable {
  name: string;
  bungiePath: string;
  s3Key: string;
  versionId: string;
  createdAt: Date;
  updatedAt: Date;
}

type DefinitionTableRecord = DatabaseRecord<DefinitionTable>;

export const schemaSQL = `
CREATE TABLE IF NOT EXISTS DefinitionTable (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  versionId TEXT NOT NULL,
  bungiePath TEXT NOT NULL,
  s3Key TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY(versionId) REFERENCES Version(id),
  UNIQUE(name, versionId)
);
`;

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
    INSERT INTO DefinitionTable( name,  bungiePath,  s3Key,  versionId,  createdAt,  updatedAt)
                         VALUES($name, $bungiePath, $s3Key, $versionId, $createdAt, $updatedAt)
      ON CONFLICT(name, versionId) DO UPDATE SET
        bungiePath=excluded.bungiePath,
        s3Key=excluded.s3Key,
        updatedAt=excluded.updatedAt
    ;
  `;

  const params = {
    $name: payload.name,
    $bungiePath: payload.bungiePath,
    $s3Key: payload.s3Key,
    $versionId: payload.versionId,
    $createdAt: payload.createdAt.toISOString(),
    $updatedAt: payload.updatedAt.toISOString(),
  };

  return run(sql, params);
}

function deserialiseDefinitionTable(
  obj: DefinitionTableRecord
): DefinitionTable {
  return {
    name: obj.name,
    bungiePath: obj.bungiePath,
    s3Key: obj.s3Key,
    versionId: obj.versionId,
    createdAt: new Date(obj.createdAt),
    updatedAt: new Date(obj.updatedAt),
  };
}

export async function getTablesForVersion(
  version: string
): Promise<DefinitionTable[]> {
  const { all } = await getDb();

  const rows = await all<DefinitionTableRecord>(
    `SELECT * from DefinitionTable WHERE versionId = "${version}";`
  );

  return rows.map(deserialiseDefinitionTable);
}
