--
-- Table structure for table `mrm_votes`
--

CREATE TABLE IF NOT EXISTS `mrm_votes` (
  `id` int(11) NOT NULL auto_increment,
  `match_id` int(11) NOT NULL,
  `voter_ip` varchar(16) NOT NULL,
  `band_id` int(11) NOT NULL,
  PRIMARY KEY  (`match_id`,`voter_ip`,`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3708 ;
