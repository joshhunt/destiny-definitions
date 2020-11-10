import fs from "fs-extra";
import path from "path";
import dotenv from "dotenv";
import AWS from "aws-sdk";

dotenv.config();
const S3_BUCKET = process.env.S3_BUCKET || "";
const s3 = new AWS.S3();

if (!S3_BUCKET || S3_BUCKET === "") {
  throw new Error("S3_BUCKET not defined");
}

async function fileExists(path: string) {
  try {
    await fs.access(path);
    return true;
  } catch (error) {
    return false;
  }
}

export async function getFromS3<T>(key: string): Promise<T> {
  if (process.env.LOCAL_S3) {
    const localPath = await s3KeyToLocalPath(key);

    if (await fileExists(localPath)) {
      return (await fs.readJSON(localPath)) as T;
    } else {
    }
  }

  const resp = await s3.getObject({ Key: key, Bucket: S3_BUCKET }).promise();

  if (!resp.Body) {
    throw new Error("resp.Body is undefined.");
  }

  const bodyString = resp.Body.toString("utf-8");

  if (process.env.LOCAL_S3) {
    await saveLocally(key, bodyString);
  }

  const obj = JSON.parse(bodyString);

  return obj as T;
}

export async function downloadFromS3(
  key: string,
  destPath: string
): Promise<null> {
  return new Promise((resolve, reject) => {
    const readStream = s3
      .getObject({ Key: key, Bucket: S3_BUCKET })
      .createReadStream();

    const writeStream = fs.createWriteStream(destPath);

    readStream.on("end", () => resolve());

    readStream.on("error", (err) => {
      console.error("Error with the read stream", err);
      reject(err);
    });

    writeStream.on("error", (err) => {
      console.error("Error with the write stream", err);
      reject(err);
    });

    readStream.pipe(writeStream);
  });
}

async function s3KeyToLocalPath(key: string) {
  const localPath = path.join(".", "localS3", S3_BUCKET, ...key.split("/"));
  const localFolder = path.dirname(localPath);

  await fs.mkdirp(localFolder);

  return localPath;
}

async function saveLocally(key: string, body: string | Buffer) {
  const localPath = await s3KeyToLocalPath(key);
  await fs.writeFile(localPath, body);
}

export default async function uploadToS3(
  key: string,
  body: string | Buffer,
  contentType: string = "application/json",
  acl?: string
) {
  if (process.env.LOCAL_S3) {
    await saveLocally(key, body);
    return { key };
  }

  const putResponse = await s3
    .putObject({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: contentType,
      Body: body,
      ACL: acl,
    })
    .promise();

  return {
    key,
    putResponse,
  };
}

export const makeIndexKey = () => `index.json`;
export const makeDatabaseKey = () => `database.sqlite`;

export const makeVersionedDatabaseKey = (id: string) =>
  `versions/${id}/database.sqlite`;

export const makeManifestKey = (id: string) => `versions/${id}/manifest.json`;

export const makeMobileWorldContentKey = (id: string, fileName: string) =>
  `versions/${id}/${fileName}`;

export const makeDefinitionTableKey = (id: string, table: string) =>
  `versions/${id}/tables/${table}.json`;

export const makeDiffKey = (id: string) => `versions/${id}/diff.json`;

export const makeTableModifiedDiffKey = (id: string, tableName: string) =>
  `versions/${id}/modifiedDiffs/${tableName}.json`;
