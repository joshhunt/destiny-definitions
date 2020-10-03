import fs from "fs-extra";
var FILENAME = "./lastVersion.json";
export function readLastVersionFile() {
    return fs.readJSON(FILENAME).then(function (d) { return d; });
}
export function writeLastVersionFile(data) {
    return fs.writeJSON(FILENAME, data);
}
