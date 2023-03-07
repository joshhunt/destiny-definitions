import path from "path";

import { getAllVerisons } from "./db";
import logger from "./lib/log";
import { makeMobileWorldContentKey, s3 } from "./s3";
import { getManifestId } from "./utils";

const S3_BUCKET = process.env.S3_BUCKET || "";

if (!S3_BUCKET || S3_BUCKET === "") {
  throw new Error("S3_BUCKET not defined");
}

const LANGUAGE = "en";

async function main() {
  const allVersions = await getAllVerisons();

  for (const version of allVersions) {
    const manifest = version.manifest;
    const manifestId = getManifestId(version.manifest);

    const mobileWorldContentPath = manifest.mobileWorldContentPaths[LANGUAGE];

    const fileName = path.basename(mobileWorldContentPath);
    const s3Key = makeMobileWorldContentKey(manifestId, fileName);

    logger.info("Updating ACL", { id: version.id, s3Key });

    await s3
      .putObjectAcl({ Key: s3Key, Bucket: S3_BUCKET, ACL: "public-read" })
      .promise();
  }
}

main().catch((error) => {
  logger.error("Uncaught top-level error", error);
});
