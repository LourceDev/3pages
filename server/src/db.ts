import { PrismaClient } from "@prisma/client";
import env from "./env";
import { newLogger } from "./logger";

export let db: PrismaClient;

export async function connectDb() {
  const logger = newLogger("connectDb");
  try {
    db = new PrismaClient({
      log: ["query", "info", "warn", "error"],
      datasourceUrl: env.DATABASE_URL,
    });
    await db.$connect();

    logger.info(`Connected to DB: ${env.DATABASE_URL}`);
    return db;
  } catch (e) {
    logger.error("DB connection failed");
    logger.error(e);
  }
  return null;
}
