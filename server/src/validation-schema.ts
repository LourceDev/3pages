import { z } from "zod";

const requiredString = z.string().trim().min(1, "required");

const password = z
  .string()
  .trim()
  .min(8, "Password must be at least 8 characters long")
  .max(40, "Password must be at most 40 characters long");

const email = z.string().email("Invalid email");

const loginInput = z.strictObject({
  email,
  password,
});

const signupInput = z.strictObject({
  email,
  name: requiredString,
  password,
});

const entryInput = z.strictObject({
  date: requiredString.date(),
  text: requiredString,
});

const getEntryInput = z.strictObject({
  date: requiredString.date(),
});

export const schema = {
  password,
  loginInput,
  signupInput,
  entryInput,
  getEntryInput,
};
