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
import dotenv from "dotenv";
import AWS from "aws-sdk";
dotenv.config();
var S3_BUCKET = process.env.S3_BUCKET || "";
var s3 = new AWS.S3();
if (!S3_BUCKET || S3_BUCKET === "") {
    throw new Error("S3_BUCKET not defined");
}
export function getFromS3(key) {
    return __awaiter(this, void 0, void 0, function () {
        var resp, obj;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, s3.getObject({ Key: key, Bucket: S3_BUCKET }).promise()];
                case 1:
                    resp = _a.sent();
                    if (!resp.Body) {
                        throw new Error("resp.Body is undefined.");
                    }
                    obj = JSON.parse(resp.Body.toString("utf-8"));
                    return [2 /*return*/, obj];
            }
        });
    });
}
export default function uploadToS3(key, body, contentType, acl) {
    if (contentType === void 0) { contentType = "application/json"; }
    return __awaiter(this, void 0, void 0, function () {
        var putResponse;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, s3
                        .putObject({
                        Bucket: S3_BUCKET,
                        Key: key,
                        ContentType: contentType,
                        Body: body,
                        ACL: acl,
                    })
                        .promise()];
                case 1:
                    putResponse = _a.sent();
                    return [2 /*return*/, {
                            key: key,
                            putResponse: putResponse,
                        }];
            }
        });
    });
}
export var makeIndexKey = function () { return "index.json"; };
export var makeDatabaseKey = function () { return "database.sqlite"; };
export var makeVersionedDatabaseKey = function (version) {
    return "versions/" + version + "/database.sqlite";
};
export var makeManifestKey = function (version) {
    return "versions/" + version + "/manifest.json";
};
export var makeMobileWorldContentKey = function (version, fileName) {
    return "versions/" + version + "/" + fileName;
};
export var makeDefinitionTableKey = function (version, table) {
    return "versions/" + version + "/tables/" + table + ".json";
};
export var makeDiffKey = function (version) { return "versions/" + version + "/diff.json"; };
export var makeTableDiffHtmlKey = function (version, table) {
    return "versions/" + version + "/diff/" + table + ".html";
};
