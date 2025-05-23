import express from "express";
import morgan from "morgan";
import { apiRouter } from "./api";

export function startServer() {
  const app = express();
  app.use(morgan("common"));
  app.use(express.json());
  app.use("/api", apiRouter);
  return app;
}
