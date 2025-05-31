import { z } from "zod";
import { schema } from "./validation-schema";

const baseUrl = "http://localhost:3000";

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

async function signup(
  body: z.infer<typeof schema.signupInput>
): Promise<Result<SignupOutput, string>> {
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

async function login(
  body: z.infer<typeof schema.loginInput>
): Promise<Result<LoginOutput, string>> {
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

async function putEntry(
  token: string,
  body: z.infer<typeof schema.entryInput>
): Promise<Result<null, string>> {
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

export const API = {
  signup,
  login,
  putEntry,
};
