import axios, { AxiosRequestConfig } from "axios";
import logger from "./log";

const TIMEOUT = 5 * 1000;
const DEFAULT_MAX_ATTEMPTS = 5;

export default async function httpGet<T = any>(
  url: string,
  _options: AxiosRequestConfig = {},
  maxAttempts: number = DEFAULT_MAX_ATTEMPTS
) {
  let lastError: any;
  const options = {
    ..._options,
    timeout: TIMEOUT,
  };

  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt += 1;
    logger.debug("HTTP request", {
      url,
      attempt,
      timeout: options.timeout,
      maxAttempts,
    });

    try {
      const resp = await axios.get<T>(url, options);
      const isOkay = resp.status >= 200 && resp.status < 300;

      if (resp?.data && isOkay) {
        return resp;
      }

      lastError = resp.statusText;

      logger.warn("HTTP request returned non-okay", {
        url,
        status: resp.status,
        statusText: resp.statusText,
      });
    } catch (error) {
      lastError = error;
      logger.warn("Exception from HTTP request", { error, url });
    }
  }

  logger.error("Exhausted all HTTP attempts", { url, lastError });
  throw new Error("Exhausted attempts fetching " + url);
}
