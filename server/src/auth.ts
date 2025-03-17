import * as argon2 from "argon2";
import { Request, Router } from "express";
import jwt from "jsonwebtoken";
import passport from "passport";
import {
  ExtractJwt,
  Strategy as JwtStrategy,
  StrategyOptionsWithRequest,
} from "passport-jwt";
import { z } from "zod";
import { db } from "./db";
import env from "./env";
import { newLogger } from "./logger";
import { HttpStatusCode } from "./utils";

async function hashPassword(password: string) {
  // https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#argon2id
  const hash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 47104,
    timeCost: 2,
    parallelism: 1,
  });
  return hash;
}

const options: StrategyOptionsWithRequest = {
  secretOrKey: env.JWT_SECRET,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  passReqToCallback: true,
};

interface JwtPayload {}

passport.use(
  new JwtStrategy(options, (req: Request, payload, done) => {
    // TODO: impl this
    console.log(payload);
    done(null, {});
  })
);

export const authRouter = Router();

const passwordSchema = z
  .string()
  .trim()
  .min(8, "Password must be at least 8 characters long")
  .max(40, "Password must be at most 40 characters long");

const signupInputSchema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().min(1, "Name must not be empty"),
  password: passwordSchema,
});

authRouter.post("/signup", async (req, res) => {
  const logger = newLogger("signup");
  const parseResult = signupInputSchema.safeParse(req.body);
  if (!parseResult.success) {
    logger.error(JSON.stringify(parseResult.error.errors));
    res
      .status(HttpStatusCode.BAD_REQUEST)
      .json({ error: parseResult.error.errors });
    return;
  }
  // Create and store the user in the database
  try {
    const hashedPassword = await hashPassword(parseResult.data.password);
    await db.user.create({
      data: {
        ...parseResult.data,
        password: hashedPassword,
      },
    });
    res
      .status(HttpStatusCode.CREATED)
      .json({ message: "User created successfully" });
    return;
  } catch (error) {
    logger.error(error);
    res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json({ error: "Error signing up" });
    return;
  }
});

const loginInputSchema = z.object({
  email: z.string().email("Invalid email"),
  password: passwordSchema,
});

authRouter.post("/login", async (req, res) => {
  // Validate request body
  const parseResult = loginInputSchema.safeParse(req.body);
  if (!parseResult.success) {
    res
      .status(HttpStatusCode.BAD_REQUEST)
      .json({ error: parseResult.error.errors });
    return;
  }
  // Validate user details
  const user = await db.user.findUnique({
    where: { email: parseResult.data.email },
  });
  if (
    user === null ||
    !(await argon2.verify(user.password, parseResult.data.password))
  ) {
    res
      .status(HttpStatusCode.UNAUTHORIZED)
      .json({ error: "Incorrect email or password" });
    return;
  }
  // Send a JWT token
  const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
    expiresIn: "7d",
  });
  res.json({ token });
});
