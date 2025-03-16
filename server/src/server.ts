import express from "express";
import morgan from "morgan";
import { authRouter } from "./auth";

export function startServer() {
  const app = express();

  app.use(morgan("common"));
  app.use(express.json());

  const apiRouter = express.Router();
  apiRouter.use("/auth", authRouter);

  app.use("/api", apiRouter);

  apiRouter.get("/", (req, res) => {
    res.json({ status: "works" });
  });

  return app;
}
