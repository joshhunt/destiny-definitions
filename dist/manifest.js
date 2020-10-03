var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import path from "path";
import axios from "axios";
import { saveVersionRow, saveDefinitionTableRow } from "./db";
import uploadToS3, { makeManifestKey, makeDefinitionTableKey, makeMobileWorldContentKey, } from "./s3";
import { getManifestId } from "./utils";
import { bungieUrl } from "./bungie";
var LANGUAGE = "en";
export default function processManifest(manifest, createdAt) {
    return __awaiter(this, void 0, void 0, function () {
        var manifestId, manifestS3Key, tables, entries, _i, entries_1, _a, tableName, bungiePath;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    manifestId = getManifestId(manifest);
                    manifestS3Key = makeManifestKey(manifestId);
                    return [4 /*yield*/, uploadToS3(manifestS3Key, JSON.stringify(manifest))];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, uploadMobileWorldContent(manifestId, manifest)];
                case 2:
                    _b.sent();
                    console.log("Saving manifest to DB");
                    return [4 /*yield*/, saveVersionRow({
                            id: manifestId,
                            version: manifest.version,
                            manifest: manifest,
                            s3Key: manifestS3Key,
                            createdAt: createdAt,
                        })];
                case 3:
                    _b.sent();
                    tables = manifest.jsonWorldComponentContentPaths[LANGUAGE];
                    entries = Object.entries(tables);
                    _i = 0, entries_1 = entries;
                    _b.label = 4;
                case 4:
                    if (!(_i < entries_1.length)) return [3 /*break*/, 7];
                    _a = entries_1[_i], tableName = _a[0], bungiePath = _a[1];
                    return [4 /*yield*/, processDefinitionTable(manifestId, tableName, bungiePath)];
                case 5:
                    _b.sent();
                    _b.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function uploadMobileWorldContent(manifestId, manifest) {
    return __awaiter(this, void 0, void 0, function () {
        var mobileWorldContentPath, resp, fileName, s3Key;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mobileWorldContentPath = manifest.mobileWorldContentPaths[LANGUAGE];
                    return [4 /*yield*/, axios.get(bungieUrl(mobileWorldContentPath), {
                            responseType: "arraybuffer",
                        })];
                case 1:
                    resp = _a.sent();
                    fileName = path.basename(mobileWorldContentPath);
                    s3Key = makeMobileWorldContentKey(manifestId, fileName);
                    return [4 /*yield*/, uploadToS3(s3Key, resp.data)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, s3Key];
            }
        });
    });
}
function processDefinitionTable(manifestId, tableName, bungiePath) {
    return __awaiter(this, void 0, void 0, function () {
        var resp, s3Key;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Processing table " + tableName);
                    return [4 /*yield*/, axios.get(bungieUrl(bungiePath), {
                            transformResponse: function (res) { return res; },
                            responseType: "json",
                        })];
                case 1:
                    resp = _a.sent();
                    s3Key = makeDefinitionTableKey(manifestId, tableName);
                    return [4 /*yield*/, uploadToS3(s3Key, resp.data, "application/json", "public-read")];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, saveDefinitionTableRow({
                            name: tableName,
                            versionId: manifestId,
                            bungiePath: bungiePath,
                            s3Key: s3Key,
                        })];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
