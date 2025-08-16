SELECT
  `id`,
  `email`,
  `name`,
  `password`,
  `created_at`
FROM
  `user`
WHERE
  `id` = ?;