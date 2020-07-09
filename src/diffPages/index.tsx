import React from "react";
import ReactDOMServer from "react-dom/server";

import TableDiffPage from "./TableDiffPage";
import { AllTableDiff } from "../diff";
import uploadToS3, { makeTableDiffHtmlKey } from "../s3";

export async function makeDiffPages(version: string, diffData: AllTableDiff) {
  for (const [tableName, diffForTable] of Object.entries(diffData)) {
    const hasChanged = Object.values(diffForTable).some((v) => v.length > 0);

    if (!hasChanged) {
      continue;
    }

    const html = ReactDOMServer.renderToString(
      <TableDiffPage tableName={tableName} diff={diffForTable} />
    );

    const s3Key = makeTableDiffHtmlKey(version, tableName);

    await uploadToS3(s3Key, html, "text/html", "public-read");
  }
}
