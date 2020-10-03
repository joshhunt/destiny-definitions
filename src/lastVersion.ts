import fs from "fs-extra";

const FILENAME = "./lastVersion.json";

interface LastVersionFile {
  // version: string;
  id: string;
}

export function readLastVersionFile() {
  return fs.readJSON(FILENAME).then((d) => d as LastVersionFile);
}

export function writeLastVersionFile(data: LastVersionFile) {
  return fs.writeJSON(FILENAME, data);
}
