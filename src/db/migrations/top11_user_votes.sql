--
-- Table structure for table `top11_user_votes`
-- This table tracks which users have voted in each weekly Top 11 session
--

CREATE TABLE IF NOT EXISTS `top11_user_votes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_email` varchar(255) NOT NULL,
  `voting_period` varchar(255) NOT NULL COMMENT 'The voting period identifier (e.g., Top 11 date)',
  `voted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_auth0_id` varchar(255) DEFAULT NULL COMMENT 'Auth0 user ID for additional security',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_period` (`user_email`, `voting_period`),
  KEY `idx_voting_period` (`voting_period`),
  KEY `idx_user_email` (`user_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;