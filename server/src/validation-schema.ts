import type { JSONContent } from "@tiptap/core";
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

const getEntryInput = z.strictObject({
  date: requiredString.date(),
});

const deleteEntryInput = z.strictObject({
  date: requiredString.date(),
});

export const schema = {
  password,
  loginInput,
  signupInput,
  entryInput,
  getEntryInput,
  deleteEntryInput,
};
