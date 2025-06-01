function safeEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

export const env = {
  NEXT_PUBLIC_SERVER_BASE_URL: safeEnv("NEXT_PUBLIC_SERVER_BASE_URL"),
};
