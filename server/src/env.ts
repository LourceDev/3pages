function safeEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

export default {
  JWT_SECRET: safeEnv("JWT_SECRET"),
  PORT: parseInt(safeEnv("PORT")),
};
