import * as argon2 from "argon2";
import { Router } from "express";
import jwt from "jsonwebtoken";
import passport from "passport";
import {
  ExtractJwt,
  Strategy as JwtStrategy,
  StrategyOptionsWithRequest,
} from "passport-jwt";
import { db } from "./db";
import env from "./env";
import { newLogger } from "./logger";
import { catchAll, HttpStatusCode, inputError } from "./utils";
import { schema } from "./validation-schema";

/* ------------------------------- functions -------------------------------- */

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

/* -------------------------------- globals --------------------------------- */

type JwtPayload = { userId: number };

const options: StrategyOptionsWithRequest = {
  secretOrKey: env.JWT_SECRET,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  passReqToCallback: true,
};

passport.use(
  new JwtStrategy(options, async (req, payload: JwtPayload, done) => {
    try {
      const user = await db.user.findUnique({ where: { id: payload.userId } });
      if (user === null) {
        console.log("user was null");
        return done(null, false);
      }
      console.log("user was valid");
      return done(null, user);
    } catch (err) {
      console.log("user was err");
      return done(err, false);
    }
  })
);

export const authRouter = Router();

/* --------------------------------- signup --------------------------------- */

authRouter.post("/signup", async (req, res) => {
  const logger = newLogger("signup");
  try {
    // deal with input
    const parseResult = schema.signupInput.safeParse(req.body);
    if (!parseResult.success) {
      return inputError(logger, parseResult.error, res);
    }
    // Create and store the user in the database
    const hashedPassword = await hashPassword(parseResult.data.password);
    await db.user.create({
      data: {
        ...parseResult.data,
        password: hashedPassword,
      },
    });
    // return response
    res
      .status(HttpStatusCode.CREATED)
      .json({ message: "User created successfully" });
    return;
  } catch (err) {
    return catchAll(logger, err, res);
  }
});

/* --------------------------------- login ---------------------------------- */

authRouter.post("/login", async (req, res) => {
  const logger = newLogger("login");
  try {
    // Validate request body
    const parseResult = schema.loginInput.safeParse(req.body);
    if (!parseResult.success) {
      return inputError(logger, parseResult.error, res);
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
    const token = jwt.sign(
      { userId: user.id } satisfies JwtPayload,
      env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );
    res.json({ token });
    return;
  } catch (err) {
    return catchAll(logger, err, res);
  }
});
