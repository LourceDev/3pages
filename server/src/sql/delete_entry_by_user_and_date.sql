DELETE FROM `entry`
WHERE
  `user_id` = ?
  AND `date` = ?;