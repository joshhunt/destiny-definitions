import getDefinitionMetadata from "../../definitionsMetadata";
import { AllTableDiff } from "../../diff";

export function createSortedDiffSummary(diffData: AllTableDiff) {
  const sortedDiff = Object.entries(diffData)
    .sort(([nameA], [nameB]) => {
      const indexA = getDefinitionMetadata(nameA).index;
      const indexB = getDefinitionMetadata(nameB).index;

      return indexA - indexB;
    })
    .map(([tableName, diff]) => ({
      tableName,
      diff: {
        added: diff.added.length,
        removed: diff.removed.length,
        unclassified: diff.unclassified.length,
        reclassified: diff.reclassified.length,
        modified: diff.modified.length,
      },
    }))
    .filter((diff) => {
      return (
        diff.diff.added ||
        diff.diff.removed ||
        diff.diff.unclassified ||
        diff.diff.reclassified ||
        diff.diff.modified
      );
    });

  const mainDiff = sortedDiff.filter(
    (d) => !getDefinitionMetadata(d.tableName).junk
  );

  const junkDiff = sortedDiff.filter(
    (d) => getDefinitionMetadata(d.tableName).junk
  );

  const junkCount = junkDiff.reduce((acc, table) => {
    return (
      acc +
      table.diff.added +
      table.diff.modified +
      table.diff.reclassified +
      table.diff.removed +
      table.diff.unclassified
    );
  }, 0);

  return { mainDiff, junkDiff, junkCount };
}
