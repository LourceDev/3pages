import { env } from "@/env";
import { HttpStatusCode } from "@/utils";
import { schema } from "@/validation-schema";
import type { JSONContent } from "@tiptap/react";
import { z } from "zod";

// TODO: Impl proper error handling. Currently we only indicate vague "parse error" and "other error".

const baseUrl = env.NEXT_PUBLIC_SERVER_BASE_URL;

type Success<T> = { success: true; data: T };
type Error<E> = { success: false; error: E };
type Result<T, E> = Success<T> | Error<E>;

function success<T>(data: T): Success<T> {
  return { success: true, data };
}

function error<T>(err: T): Error<T> {
  return { success: false, error: err };
}

type SignupOutput = {
  message: string;
};

async function signup(body: z.infer<typeof schema.signupInput>): Promise<Result<SignupOutput, string>> {
  const parsed = schema.signupInput.safeParse(body);
  if (!parsed.success) {
    console.error(parsed.error);
    return error("parse error");
  }

  try {
    const resp = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!resp.ok) {
      console.error(resp.statusText);
      return error(resp.statusText);
    }

    const output = (await resp.json()) as SignupOutput;
    return success(output);
  } catch (err) {
    console.error(err);
    return error("other error");
  }
}

export type LoginOutput = {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    createdAt: string;
  };
};

async function login(body: z.infer<typeof schema.loginInput>): Promise<Result<LoginOutput, string>> {
  const parsed = schema.loginInput.safeParse(body);
  if (!parsed.success) {
    console.error(parsed.error);
    return error("parse error");
  }

  try {
    const resp = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!resp.ok) {
      console.error(resp.statusText);
      return error(resp.statusText);
    }

    const output = (await resp.json()) as LoginOutput;
    return success(output);
  } catch (err) {
    console.error(err);
    return error("other error");
  }
}

async function putEntry(token: string, body: z.infer<typeof schema.entryInput>): Promise<Result<null, string>> {
  const parsed = schema.entryInput.safeParse(body);
  if (!parsed.success) {
    console.error(parsed.error);
    return error("parse error");
  }

  try {
    const resp = await fetch(`${baseUrl}/api/entry`, {
      method: "PUT",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Authorization: `bearer ${token}`,
      },
    });

    if (!resp.ok) {
      console.error(resp.statusText);
      return error(resp.statusText);
    }
    return success(null);
  } catch (err) {
    console.error(err);
    return error("other error");
  }
}

export type GetEntryOutput = {
  date: string;
  text: JSONContent;
  createdAt: string;
  userId: number;
};

async function getEntry(
  token: string,
  body: z.infer<typeof schema.getEntryInput>,
): Promise<Result<GetEntryOutput | null, string>> {
  const parsed = schema.getEntryInput.safeParse(body);
  if (!parsed.success) {
    console.error(parsed.error);
    return error("parse error");
  }

  try {
    const resp = await fetch(`${baseUrl}/api/entry/${body}`, {
      method: "GET",
      headers: {
        Authorization: `bearer ${token}`,
      },
    });

    // we don't care if entry for today's date exists or not
    if (resp.status === HttpStatusCode.NOT_FOUND) {
      return success(null);
    }

    // we do care if there are other errors
    if (!resp.ok) {
      console.error(resp.statusText);
      return error(resp.statusText);
    }
    const output = (await resp.json()) as GetEntryOutput;
    return success(output);
  } catch (err) {
    console.error(err);
    return error("other error");
  }
}

async function deleteEntry(
  token: string,
  body: z.infer<typeof schema.deleteEntryInput>,
): Promise<Result<null, string>> {
  const parsed = schema.deleteEntryInput.safeParse(body);
  if (!parsed.success) {
    console.error(parsed.error);
    return error("parse error");
  }

  try {
    const resp = await fetch(`${baseUrl}/api/entry/${body}`, {
      method: "DELETE",
      headers: {
        Authorization: `bearer ${token}`,
      },
    });

    if (!resp.ok) {
      console.error(resp.statusText);
      return error(resp.statusText);
    }

    return success(null);
  } catch (err) {
    console.error(err);
    return error("other error");
  }
}

export type GetAllEntryDatesOutput = Set<string>;

async function getAllEntryDates(token: string): Promise<Result<GetAllEntryDatesOutput, string>> {
  try {
    const resp = await fetch(`${baseUrl}/api/entry/dates`, {
      method: "GET",
      headers: {
        Authorization: `bearer ${token}`,
      },
    });

    const output = new Set<string>(await resp.json());
    return success(output);
  } catch (err) {
    console.error(err);
    return error("other error");
  }
}

export const API = {
  signup,
  login,
  putEntry,
  getEntry,
  deleteEntry,
  getAllEntryDates,
};
