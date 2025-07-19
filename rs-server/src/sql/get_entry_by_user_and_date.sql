SELECT
  `user_id`,
  `date`,
  `text` AS "text: serde_json::Value",
  `created_at`
FROM
  `entry`
WHERE
  `user_id` = ?
  AND `date` = ?