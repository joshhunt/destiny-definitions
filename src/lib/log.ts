import winston from "winston";
import dotenv from "dotenv";
import { consoleFormat } from "winston-console-format";
import LokiTransport from "winston-loki";

dotenv.config();

const { createLogger, format, transports } = winston;

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: "destiny-definitions" },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize({ all: false }),
        format.padLevels(),
        consoleFormat({
          showMeta: true,
          metaStrip: ["timestamp", "service"],
          inspectOptions: {
            depth: Infinity,
            colors: true,
            maxArrayLength: Infinity,
            breakLength: 120,
            compact: Infinity,
          },
        })
      ),
    }),
  ],
});

if (process.env.NODE_ENV === "production" && process.env.PROMTAIL_HOST) {
  logger.info("Configuring Loki transport");
  logger.add(
    new LokiTransport({
      batching: false,
      host: process.env.PROMTAIL_HOST,
    })
  );
}

export default logger;
