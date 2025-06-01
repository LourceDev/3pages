function safeEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

export const env = {
  DATABASE_URL: safeEnv("DATABASE_URL"),
  JWT_SECRET: safeEnv("JWT_SECRET"),
  NODE_ENV: safeEnv("NODE_ENV"),
  PORT: parseInt(safeEnv("PORT")),
};
