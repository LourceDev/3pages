use dotenvy::dotenv;
use std::env;
use std::sync::OnceLock;

#[derive(Debug)]
pub struct Env {
    pub database_url: String,
    pub jwt_secret: String,
    pub port: u16,
}

// ref: https://doc.rust-lang.org/std/sync/struct.OnceLock.html
// OnceLock is used to run the env initialization code only once
static ENV: OnceLock<Env> = OnceLock::new();

impl Env {
    pub fn get() -> &'static Env {
        ENV.get().expect("Environment variables not initialized")
    }

    pub fn initialize() {
        let env = Env::try_from_env().expect("Failed to initialize environment variables");
        ENV.set(env)
            .expect("Environment variables already initialized");
    }

    fn try_from_env() -> Result<Self, &'static str> {
        // load environment variables from .env file
        // ref: https://github.com/allan2/dotenvy/blob/v0.15.7/README.md
        dotenv().expect(".env file not found");

        let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
        let jwt_secret = env::var("JWT_SECRET").expect("JWT_SECRET must be set");
        let port = env::var("PORT")
            .expect("PORT must be set")
            .parse::<u16>()
            .expect("PORT must be a valid number");
        let env = Env {
            database_url,
            jwt_secret,
            port,
        };
        Ok(env)
    }
}
