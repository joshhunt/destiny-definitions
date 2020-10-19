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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
import Twit from "twit";
import { promisify } from "util";
import definitionsMetadata from "../definitionsMetadata";
import { friendlyDiffName, getManifestId } from "../utils";
var T = new Twit({
    consumer_key: process.env.TWITTER_CK || "",
    consumer_secret: process.env.TWITTER_CS || "",
    access_token: process.env.TWITTER_TK,
    access_token_secret: process.env.TWITTER_TS,
    timeout_ms: 60 * 1000,
    strictSSL: true,
});
var postTweet = promisify(T.post.bind(T));
function getDiffTweets(manifestId, bungieVersionId, diffData) {
    var sortedDiff = Object.entries(diffData)
        .sort(function (_a, _b) {
        var nameA = _a[0];
        var nameB = _b[0];
        var indexA = definitionsMetadata[nameA].index;
        var indexB = definitionsMetadata[nameB].index;
        return indexA - indexB;
    })
        .map(function (_a) {
        var tableName = _a[0], diff = _a[1];
        return ({
            tableName: tableName,
            added: diff.added.length,
            removed: diff.removed.length,
            unclassified: diff.unclassified.length,
            reclassified: diff.reclassified.length,
        });
    })
        .filter(function (diff) {
        var total = diff.added + diff.removed + diff.unclassified + diff.reclassified;
        return total > 0;
    });
    var mainDiff = sortedDiff.filter(function (d) { return !definitionsMetadata[d.tableName].junk; });
    var junkDiffCount = sortedDiff
        .filter(function (d) { return definitionsMetadata[d.tableName].junk; })
        .reduce(function (acc, item) {
        return acc + item.added + item.reclassified + item.removed + item.unclassified;
    }, 0);
    var diffLines = mainDiff.map(function (diff) {
        var values = [
            diff.added && diff.added + " added",
            diff.unclassified && diff.unclassified + " unclassified",
            diff.removed && diff.removed + " removed",
            diff.reclassified && diff.reclassified + " reclassified",
        ].filter(Boolean);
        return " - " + friendlyDiffName(diff.tableName) + ": " + values.join(", ");
    });
    var TWEET_LIMIT = 280 - 15;
    var LINK_PLACEHOLDER = "~~link placeholder 28 char~~";
    var TOTAL_COUNT_PLACEHOLDER = "~~total count placeholder~~";
    var link = "destiny-definitions.netlify.app/version/" + manifestId;
    var preamble = [
        "The Destiny Definitions database has been updated to version " + bungieVersionId,
        "",
        "See what changed at " + LINK_PLACEHOLDER,
        "",
        "Changes:",
    ];
    var footer = [];
    if (junkDiffCount > 0) {
        footer.push("\nPlus " + junkDiffCount + " changes to junk tables");
    }
    var tweets = [[]];
    var tweetLines = __spreadArrays(preamble, diffLines, footer);
    var tweetCount = 1;
    for (var _i = 0, tweetLines_1 = tweetLines; _i < tweetLines_1.length; _i++) {
        var line = tweetLines_1[_i];
        var last = tweets[tweets.length - 1];
        var currentLength = last.join("\n").length;
        var newLength = currentLength + line.length + 1;
        if (newLength <= TWEET_LIMIT) {
            last.push(line);
        }
        else {
            last.push("");
            last.push("[" + tweetCount + "/" + TOTAL_COUNT_PLACEHOLDER + "]");
            var newTweet = ["[cont.]", line];
            tweets.push(newTweet);
            tweetCount += 1;
        }
    }
    return tweets.map(function (tweet) {
        return tweet
            .join("\n")
            .replace(LINK_PLACEHOLDER, link)
            .replace(TOTAL_COUNT_PLACEHOLDER, tweets.length.toString());
    });
}
export default function notifyTwitter(manifest, diffData) {
    return __awaiter(this, void 0, void 0, function () {
        var manifestId, bungieVersionId, tweets, index, lastTweetId, mediaId, _i, tweets_1, tweet, tweetParams, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    manifestId = getManifestId(manifest);
                    bungieVersionId = manifest.version;
                    tweets = getDiffTweets(manifestId, bungieVersionId, diffData);
                    index = 0;
                    lastTweetId = "";
                    mediaId = null;
                    _i = 0, tweets_1 = tweets;
                    _a.label = 1;
                case 1:
                    if (!(_i < tweets_1.length)) return [3 /*break*/, 6];
                    tweet = tweets_1[_i];
                    tweetParams = {
                        status: tweet,
                    };
                    if (index === 0 && mediaId) {
                        tweetParams.media_ids = [mediaId];
                    }
                    if (lastTweetId && lastTweetId !== "") {
                        tweetParams.in_reply_to_status_id = lastTweetId;
                        tweetParams.auto_populate_reply_metadata = true;
                    }
                    console.log("Posting tweet...");
                    if (!process.env.SILENT_NOTIFICATIONS) return [3 /*break*/, 2];
                    console.log("Suppressing tweet", tweetParams);
                    lastTweetId = Math.random().toString();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, postTweet("statuses/update", tweetParams)];
                case 3:
                    data = _a.sent();
                    lastTweetId = data.id_str;
                    _a.label = 4;
                case 4:
                    index += 1;
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/];
            }
        });
    });
}
