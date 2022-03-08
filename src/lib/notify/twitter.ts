import { DestinyManifest } from "bungie-api-ts/destiny2";
import Twit from "twit";
import { promisify } from "util";
import { AllTableDiff } from "../../diff";
import logger from "../log";
import { friendlyDiffName, getManifestId } from "../../utils";
import { createSortedDiffSummary } from "./utils";
import lodash from "lodash";

const T = new Twit({
  consumer_key: process.env.TWITTER_CK || "",
  consumer_secret: process.env.TWITTER_CS || "",
  access_token: process.env.TWITTER_TK,
  access_token_secret: process.env.TWITTER_TS,
  timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
  strictSSL: true, // optional - requires SSL certificates to be valid.
});

const postTweet: any = promisify(T.post.bind(T));

function getDiffTweets(
  manifestId: string,
  bungieVersionId: string,
  diffData: AllTableDiff
) {
  const { mainDiff, junkCount } = createSortedDiffSummary(diffData);

  const diffLines = mainDiff.map((diff) => {
    const values = [
      diff.diff.added && `${diff.diff.added} added`,
      diff.diff.unclassified && `${diff.diff.unclassified} unclassified`,
      diff.diff.removed && `${diff.diff.removed} removed`,
      diff.diff.reclassified && `${diff.diff.reclassified} reclassified`,
      diff.diff.modified && `${diff.diff.modified} modified`,
    ].filter(Boolean);

    return ` - ${friendlyDiffName(diff.tableName)}: ${values.join(", ")}`;
  });

  const TWEET_LIMIT = 280 - 15;
  const LINK_PLACEHOLDER = "~~link placeholder 28 char~~";
  const TOTAL_COUNT_PLACEHOLDER = "~~total count placeholder~~";
  const link = `archive.destiny.report/version/${manifestId}`;

  const preamble = [
    `The Destiny Definitions database has been updated to version ${bungieVersionId}`,
    "",
    `See what changed at ${LINK_PLACEHOLDER}`,
  ];

  const footer = [];

  if (mainDiff.length > 0) {
    preamble.push("\nChanges:");
  }

  if (junkCount > 0) {
    footer.push(
      `\n${
        mainDiff.length > 0 ? "Plus" : "Only"
      } ${junkCount} changes to junk tables`
    );
  }

  const tweets: string[][] = [[]];

  const tweetLines = [...preamble, ...diffLines, ...footer];

  let tweetCount = 1;
  for (const line of tweetLines) {
    const last = tweets[tweets.length - 1];
    const currentLength = last.join("\n").length;
    const newLength = currentLength + line.length + 1;

    if (newLength <= TWEET_LIMIT) {
      last.push(line);
    } else {
      last.push("");
      last.push(`[${tweetCount}/${TOTAL_COUNT_PLACEHOLDER}]`);
      const newTweet = ["[cont.]", line];
      tweets.push(newTweet);
      tweetCount += 1;
    }
  }

  return tweets.map((tweet) => {
    return tweet
      .join("\n")
      .replace(LINK_PLACEHOLDER, link)
      .replace(TOTAL_COUNT_PLACEHOLDER, tweets.length.toString());
  });
}

export async function notifyTwitterDone(
  manifest: DestinyManifest,
  diffData: AllTableDiff
) {
  const manifestId = getManifestId(manifest);
  const bungieVersionId = manifest.version;
  const tweets = getDiffTweets(manifestId, bungieVersionId, diffData);

  let index = 0;
  let lastTweetId = "";
  const mediaId = null; // TODO: figure out if we want the image

  for (const tweet of tweets) {
    const tweetParams: Record<string, any> = {
      status: tweet,
    };

    if (index === 0 && mediaId) {
      tweetParams.media_ids = [mediaId];
    }

    if (lastTweetId && lastTweetId !== "") {
      tweetParams.in_reply_to_status_id = lastTweetId;
      tweetParams.auto_populate_reply_metadata = true;
    }

    logger.info("Tweeting");

    if (process.env.SILENT_TWITTER) {
      logger.info("Suppressing tweet", tweetParams);

      lastTweetId = Math.random().toString();
    } else {
      const data = await postTweet("statuses/update", tweetParams);
      lastTweetId = data.id_str;
    }

    index += 1;
  }
}

const FLAVOR_TEXT_CHOICES = [
  "The Witness has seen enough…",
  "Enough.",
  "A message rises from the Deep.",
  "The Witness brings a message…",
  "An ancient Lubraean artifact has been discovered…",
];

export async function notifyTwitterStarting(manifest: DestinyManifest) {
  const flavorText = lodash.sample(FLAVOR_TEXT_CHOICES);
  const tweet: Twit.Params = {
    status: `${flavorText}.\n\nNew version ${manifest.version} detected.\nAwaiting further analysis...`,
  };

  if (process.env.SILENT_TWITTER) {
    logger.info("Suppressing tweet", tweet);
  } else {
    await postTweet("statuses/update", tweet);
  }
}
