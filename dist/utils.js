var LANGUAGE = "en";
var GUID_REGEX = /(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}/;
export function getGuidFromManifest(manifest) {
    var url = manifest.jsonWorldContentPaths[LANGUAGE];
    var reMatch = url.match(GUID_REGEX);
    return reMatch === null || reMatch === void 0 ? void 0 : reMatch[0];
}
