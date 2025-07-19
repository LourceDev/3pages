use axum::{
    extract::{Request, State},
    http::{
        StatusCode,
        header::{self},
    },
    middleware::Next,
    response::Response,
};
use sqlx::SqlitePool;

use crate::{
    controller::DbUser,
    utils::{decode_jwt, status_text},
};

pub async fn authenticate(
    State(pool): State<SqlitePool>,
    mut req: Request,
    next: Next,
) -> Result<Response, (StatusCode, &'static str)> {
    let token = req
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|auth_header| auth_header.to_str().ok())
        .and_then(|auth_header| {
            auth_header
                .strip_prefix("Bearer ")
                .or(auth_header.strip_prefix("bearer "))
        })
        .ok_or(status_text(StatusCode::UNAUTHORIZED))?;

    let jwt_data = decode_jwt(token).ok_or(status_text(StatusCode::UNAUTHORIZED))?;
    let user_id = jwt_data.claims.user_id;

    let user = sqlx::query_as!(
        DbUser,
        "select id, email, name, password, created_at from user where id = ?",
        user_id
    )
    .fetch_optional(&pool)
    .await
    .map_err(|_| status_text(StatusCode::INTERNAL_SERVER_ERROR))?
    .ok_or(status_text(StatusCode::UNAUTHORIZED))?;

    req.extensions_mut().insert(user);
    Ok(next.run(req).await)
}
