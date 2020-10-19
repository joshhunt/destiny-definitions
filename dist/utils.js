var LANGUAGE = "en";
var GUID_REGEX = /(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}/;
export function getManifestId(manifest) {
    var url = manifest.jsonWorldContentPaths[LANGUAGE];
    var reMatch = url.match(GUID_REGEX);
    var id = reMatch === null || reMatch === void 0 ? void 0 : reMatch[0];
    if (!id) {
        console.error("Could not get ID from manifest", manifest);
        throw new Error("Could not get ID from manifest");
    }
    return id;
}
export function friendlyDiffName(name) {
    var match = name.match(/Destiny(\w+)Definition/);
    return match ? match[1] : name;
}
