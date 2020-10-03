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
import getDb from "./setup";
export var schemaSQL = "\n  CREATE TABLE IF NOT EXISTS Version (\n    id TEXT PRIMARY KEY,\n    version TEXT NOT NULL,\n    s3Key TEXT NOT NULL,\n    createdAt TEXT NOT NULL,\n    updatedAt TEXT NOT NULL,\n    manifest TEXT NOT NULL\n  );\n";
function deserialiseVersionRecord(obj) {
    return {
        id: obj.id,
        version: obj.version,
        s3Key: obj.s3Key,
        manifest: JSON.parse(obj.manifest),
        createdAt: new Date(obj.createdAt),
        updatedAt: new Date(obj.updatedAt),
    };
}
export function getAllVerisons() {
    return __awaiter(this, void 0, void 0, function () {
        var all, rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getDb()];
                case 1:
                    all = (_a.sent()).all;
                    return [4 /*yield*/, all("SELECT * from Version;")];
                case 2:
                    rows = _a.sent();
                    return [2 /*return*/, rows.map(deserialiseVersionRecord)];
            }
        });
    });
}
export function getVersion(id) {
    return __awaiter(this, void 0, void 0, function () {
        var get, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getDb()];
                case 1:
                    get = (_a.sent()).get;
                    return [4 /*yield*/, get("SELECT * from Version WHERE id = $id;", { $id: id })];
                case 2:
                    result = _a.sent();
                    if (!result) {
                        return [2 /*return*/, null];
                    }
                    return [2 /*return*/, deserialiseVersionRecord(result)];
            }
        });
    });
}
export function saveVersionRow(version) {
    return __awaiter(this, void 0, void 0, function () {
        var run, payload, sql, params, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getDb()];
                case 1:
                    run = (_a.sent()).run;
                    if (version.createdAt) {
                        console.warn("WARNING: version.createdAt was specified when saving version row");
                    }
                    payload = __assign(__assign({}, version), { updatedAt: new Date(), createdAt: version.createdAt || new Date() });
                    sql = "\n      INSERT INTO Version( id, version,   s3Key,  manifest,  createdAt,  updatedAt)\n                   VALUES($id, $version, $s3Key, $manifest, $createdAt, $updatedAt)\n\n        ON CONFLICT(id) DO UPDATE SET\n          version=excluded.version,\n          s3Key=excluded.s3Key,\n          manifest=excluded.manifest,\n          updatedAt=excluded.updatedAt\n      ;\n    ";
                    params = {
                        $id: payload.id,
                        $version: payload.version,
                        $s3Key: payload.s3Key,
                        $manifest: JSON.stringify(payload.manifest),
                        $createdAt: payload.createdAt.toISOString(),
                        $updatedAt: payload.updatedAt.toISOString(),
                    };
                    result = run(sql, params);
                    return [2 /*return*/, result];
            }
        });
    });
}
