/*
> In order to make the value of an environment variable accessible in the browser, 
> Next.js can "inline" a value, at build time, into the js bundle that is delivered
> to the client, replacing all references to process.env.[variable] with a 
> hard-coded value.
> 
> ~ https://nextjs.org/docs/pages/guides/environment-variables#bundling-environment-variables-for-the-browser
*/

function safeEnv(key: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

export const env = {
  NEXT_PUBLIC_SERVER_BASE_URL: safeEnv("NEXT_PUBLIC_SERVER_BASE_URL", process.env.NEXT_PUBLIC_SERVER_BASE_URL),
};
