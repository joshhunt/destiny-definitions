import { DestinyManifest } from "bungie-api-ts/destiny2";
import { AllTableDiff } from "../../diff";
import logger from "../log";
import { friendlyDiffName, getManifestId } from "../../utils";
import { createSortedDiffSummary } from "./utils";
import lodash from "lodash";
import megalodon from "megalodon";

const newMegalodon = (megalodon as any).default as typeof megalodon;

const MASTODON_BASE_URL = "https://botsin.space";

const POST_CHAR_LIMIT = 450;
const LINK_PLACEHOLDER = "~~link placeholder 28 char~~";
const TOTAL_COUNT_PLACEHOLDER = "~~total count placeholder~~";

interface PostStatusOptions {
  media_ids?: Array<string>;
  poll?: {
    options: Array<string>;
    expires_in: number;
    multiple?: boolean;
    hide_totals?: boolean;
  };
  in_reply_to_id?: string;
  sensitive?: boolean;
  spoiler_text?: string;
  visibility?: "public" | "unlisted" | "private" | "direct";
  scheduled_at?: string;
  language?: string;
  quote_id?: string;
}

const mastodon = newMegalodon(
  "mastodon",
  MASTODON_BASE_URL,
  process.env.MASTODON_ACCESS_TOKEN || ""
);

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

  const tweetLimit = POST_CHAR_LIMIT - 15;
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

    if (newLength <= tweetLimit) {
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

export async function notifyMastodonDone(
  manifest: DestinyManifest,
  diffData: AllTableDiff
) {
  const manifestId = getManifestId(manifest);
  const bungieVersionId = manifest.version;
  const tweets = getDiffTweets(manifestId, bungieVersionId, diffData);

  let lastPostId: string | undefined = undefined;

  for (const post of tweets) {
    const postParams: PostStatusOptions = {};

    if (lastPostId) {
      postParams.in_reply_to_id = lastPostId;
    }

    logger.info("Tooting", post);

    if (process.env.SILENT_MASTODON) {
      logger.info("Suppressing toot", post);

      lastPostId = Math.random().toString();
    } else {
      const data = await mastodon.postStatus(post, postParams);
      lastPostId = data.data.id;
    }
  }
}

const FLAVOR_TEXT_CHOICES = [
  "Beep boop",
  "There's no turning back",
  "At long last",
  "There is no escape (from the API)",
  "Our end begins. But hope hides in the API",
  // "quinn@cloudark $> query_new_definitions",
];

export async function notifyMastodonStarting(manifest: DestinyManifest) {
  const flavorText = lodash.sample(FLAVOR_TEXT_CHOICES);
  const post = `${flavorText}.\n\nNew version ${manifest.version} detected.\nAwaiting further analysis...`;

  if (process.env.SILENT_MASTODON) {
    logger.info("Suppressing toot", post);
  } else {
    await mastodon.postStatus(post, {});
  }
}
