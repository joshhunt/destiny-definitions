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
import axios from "axios";
import discordWebhook from "discord-webhook-node";
var Webhook = discordWebhook.Webhook, MessageBuilder = discordWebhook.MessageBuilder;
dotenv.config();
if (!process.env.DISCORD_WEBHOOK) {
    throw new Error("process.env.DISCORD_WEBHOOK not defined");
}
if (!process.env.NETLIFY_WEBOOK) {
    throw new Error("process.env.NETLIFY_WEBOOK not defined");
}
var hook = new Webhook(process.env.DISCORD_WEBHOOK);
function notifyDiscord(version, diffData) {
    return __awaiter(this, void 0, void 0, function () {
        var embed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    embed = new MessageBuilder()
                        .setTitle("Definitions have updated")
                        .setURL("https://destiny-definitions.netlify.app/version/" + version)
                        .setDescription("Version: " + version);
                    Object.entries(diffData)
                        .filter(function (_a) {
                        var tableName = _a[0], tableDiff = _a[1];
                        return Object.values(tableDiff).some(function (v) { return v.length > 0; });
                    })
                        .forEach(function (_a) {
                        var tableName = _a[0], tableDiff = _a[1];
                        var message = Object.entries(tableDiff)
                            .filter(function (_a) {
                            var diffItems = _a[1];
                            return diffItems.length > 0;
                        })
                            .map(function (_a) {
                            var diffName = _a[0], diffItems = _a[1];
                            return diffItems.length + " " + diffName;
                        })
                            .join(", ");
                        embed = embed.addField(tableName, message);
                    });
                    embed = embed.setColor("#2ecc71").setTimestamp();
                    return [4 /*yield*/, hook.send(embed)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function notifyNetlify(version) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, axios.post(process.env.NETLIFY_WEBOOK + "?trigger_title=Manifest+version+" + version, {})];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
export default function notify(version, diffData) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Sending Discord notification");
                    return [4 /*yield*/, notifyDiscord(version, diffData)];
                case 1:
                    _a.sent();
                    console.log("Triggering Netlify build");
                    return [4 /*yield*/, notifyNetlify(version)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
