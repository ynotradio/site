--
-- Table structure for table `mrm_bands`
--

CREATE TABLE IF NOT EXISTS `mrm_bands` (
  `id` int(2) NOT NULL auto_increment,
  `name` varchar(64) NOT NULL,
  `url` varchar(128) NOT NULL,
  `pic_url` varchar(128) NOT NULL,
  `placement` int(2) NOT NULL,
  `seed` int(2) NOT NULL,
  `abbr` varchar(7) NOT NULL,
  PRIMARY KEY  (`id`),
  UNIQUE KEY `seed` (`placement`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=65 ;
