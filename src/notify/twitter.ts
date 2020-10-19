import { DestinyManifest } from "bungie-api-ts/destiny2";
import Twit from "twit";
import { promisify } from "util";
import definitionsMetadata from "../definitionsMetadata";
import { AllTableDiff } from "../diff";
import { friendlyDiffName, getManifestId } from "../utils";

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
  const sortedDiff = Object.entries(diffData)
    .sort(([nameA], [nameB]) => {
      const indexA = definitionsMetadata[nameA].index;
      const indexB = definitionsMetadata[nameB].index;

      return indexA - indexB;
    })
    .map(([tableName, diff]) => ({
      tableName,
      added: diff.added.length,
      removed: diff.removed.length,
      unclassified: diff.unclassified.length,
      reclassified: diff.reclassified.length,
    }))
    .filter((diff) => {
      const total =
        diff.added + diff.removed + diff.unclassified + diff.reclassified;

      return total > 0;
    });

  const mainDiff = sortedDiff.filter(
    (d) => !definitionsMetadata[d.tableName].junk
  );
  const junkDiffCount = sortedDiff
    .filter((d) => definitionsMetadata[d.tableName].junk)
    .reduce(
      (acc, item) =>
        acc + item.added + item.reclassified + item.removed + item.unclassified,
      0
    );

  const diffLines = mainDiff.map((diff) => {
    const values = [
      diff.added && `${diff.added} added`,
      diff.unclassified && `${diff.unclassified} unclassified`,
      diff.removed && `${diff.removed} removed`,
      diff.reclassified && `${diff.reclassified} reclassified`,
    ].filter(Boolean);

    return ` - ${friendlyDiffName(diff.tableName)}: ${values.join(", ")}`;
  });

  const TWEET_LIMIT = 280 - 15;
  const LINK_PLACEHOLDER = "~~link placeholder 28 char~~";
  const TOTAL_COUNT_PLACEHOLDER = "~~total count placeholder~~";
  const link = `destiny-definitions.netlify.app/version/${manifestId}`;

  const preamble = [
    `The Destiny Definitions database has been updated to version ${bungieVersionId}`,
    "",
    `See what changed at ${LINK_PLACEHOLDER}`,
    "",
    "Changes:",
  ];

  const footer = [];

  if (junkDiffCount > 0) {
    footer.push(`\nPlus ${junkDiffCount} changes to junk tables`);
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

export default async function notifyTwitter(
  manifest: DestinyManifest,
  diffData: AllTableDiff
) {
  const manifestId = getManifestId(manifest);
  const bungieVersionId = manifest.version;
  const tweets = getDiffTweets(manifestId, bungieVersionId, diffData);

  let index = 0;
  let lastTweetId = "";
  let mediaId = null; // TODO: figure out if we want the image

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

    console.log("Posting tweet...");

    if (process.env.SILENT_NOTIFICATIONS) {
      console.log("Suppressing tweet", tweetParams);
      lastTweetId = Math.random().toString();
    } else {
      const data = await postTweet("statuses/update", tweetParams);
      lastTweetId = data.id_str;
    }

    index += 1;
  }
}
