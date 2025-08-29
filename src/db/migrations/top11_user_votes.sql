--
-- Table structure for table `top11_user_votes`
-- This table tracks which users have voted in each weekly Top 11 session
--

CREATE TABLE IF NOT EXISTS `top11_user_votes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_email` varchar(255) NOT NULL,
  `vote_week` date NOT NULL COMMENT 'The Monday of the voting week',
  `voted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_auth0_id` varchar(255) DEFAULT NULL COMMENT 'Auth0 user ID for additional security',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_week` (`user_email`, `vote_week`),
  KEY `idx_vote_week` (`vote_week`),
  KEY `idx_user_email` (`user_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;