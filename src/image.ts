import dotenv from "dotenv";
import { promisify } from "util";
import canvasPackage from "canvas";
import fs from "fs/promises";
import definitionsMetadata from "./definitionsMetadata";
import Twit from "twit";
dotenv.config();

const T = new Twit({
  consumer_key: process.env.TWITTER_CK || "",
  consumer_secret: process.env.TWITTER_CS || "",
  access_token: process.env.TWITTER_TK,
  access_token_secret: process.env.TWITTER_TS,
  timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
  strictSSL: true, // optional - requires SSL certificates to be valid.
});

const { createCanvas, loadImage } = canvasPackage;

// Clone this to edit, then you gotta sign up at https://apps.twitter.com and get your own API key (TWITTER_CK) and API secret key (TWITTER_CS) and plug them into .env.

const icons = [
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

const ICON_WIDTH = 71;
const ICON_HEIGHT = ICON_WIDTH;

const GRID_WIDTH = 7;
const GRID_HEIGHT = 4;

async function main() {
  const tweets: string[] = [];

  const twitterPost: any = promisify(T.post.bind(T));

  let mediaId: string = "";

  if (icons.length >= 28) {
    const base64Image = (await makeImage()).toString("base64");

    console.log("Posting image...");
    const mediaData = await twitterPost("media/upload", {
      media_data: base64Image,
    });

    mediaId = mediaData.media_id_string;
    const metadataParams = {
      media_id: mediaId,
      alt_text: {
        text: "A preview of the new items in this definitions update",
      },
    };

    console.log("Adding metadata to image...");
    await twitterPost("media/metadata/create", metadataParams);
  }

  let index = 0;
  let lastTweetId = "";
  for (const tweet of tweets) {
    console.log("");
    console.log({ tweet });
    const tweetParams: Record<string, any> = {
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
    const data = await twitterPost("statuses/update", tweetParams);
    lastTweetId = data.id_str;
    index += 1;
  }
}

async function makeImage() {
  const width = ICON_WIDTH * GRID_WIDTH;
  const height = ICON_HEIGHT * GRID_HEIGHT;

  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");

  let imageX = 0;
  let imageY = 0;
  for (const imageUrl of icons) {
    const posX = imageX * ICON_WIDTH;
    const posY = imageY * ICON_HEIGHT;

    const image = await loadImage(imageUrl);
    context.drawImage(image, posX, posY, ICON_WIDTH, ICON_HEIGHT);

    if (imageX <= GRID_WIDTH - 2) {
      imageX += 1;
    } else {
      imageX = 0;
      imageY += 1;
    }
  }

  const buffer = canvas.toBuffer("image/png");
  // await fs.writeFile("./image.png", buffer);

  return buffer;
}
