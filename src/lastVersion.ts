import axios from "axios";
import logger from "./lib/log";

interface IndexVersion {
  id: string;
  version: string;
  s3Key: string;
  createdAt: string; // dates as strings
  updatedAt: string; // dates as strings
}

export async function indexHasVersion(
  versionId: string
): Promise<IndexVersion | null> {
  const resp = await axios.get<IndexVersion[]>(
    "https://destiny-definitions.s3-eu-west-1.amazonaws.com/index.json"
  );

  const mostRecentVersion = resp.data[resp.data.length - 1];

  if (mostRecentVersion.id === versionId) {
    return mostRecentVersion;
  }

  const foundVersion = resp.data.find((v) => v.id === versionId);

  if (foundVersion) {
    logger.warn("Found version in index, but it's not the last one", {
      versionId,
      foundVersion,
    });

    return foundVersion;
  }

  return null;
}
