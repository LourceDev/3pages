import type { JSONContent } from "@tiptap/react";
import { z } from "zod";

const requiredString = z.string().trim().min(1, "required");

const password = z
  .string()
  .trim()
  .min(8, "Password must be at least 8 characters long")
  .max(40, "Password must be at most 40 characters long");

const email = z.string().email("Invalid email");

const signupInput = z.strictObject({
  email,
  name: requiredString,
  password,
});

const loginInput = z.strictObject({
  email,
  password,
});

const jsonContentSchema: z.ZodType<JSONContent> = z.lazy(
  () =>
    z
      .object({
        type: z.string().optional(),
        attrs: z.record(z.any()).optional(),
        content: z.array(jsonContentSchema).optional(),
        marks: z
          .array(
            z.object({
              type: z.string(),
              attrs: z.record(z.any()).optional(),
            })
          )
          .optional(),
        text: z.string().optional(),
      })
      .passthrough() // allow other arbitrary keys
);

const entryInput = z.strictObject({
  date: requiredString.date(),
  text: jsonContentSchema,
});

const getEntryInput = requiredString.date();
const deleteEntryInput = requiredString.date();

export const schema = {
  signupInput,
  loginInput,
  entryInput,
  getEntryInput,
  deleteEntryInput,
};
