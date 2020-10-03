import fs from "fs";
import dotenv from "dotenv";
import AWS from "aws-sdk";
import { reject } from "async";

dotenv.config();
const S3_BUCKET = process.env.S3_BUCKET || "";
const s3 = new AWS.S3();

if (!S3_BUCKET || S3_BUCKET === "") {
  throw new Error("S3_BUCKET not defined");
}

export async function getFromS3<T>(key: string): Promise<T> {
  const resp = await s3.getObject({ Key: key, Bucket: S3_BUCKET }).promise();

  if (!resp.Body) {
    throw new Error("resp.Body is undefined.");
  }

  const obj = JSON.parse(resp.Body.toString("utf-8"));

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

export default async function uploadToS3(
  key: string,
  body: string | Buffer,
  contentType: string = "application/json",
  acl?: string
) {
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
