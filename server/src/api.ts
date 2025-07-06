import { User } from "@prisma/client";
import dayjs from "dayjs";
import express from "express";
import passport from "passport";
import { authRouter } from "./auth";
import { db } from "./db";
import { newLogger } from "./logger";
import { catchAll, HttpStatusCode, inputError } from "./utils";
import { schema } from "./validation-schema";

export const apiRouter = express.Router();

// subpaths of api
apiRouter.use("/auth", authRouter);

// controllers

apiRouter.get("/", (req, res) => {
  res.json({ status: "works" });
});

apiRouter.put(
  "/entry",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const logger = newLogger("put entry");
    try {
      // get inputs
      const input = schema.entryInput.safeParse(req.body);
      if (!input.success) return inputError(logger, input.error, res);

      // insert or update entry
      const user = req.user as User;
      const entry = {
        date: new Date(input.data.date),
        text: input.data.text,
        userId: user.id,
      };
      await db.entry.upsert({
        where: {
          userId_date: {
            date: new Date(input.data.date),
            userId: user.id,
          },
        },
        create: entry,
        update: entry,
      });
      res.sendStatus(HttpStatusCode.OK);
      return;
    } catch (err) {
      return catchAll(logger, err, res);
    }
  }
);

apiRouter.get(
  "/entry/dates",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const logger = newLogger("get all entry dates");
    try {
      const user = req.user as User;
      const entries = await db.entry.findMany({
        where: {
          userId: user.id,
        },
      });
      res.json(entries.map((e) => dayjs(e.date).format("YYYY-MM-DD")));
      return;
    } catch (err) {
      return catchAll(logger, err, res);
    }
  }
);

apiRouter.get(
  "/entry/:date",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const logger = newLogger("get entry");
    try {
      const input = schema.getEntryInput.safeParse(req.params);
      if (!input.success) return inputError(logger, input.error, res);
      const user = req.user as User;
      const entry = await db.entry.findUnique({
        where: {
          userId_date: {
            userId: user.id,
            date: new Date(input.data.date),
          },
        },
      });
      if (entry === null) {
        res.sendStatus(HttpStatusCode.NOT_FOUND);
        return;
      }
      res.json(entry);
      return;
    } catch (err) {
      return catchAll(logger, err, res);
    }
  }
);

apiRouter.delete(
  "/entry/:date",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const logger = newLogger("delete entry");
    try {
      const input = schema.deleteEntryInput.safeParse(req.params);
      if (!input.success) return inputError(logger, input.error, res);
      const user = req.user as User;
      await db.entry.deleteMany({
        where: {
          userId: user.id,
          date: new Date(input.data.date),
        },
      });
      res.sendStatus(HttpStatusCode.NO_CONTENT);
      return;
    } catch (err) {
      return catchAll(logger, err, res);
    }
  }
);
