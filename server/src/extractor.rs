// ref: https://github.com/tokio-rs/axum/blob/ff031867df7126abe288f13a62c51849c9e544af/examples/validator/src/main.rs

use std::collections::HashMap;

use axum::{
    extract::{FromRequest, Json, Request, rejection::JsonRejection},
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde::de::DeserializeOwned;
use thiserror::Error;
use validator::Validate;

#[derive(Debug, Clone, Copy, Default)]
pub struct ValidatedJson<T>(pub T);

impl<T, S> FromRequest<S> for ValidatedJson<T>
where
    T: DeserializeOwned + Validate,
    S: Send + Sync,
    Json<T>: FromRequest<S, Rejection = JsonRejection>,
{
    type Rejection = ServerError;

    async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
        let Json(value) = Json::<T>::from_request(req, state).await?;
        value.validate()?;
        Ok(ValidatedJson(value))
    }
}

#[derive(Debug, Error)]
pub enum ServerError {
    #[error(transparent)]
    ValidationError(#[from] validator::ValidationErrors),

    #[error(transparent)]
    AxumJsonRejection(#[from] JsonRejection),
}

impl IntoResponse for ServerError {
    fn into_response(self) -> Response {
        match self {
            ServerError::ValidationError(v) => {
                let mut errors = HashMap::new();

                for (field, field_errors) in v.field_errors() {
                    if let Some(first_error) = field_errors.first() {
                        let message = first_error
                            .message
                            .as_ref()
                            .map_or_else(|| "Invalid value".to_string(), |cow| cow.to_string());
                        errors.insert(field, message);
                    }
                }
                (
                    StatusCode::BAD_REQUEST,
                    Json(serde_json::json!({"error": "validation_error","fields": errors})),
                )
                    .into_response()
            }

            ServerError::AxumJsonRejection(rejection) => {
                let message = rejection.to_string();
                let body = Json(serde_json::json!({ "error": message }));
                (StatusCode::BAD_REQUEST, body).into_response()
            }
        }
        .into_response()
    }
}
