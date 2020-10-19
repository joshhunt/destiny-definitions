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
import { promisify } from "util";
import canvasPackage from "canvas";
import Twit from "twit";
dotenv.config();
var T = new Twit({
    consumer_key: process.env.TWITTER_CK || "",
    consumer_secret: process.env.TWITTER_CS || "",
    access_token: process.env.TWITTER_TK,
    access_token_secret: process.env.TWITTER_TS,
    timeout_ms: 60 * 1000,
    strictSSL: true,
});
var createCanvas = canvasPackage.createCanvas, loadImage = canvasPackage.loadImage;
// Clone this to edit, then you gotta sign up at https://apps.twitter.com and get your own API key (TWITTER_CK) and API secret key (TWITTER_CS) and plug them into .env.
var icons = [
    "https://www.bungie.net/common/destiny2_content/icons/a11c0abd3b5a9d9ac128ff37aec61425.jpg",
    "https://www.bungie.net/common/destiny2_content/icons/e7ccbff166a5a543df4f475f69f3ebf8.jpg",
    "https://www.bungie.net/common/destiny2_content/icons/69589d312320228022173ef7ef543a40.jpg",
    "https://www.bungie.net/common/destiny2_content/icons/2539a0478ce440192272f16529dcc37d.jpg",
    "https://www.bungie.net/common/destiny2_content/icons/b5fbeba99d92f2102d010bc4ff5829d4.jpg",
    "https://www.bungie.net/common/destiny2_content/icons/4d1cf89d08b11bd87c8944ecddbbfffe.jpg",
    "https://www.bungie.net/common/destiny2_content/icons/8070b4aa8ef05ed33005d0ea314c575f.jpg",
    "https://www.bungie.net/common/destiny2_content/icons/9fca585b5cc85e25f99d4cc9bee58db5.jpg",
    "https://www.bungie.net/common/destiny2_content/icons/9c0c42cc31fed4d244793876a4fc5ddf.jpg",
    "https://www.bungie.net/common/destiny2_content/icons/759650fa39e285b46f9e3f409aee2282.jpg",
    "https://www.bungie.net/common/destiny2_content/icons/691e3371d8701e27031894874fa7e11b.jpg",
    "https://www.bungie.net/common/destiny2_content/icons/02849d16afc2cf5aa1e75cdbcfd97c9a.jpg",
    "https://www.bungie.net/common/destiny2_content/icons/3a7532224ab161c33d423555636266bc.jpg",
    "https://www.bungie.net/common/destiny2_content/icons/f480df924893cf9549223289512996ae.jpg",
    "https://www.bungie.net/common/destiny2_content/icons/e2bc7f451b75d644b53ed43e5a732f75.jpg",
    "https://www.bungie.net/common/destiny2_content/icons/6481ca96bae1de44456ec24afb4e4881.jpg",
    "https://www.bungie.net/common/destiny2_content/icons/7467a8006d1a7792e5f9cb5a211499a6.jpg",
    "https://www.bungie.net/common/destiny2_content/icons/e32f7eb5ec5075a2d2ac65a4c6447a56.jpg",
    "https://www.bungie.net/common/destiny2_content/icons/2600250b4ea61d338feda47cf44ba0b5.jpg",
    "https://www.bungie.net/common/destiny2_content/icons/08cf83be64d4583ab0400722c79b7659.jpg",
    "https://www.bungie.net/common/destiny2_content/icons/dadeb1f4484ffdaec2420240700dc637.jpg",
    "https://www.bungie.net/common/destiny2_content/icons/08499ab51485915702b192a9d97d17b0.jpg",
    "https://www.bungie.net/common/destiny2_content/icons/cd76e4a21cb89cd5b850eba34a8df41c.jpg",
    "https://www.bungie.net/common/destiny2_content/icons/72654c9290bcefa04762ae6a7b66a22b.jpg",
    "https://www.bungie.net/common/destiny2_content/icons/4307654e15248d54fcffca2ab2710951.jpg",
    "https://www.bungie.net/common/destiny2_content/icons/7a37bd1dc75bd0848d8c7afa25570763.jpg",
    "https://www.bungie.net/common/destiny2_content/icons/65a42d35f066e7c06861a1a416388f4b.jpg",
    "https://www.bungie.net/common/destiny2_content/icons/d3480323a180cef1db366f33f2d52f32.jpg",
];
var ICON_WIDTH = 71;
var ICON_HEIGHT = ICON_WIDTH;
var GRID_WIDTH = 7;
var GRID_HEIGHT = 4;
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var tweets, twitterPost, mediaId, base64Image, mediaData, metadataParams, index, lastTweetId, _i, tweets_1, tweet, tweetParams, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tweets = [];
                    twitterPost = promisify(T.post.bind(T));
                    mediaId = "";
                    if (!(icons.length >= 28)) return [3 /*break*/, 4];
                    return [4 /*yield*/, makeImage()];
                case 1:
                    base64Image = (_a.sent()).toString("base64");
                    console.log("Posting image...");
                    return [4 /*yield*/, twitterPost("media/upload", {
                            media_data: base64Image,
                        })];
                case 2:
                    mediaData = _a.sent();
                    mediaId = mediaData.media_id_string;
                    metadataParams = {
                        media_id: mediaId,
                        alt_text: {
                            text: "A preview of the new items in this definitions update",
                        },
                    };
                    console.log("Adding metadata to image...");
                    return [4 /*yield*/, twitterPost("media/metadata/create", metadataParams)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    index = 0;
                    lastTweetId = "";
                    _i = 0, tweets_1 = tweets;
                    _a.label = 5;
                case 5:
                    if (!(_i < tweets_1.length)) return [3 /*break*/, 8];
                    tweet = tweets_1[_i];
                    console.log("");
                    console.log({ tweet: tweet });
                    tweetParams = {
                        status: tweet,
                    };
                    if (index === 0 && mediaId) {
                        console.log("Adding media");
                        tweetParams.media_ids = [mediaId];
                    }
                    if (lastTweetId && lastTweetId !== "") {
                        console.log("Replying to", lastTweetId);
                        tweetParams.in_reply_to_status_id = lastTweetId;
                        tweetParams.auto_populate_reply_metadata = true;
                    }
                    console.log("Posting tweet...");
                    return [4 /*yield*/, twitterPost("statuses/update", tweetParams)];
                case 6:
                    data = _a.sent();
                    lastTweetId = data.id_str;
                    index += 1;
                    _a.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 5];
                case 8: return [2 /*return*/];
            }
        });
    });
}
function makeImage() {
    return __awaiter(this, void 0, void 0, function () {
        var width, height, canvas, context, imageX, imageY, _i, icons_1, imageUrl, posX, posY, image, buffer;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    width = ICON_WIDTH * GRID_WIDTH;
                    height = ICON_HEIGHT * GRID_HEIGHT;
                    canvas = createCanvas(width, height);
                    context = canvas.getContext("2d");
                    imageX = 0;
                    imageY = 0;
                    _i = 0, icons_1 = icons;
                    _a.label = 1;
                case 1:
                    if (!(_i < icons_1.length)) return [3 /*break*/, 4];
                    imageUrl = icons_1[_i];
                    posX = imageX * ICON_WIDTH;
                    posY = imageY * ICON_HEIGHT;
                    return [4 /*yield*/, loadImage(imageUrl)];
                case 2:
                    image = _a.sent();
                    context.drawImage(image, posX, posY, ICON_WIDTH, ICON_HEIGHT);
                    if (imageX <= GRID_WIDTH - 2) {
                        imageX += 1;
                    }
                    else {
                        imageX = 0;
                        imageY += 1;
                    }
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    buffer = canvas.toBuffer("image/png");
                    // await fs.writeFile("./image.png", buffer);
                    return [2 /*return*/, buffer];
            }
        });
    });
}
