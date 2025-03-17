// init dotenv first
import { configDotenv } from "dotenv";
configDotenv({ path: ".env.test" });
// end dotenv
import { faker } from "@faker-js/faker";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import supertest from "supertest";
import { connectDb, db } from "../db";
import { newLogger } from "../logger";
import { startServer } from "../server";
import { HttpStatusCode } from "../utils";

// https://stackoverflow.com/questions/56448749/how-can-i-stop-jest-wrapping-console-log-in-test-output/68017229#68017229
global.console = console;
const jestConsole = console;

async function clearDatabase() {
  // https://github.com/prisma/prisma/issues/742#issuecomment-2536995050
  const logger = newLogger("clearDatabase");
  const execAsync = promisify(exec);
  try {
    const { stdout, stderr } = await execAsync(
      "npx prisma db push --force-reset"
    );
    if (stdout) logger.info(`stdout: ${stdout}`);
    if (stderr) logger.error(`stderr: ${stderr}`);
  } catch (error) {
    logger.error(`error: ${error}`);
  }
}

let app: ReturnType<typeof startServer>;

beforeAll(async () => {
  await connectDb();
  app = startServer();
  await clearDatabase();
});

afterAll(async () => {
  await db.$disconnect();
  global.console = jestConsole;
});

describe("auth", () => {
  test("invalid signup", async () => {
    await supertest(app)
      .post("/api/auth/signup")
      .send({
        name: faker.person.fullName(),
        email: "asdf",
        password: "123",
      })
      .expect(HttpStatusCode.BAD_REQUEST);
  });

  const email = faker.internet.email();
  const password = faker.internet.password();

  test("valid signup", async () => {
    await supertest(app)
      .post("/api/auth/signup")
      .send({
        name: faker.person.fullName(),
        email,
        password,
      })
      .expect(HttpStatusCode.CREATED);
  });

  test("invalid login", async () => {
    await supertest(app)
      .post("/api/auth/login")
      .send({
        email: "asdf",
        password: "123",
      })
      .expect(HttpStatusCode.BAD_REQUEST);
  });

  test("valid login", async () => {
    const res = await supertest(app)
      .post("/api/auth/login")
      .send({
        email,
        password,
      })
      .expect(HttpStatusCode.OK);
    expect(res.body).toHaveProperty("token");
  });
});
