import winston from "winston";
import dotenv from "dotenv";
import { consoleFormat } from "winston-console-format";
import "winston-daily-rotate-file";
import path from "path";

dotenv.config();

const { createLogger, format, transports } = winston;

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
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

if (process.env.LOG_DIR) {
  logger.info("Configuring Loki transport");

  const transport = new winston.transports.DailyRotateFile({
    filename: path.join(process.env.LOG_DIR, "destiny-definitions-%DATE%.log"),
    dirname: process.env.LOG_DIR,
    createSymlink: true,
    datePattern: "YYYY-MM",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
  });

  logger.add(transport);
}

export default logger;
