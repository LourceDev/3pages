UPDATE `entry`
SET
  `text` = ?,
  `word_count` = ?
WHERE
  `user_id` = ?
  AND `date` = ?;