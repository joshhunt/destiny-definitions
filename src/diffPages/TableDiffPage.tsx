import React from "react";
import { TableDiff } from "../diff";
import DiffSet from "./DiffSet";

interface TableDiffPageProps {
  tableName: string;
  diff: TableDiff;
}

export default function TableDiffPage({ tableName, diff }: TableDiffPageProps) {
  return (
    <div>
      <h1>Diffs for {tableName}</h1>

      {diff.added.length > 0 && <DiffSet title="Added" diff={diff.added} />}

      {diff.removed.length > 0 && (
        <DiffSet title="Removed" diff={diff.removed} />
      )}

      {diff.unclassified.length > 0 && (
        <DiffSet title="Unclassified" diff={diff.unclassified} />
      )}

      {diff.reclassified.length > 0 && (
        <DiffSet title="Reclassified" diff={diff.reclassified} />
      )}
    </div>
  );
}
