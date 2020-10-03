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
