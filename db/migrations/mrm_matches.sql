--
-- Table structure for table `mrm_matches`
--

CREATE TABLE IF NOT EXISTS `mrm_matches` (
  `id` int(11) NOT NULL auto_increment,
  `region` int(1) NOT NULL,
  `band1_id` int(11) NOT NULL,
  `band1_votes` int(11) NOT NULL default '0',
  `band2_id` int(11) NOT NULL,
  `band2_votes` int(11) NOT NULL default '0',
  `last_updated` timestamp NOT NULL default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP,
  `start_time` timestamp NOT NULL default '0000-00-00 00:00:00',
  `end_time` timestamp NOT NULL default '0000-00-00 00:00:00',
  `winner_id` int(11) NOT NULL default '0',
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=64 ;
