use argon2::{
    Argon2, PasswordVerifier,
    password_hash::{PasswordHasher, SaltString},
};
use axum::{
    Router,
    extract::{Json, State},
    http::StatusCode,
    routing::{get, post},
};
use dotenvy::dotenv;
use jsonwebtoken::{EncodingKey, Header, encode};
use log::info;
use rand_core::OsRng;
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::SqlitePool;
use std::env;
use time::OffsetDateTime;
use tower_http::trace::TraceLayer;

#[tokio::main]
async fn main() {
    // load environment variables from .env file
    // ref: https://github.com/allan2/dotenvy/blob/v0.15.7/README.md
    dotenv().expect(".env file not found");

    // initialize the logger
    // ref: https://github.com/tokio-rs/tracing/blob/tracing-subscriber-0.3.19/README.md
    tracing_subscriber::fmt::init();

    let pool = SqlitePool::connect(&env::var("DATABASE_URL").expect("DATABASE_URL not set"))
        .await
        .expect("Failed to connect to the database");

    let app = Router::new()
        .route("/api", get(root))
        .route("/api/auth/signup", post(signup))
        .route("/api/auth/login", post(login))
        // ref: https://github.com/tokio-rs/axum/blob/3b92cd7593a900d3c79c2aeb411f90be052a9a5c/examples/sqlx-postgres/src/main.rs#L55
        // ref: https://docs.rs/axum/0.8.4/axum/struct.Router.html#method.with_state
        .with_state(pool)
        // set up logging middleware
        // ref: https://docs.rs/axum/0.8.4/axum/struct.Router.html#example-3
        .layer(TraceLayer::new_for_http());

    let host = "0.0.0.0";
    let port = env::var("PORT").unwrap();
    // start the server
    // ref: https://docs.rs/axum/0.8.4/axum/index.html#example
    let listener = tokio::net::TcpListener::bind(format!("{}:{}", host, port))
        .await
        .unwrap();
    info!("Server running on http://{}:{}", host, port);
    axum::serve(listener, app).await.unwrap();
}

// root handler
// ref: https://docs.rs/axum/0.8.4/axum/handler/index.html
async fn root() -> Json<serde_json::Value> {
    Json(json!({ "status": "works" }))
}

// TODO: validation
#[derive(Deserialize)]
struct Signup {
    email: String,
    name: String,
    password: String,
}

fn hash_password(password: &str) -> String {
    let params = argon2::ParamsBuilder::new()
        .m_cost(47104)
        .t_cost(2)
        .p_cost(1)
        .build()
        .unwrap();
    let argon2 = Argon2::new(argon2::Algorithm::Argon2id, argon2::Version::V0x13, params);
    let salt = SaltString::generate(&mut OsRng);

    argon2
        .hash_password(password.as_bytes(), &salt)
        .unwrap()
        .to_string()
}

fn verify_password(password: &str, password_hash: &str) -> bool {
    let parsed_hash = argon2::PasswordHash::new(password_hash).unwrap();
    Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok()
}

// signup handler with json input
// ref: https://docs.rs/axum/0.8.4/axum/extract/index.html
async fn signup(
    State(pool): State<SqlitePool>,
    Json(input): Json<Signup>,
) -> (axum::http::StatusCode, axum::Json<serde_json::Value>) {
    let existing_user = sqlx::query!("SELECT id FROM user WHERE email = ?", input.email)
        .fetch_optional(&pool)
        .await
        .unwrap();
    if existing_user.is_some() {
        // TODO: vulnerable to enumeration attack
        // ref: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#authentication-responses
        // ref: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/03-Identity_Management_Testing/04-Testing_for_Account_Enumeration_and_Guessable_User_Account
        return (
            StatusCode::CONFLICT,
            Json(json!({ "error": "User already exists" })),
        );
    }

    let hashed_password = hash_password(&input.password);

    sqlx::query!(
        "INSERT INTO user (email, name, password) VALUES (?, ?, ?)",
        input.email,
        input.name,
        hashed_password
    )
    .execute(&pool)
    .await
    .unwrap();

    (
        StatusCode::CREATED,
        Json(json!({ "message": "User created successfully" })),
    )
}

#[derive(Deserialize)]
struct Login {
    email: String,
    password: String,
}

#[derive(Serialize)]
struct DbUser {
    id: i64,
    email: String,
    name: String,
    #[serde(skip_serializing)]
    password: String,
    #[serde(with = "time::serde::rfc3339")]
    created_at: OffsetDateTime,
}

fn create_jwt(user_id: i64) -> String {
    #[derive(Debug, Serialize, Deserialize)]
    struct Claims {
        // match js server behavior
        #[serde(rename = "userId")]
        user_id: i64,
        iat: usize, // Optional. Issued at (as UTC timestamp)
        exp: usize, // Required (validate_exp defaults to true in validation). Expiration time (as UTC timestamp)
    }

    let claims = Claims {
        user_id,
        iat: OffsetDateTime::now_utc().unix_timestamp() as usize,
        exp: (OffsetDateTime::now_utc() + time::Duration::days(7)).unix_timestamp() as usize,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(env::var("JWT_SECRET").expect("JWT_SECRET not set").as_ref()),
    )
    .unwrap()
}

async fn login(
    State(pool): State<SqlitePool>,
    Json(input): Json<Login>,
) -> (axum::http::StatusCode, axum::Json<serde_json::Value>) {
    let user = sqlx::query_as!(
        DbUser,
        "select id, email, name, password, created_at from user where email = ?",
        input.email
    )
    .fetch_optional(&pool)
    .await
    .unwrap();

    let unauthorized_response = || {
        (
            StatusCode::UNAUTHORIZED,
            Json(json!({ "error": "Incorrect email or password" })),
        )
    };

    if user.is_none() {
        return unauthorized_response();
    }

    let user = user.unwrap();

    if !verify_password(&input.password, &user.password) {
        return unauthorized_response();
    }

    let token = create_jwt(user.id);

    (
        StatusCode::OK,
        Json(json!({ "token": token, "user": user })),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    /// to ensure that we can verify existing password hashes generated by js
    /// server.
    fn verify_existing_hash() {
        let password = "jack@example.com";
        let old_hash = "$argon2id$v=19$m=47104,t=2,p=1$Wej+XgzGzI6kDYK+8F3DPA$9aeemDzDmYWBr3aUBiUl4m3WvcFUOB1f1+aSfnUM5X4";
        assert!(verify_password(password, old_hash));
    }

    #[test]
    /// to ensure that we can verify newly created password hashes
    fn verify_new_hash() {
        let password = "jack@example.com";
        let new_hash = hash_password(password);
        assert!(verify_password(password, &new_hash));
    }
}
