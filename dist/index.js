var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import fs from "fs-extra";
import { getManifest } from "./bungie";
import { getManifest as getDbManifest } from "./db";
import processManifest from "./manifest";
import { createIndex, finish } from "./extraTasks";
import diffManifestVersion from "./diff";
import notify from "./notify";
dotenv.config();
var S3_BUCKET = process.env.S3_BUCKET;
if (!S3_BUCKET) {
    throw new Error("S3_BUCKET not defined");
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var force, _a, manifestResp, latestUploaded, _b, _c, _d, manifestData, prevManifest, l, diffResults;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    force = process.argv.some(function (v) { return v.includes("force"); });
                    force &&
                        console.log("*** Force is set to true, so it's going to run regardless! ***");
                    console.log("Loading manifest");
                    _c = (_b = Promise).all;
                    _d = [getManifest()];
                    return [4 /*yield*/, fs.readJSON("./latestVersion.json")];
                case 1: return [4 /*yield*/, _c.apply(_b, [_d.concat([
                            (_e.sent())
                        ])])];
                case 2:
                    _a = _e.sent(), manifestResp = _a[0], latestUploaded = _a[1];
                    manifestData = manifestResp.data.Response;
                    console.log("latestVersion.json version: " + latestUploaded.version);
                    console.log("Current API manifest version: " + manifestData.version);
                    if (!force && manifestData.version === latestUploaded.version) {
                        console.log("Manifest already exists in latestVersion.json");
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, getDbManifest(manifestData.version)];
                case 3:
                    prevManifest = _e.sent();
                    if (!(!force && prevManifest)) return [3 /*break*/, 5];
                    l = __assign({}, prevManifest);
                    delete l.data;
                    console.log("Manifest already exists in database");
                    console.log(l);
                    return [4 /*yield*/, fs.writeJSON("./latestVersion.json", {
                            version: manifestData.version,
                        })];
                case 4:
                    _e.sent();
                    return [2 /*return*/];
                case 5:
                    console.log("Processing manifest");
                    return [4 /*yield*/, processManifest(manifestData)];
                case 6:
                    _e.sent();
                    console.log("Creating diff");
                    return [4 /*yield*/, diffManifestVersion(manifestData.version)];
                case 7:
                    diffResults = _e.sent();
                    console.log("Creating index");
                    return [4 /*yield*/, createIndex()];
                case 8:
                    _e.sent();
                    console.log("Finishing up");
                    return [4 /*yield*/, finish(manifestData.version)];
                case 9:
                    _e.sent();
                    console.log("Sending notifications");
                    return [4 /*yield*/, notify(manifestData.version, diffResults)];
                case 10:
                    _e.sent();
                    console.log("All done");
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (err) {
    console.error("Uncaught top-level error");
    console.error(err);
});
