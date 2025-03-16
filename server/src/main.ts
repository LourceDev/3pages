import { PrismaClient } from "@prisma/client";
import express from "express";
import { authRouter } from "./auth";
import env from "./env";

const app = express();
export const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

app.use(express.json());
app.use("/auth", authRouter);

app.get("/", (req, res) => {
  res.json({ status: "works" });
});

app.listen(env.PORT, () => {
  console.log(`Server is running on http://localhost:${env.PORT}`);
});
