mod controller;
mod utils;

use axum::{
    Router,
    routing::{get, post},
};
use dotenvy::dotenv;
use log::info;
use sqlx::SqlitePool;
use std::env;
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
        .route("/api", get(controller::root))
        .route("/api/auth/signup", post(controller::signup))
        .route("/api/auth/login", post(controller::login))
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
