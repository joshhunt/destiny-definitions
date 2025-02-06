import logger from "./lib/log";
import http from "./lib/http";
import { getFromS3 } from "./s3";

interface ArchiveIndexVersion {
  id: string;
  version: string;
  s3Key: string;
  createdAt: string; // dates as strings
  updatedAt: string; // dates as strings
}

export async function getArchiveIndex() {
  return await getFromS3("index.json");
}

export async function archiveIndexHasVersion(
  index: ArchiveIndexVersion[],
  versionId: string
): Promise<ArchiveIndexVersion | null> {
  const mostRecentVersion = index[index.length - 1];

  if (mostRecentVersion.id === versionId) {
    return mostRecentVersion;
  }

  const foundVersion = index.find((v) => v.id === versionId);

  if (foundVersion) {
    logger.warn("Found version in index, but it's not the last one", {
      versionId,
      foundVersion,
    });

    return foundVersion;
  }

  return null;
}
