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
    db::{self},
    utils::decode_jwt,
};

pub async fn authenticate(
    State(pool): State<SqlitePool>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let token = req
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|auth_header| auth_header.to_str().ok())
        .and_then(|auth_header| {
            auth_header
                .strip_prefix("Bearer ")
                .or(auth_header.strip_prefix("bearer "))
        })
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let jwt_data = decode_jwt(token).ok_or(StatusCode::UNAUTHORIZED)?;
    let user_id = jwt_data.claims.user_id;

    let user = db::get_user_by_id(&pool, user_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .ok_or(StatusCode::UNAUTHORIZED)?;

    req.extensions_mut().insert(user);
    Ok(next.run(req).await)
}
