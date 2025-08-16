SELECT
  `user_id`,
  `date`,
  `text` AS "text: serde_json::Value",
  `word_count`,
  `created_at`
FROM
  `entry`
WHERE
  `user_id` = ?
  AND `date` = ?;