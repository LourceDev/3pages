use std::ops::Deref;

use serde::{Deserialize, Deserializer, Serialize, Serializer, de::Visitor};
use time::{
    Date, OffsetDateTime, Time, format_description::well_known::Iso8601, macros::format_description,
};

#[derive(Debug, Clone, Copy)]
pub struct AppDateTime(pub OffsetDateTime);

impl AppDateTime {
    pub fn to_iso_string(self) -> Result<String, time::error::Format> {
        self.format(&time::format_description::well_known::Iso8601::DEFAULT)
    }

    pub fn from_iso_string(date_str: &str) -> Result<Self, time::error::Parse> {
        OffsetDateTime::parse(date_str, &Iso8601::DEFAULT)
            .or_else(|_| {
                Date::parse(date_str, format_description!("[year]-[month]-[day]"))
                    .map(|d| d.with_time(Time::MIDNIGHT).assume_utc())
            })
            .map(AppDateTime)
    }

    pub fn to_yyyy_mm_dd_string(self) -> Result<String, time::error::Format> {
        self.format(format_description!("[year]-[month]-[day]"))
    }

    pub fn serialize_to_yyyy_mm_dd_string<S: Serializer>(
        &self,
        serializer: S,
    ) -> Result<S::Ok, S::Error> {
        let formatted_date = self
            .to_yyyy_mm_dd_string()
            .map_err(serde::ser::Error::custom)?;
        serializer.serialize_str(&formatted_date)
    }
}

impl Deref for AppDateTime {
    type Target = OffsetDateTime;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl Serialize for AppDateTime {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let formatted_date = self.to_iso_string().map_err(serde::ser::Error::custom)?;
        serializer.serialize_str(&formatted_date)
    }
}

struct AppDateTimeVisitor;

impl<'de> Visitor<'de> for AppDateTimeVisitor {
    type Value = AppDateTime;

    fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
        formatter.write_str("an `OffsetDateTime`")
    }

    fn visit_str<E>(self, date_str: &str) -> Result<AppDateTime, E>
    where
        E: serde::de::Error,
    {
        AppDateTime::from_iso_string(date_str).map_err(E::custom)
    }
}

impl<'de> Deserialize<'de> for AppDateTime {
    fn deserialize<D>(deserializer: D) -> Result<AppDateTime, D::Error>
    where
        D: Deserializer<'de>,
    {
        deserializer.deserialize_str(AppDateTimeVisitor)
    }
}

impl From<time::OffsetDateTime> for AppDateTime {
    fn from(dt: time::OffsetDateTime) -> Self {
        AppDateTime(dt)
    }
}

impl From<AppDateTime> for time::OffsetDateTime {
    fn from(date: AppDateTime) -> Self {
        date.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    use time::{
        Month,
        macros::{format_description, offset},
    };

    #[derive(Debug, Serialize, Deserialize)]
    struct S {
        date: AppDateTime,
    }

    #[test]
    fn test_date_serialization() {
        let date = time::Date::parse("2025-07-26", format_description!("[year]-[month]-[day]"))
            .map(|d| d.with_time(time::Time::MIDNIGHT).assume_utc())
            .unwrap();
        let output = S { date: date.into() };
        let serialized = serde_json::to_string(&output).unwrap();
        println!("Serialized output: {}", serialized);
        assert_eq!(
            serialized,
            json!({"date":"2025-07-26T00:00:00.000000000Z"}).to_string()
        );
    }

    #[test]
    fn test_full_iso8601_date_deserialization_utc() {
        let input = r#"{"date": "2025-07-26T04:46:09.104Z"}"#;
        let json = serde_json::from_str::<S>(input).unwrap();
        let date = json.date;
        assert_eq!(date.year(), 2025);
        assert_eq!(date.month(), Month::July);
        assert_eq!(date.day(), 26);
        assert_eq!(date.hour(), 4);
        assert_eq!(date.minute(), 46);
        assert_eq!(date.second(), 9);
        assert_eq!(date.nanosecond(), 104_000_000);
        assert_eq!(date.offset(), offset!(UTC));
    }

    #[test]
    fn test_full_iso8601_date_deserialization_ist() {
        let input = r#"{"date": "2025-07-26T04:46:09.104+05:30"}"#;
        let json = serde_json::from_str::<S>(input).unwrap();
        let date = json.date;
        assert_eq!(date.year(), 2025);
        assert_eq!(date.month(), Month::July);
        assert_eq!(date.day(), 26);
        assert_eq!(date.hour(), 4);
        assert_eq!(date.minute(), 46);
        assert_eq!(date.second(), 9);
        assert_eq!(date.nanosecond(), 104_000_000);
        assert_eq!(date.offset(), offset!(+5:30));
    }

    #[test]
    fn test_partial_iso8601_date_deserialization() {
        let input = r#"{"date": "2025-07-26"}"#;
        let json = serde_json::from_str::<S>(input).unwrap();
        let date = json.date;
        assert_eq!(date.year(), 2025);
        assert_eq!(date.month(), Month::July);
        assert_eq!(date.day(), 26);
        assert_eq!(date.hour(), 0);
        assert_eq!(date.minute(), 0);
        assert_eq!(date.second(), 0);
        assert_eq!(date.nanosecond(), 0);
        assert_eq!(date.offset(), offset!(UTC));
    }
}
