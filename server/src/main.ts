import { configDotenv } from "dotenv";
configDotenv({ path: ".env.development" });

import { connectDb } from "./db";
import env from "./env";
import { newLogger } from "./logger";
import { startServer } from "./server";

async function main() {
  const logger = newLogger("main");

  await connectDb();
  const app = startServer();
  app.listen(env.PORT, () => {
    logger.info(`Server is running on http://localhost:${env.PORT}`);
  });
}

main();
