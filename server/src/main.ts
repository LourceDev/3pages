import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";
import express, { Router } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { z } from "zod";
import { HttpStatusCode } from "./utils";

const app = express();
const PORT = 3000;
const prisma = new PrismaClient();

app.use(express.json());

async function hashPassword(password: string) {
  // https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#argon2id
  const hash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 47104,
    timeCost: 1,
    parallelism: 1,
  });
  return hash;
}

passport.use(
  new LocalStrategy(async function verify(email: string, password: string, cb) {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return cb(null, false, { message: "Incorrect email or password." });
      }
      if (await argon2.verify(user.password, password)) {
        return cb(null, user);
      } else {
        return cb(null, false, { message: "Incorrect email or password." });
      }
    } catch (error) {
      return cb(error);
    }
  })
);

app.get("/", (req, res) => {
  res.json({ status: "works" });
});

const authRouter = Router();
const signupInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z
    .string()
    .trim()
    .min(8, "Password must be at least 8 characters long")
    .max(40, "Password must be at most 40 characters long"),
});

authRouter.post("/signup", async (req, res) => {
  const parseResult = signupInputSchema.safeParse(req.body);
  if (!parseResult.success) {
    res
      .status(HttpStatusCode.BAD_REQUEST)
      .json({ error: parseResult.error.errors });
    return;
  }
  try {
    const hashedPassword = await hashPassword(parseResult.data.password);
    await prisma.user.create({
      data: {
        ...parseResult.data,
        password: hashedPassword,
      },
    });
    res
      .status(HttpStatusCode.CREATED)
      .json({ message: "User created successfully" });
  } catch (error) {
    // TODO: set up logging
    res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ error: "Error signing up" });
  }
});
app.use("/auth", authRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
