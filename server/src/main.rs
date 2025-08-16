#![deny(clippy::unwrap_used, clippy::panic)]
// allow in tests
#![cfg_attr(test, allow(clippy::unwrap_used, clippy::panic))]

mod controller;
mod datetime;
mod db;
mod env;
mod extractor;
mod middleware;
mod tiptap;
mod utils;
use crate::env::Env;
use axum::{
    Router,
    routing::{delete, get, post, put},
};
use log::info;
use sqlx::SqlitePool;
use tower_http::{cors::CorsLayer, trace::TraceLayer};

#[tokio::main]
async fn main() {
    // initialize the environment variables
    Env::initialize();

    // initialize the logger
    // ref: https://github.com/tokio-rs/tracing/blob/tracing-subscriber-0.3.19/README.md
    tracing_subscriber::fmt::init();

    let pool = SqlitePool::connect(&Env::get().database_url)
        .await
        .expect("Failed to connect to the database");

    let public_routes = Router::new()
        .route("/api", get(controller::root))
        .route("/api/auth/signup", post(controller::signup))
        .route("/api/auth/login", post(controller::login));

    let protected_routes = Router::new()
        .route("/api/entry/{date}", put(controller::put_entry))
        .route("/api/entry/dates", get(controller::get_all_entry_dates))
        .route("/api/entry/{date}", get(controller::get_entry_by_date))
        .route(
            "/api/entry/{date}",
            delete(controller::delete_entry_by_date),
        )
        .layer(axum::middleware::from_fn_with_state(
            pool.clone(),
            middleware::authenticate,
        ));

    // TODO: change this in production
    let cors = CorsLayer::new()
        .allow_methods(tower_http::cors::Any)
        .allow_headers(tower_http::cors::Any)
        .allow_origin(tower_http::cors::Any);

    let app = public_routes
        .merge(protected_routes)
        // ref: https://github.com/tokio-rs/axum/blob/3b92cd7593a900d3c79c2aeb411f90be052a9a5c/examples/sqlx-postgres/src/main.rs#L55
        // ref: https://docs.rs/axum/0.8.4/axum/struct.Router.html#method.with_state
        .with_state(pool)
        .layer(cors)
        // set up logging middleware
        // ref: https://docs.rs/axum/0.8.4/axum/struct.Router.html#example-3
        .layer(TraceLayer::new_for_http());

    let host = "0.0.0.0";
    let port = Env::get().port;
    // start the server
    // ref: https://docs.rs/axum/0.8.4/axum/index.html#example
    #[allow(clippy::panic)]
    let listener = tokio::net::TcpListener::bind(format!("{}:{}", host, port))
        .await
        .unwrap_or_else(|err| {
            panic!("Failed to bind to {}:{}. Error: {}", host, port, err);
        });

    if let Ok(addr) = listener.local_addr() {
        info!("Server running on {:?}", addr);
    } else {
        info!("Server started on {}:{}", host, port);
        info!("Failed to get local address");
    }

    #[allow(clippy::panic)]
    axum::serve(listener, app).await.unwrap_or_else(|err| {
        panic!(
            "Failed to start server on {}:{}. Error: {}",
            host, port, err
        );
    });
}
