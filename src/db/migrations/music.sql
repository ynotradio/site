--
-- Table structure for table `music`
--

CREATE TABLE IF NOT EXISTS `music` (
  `id` int(11) NOT NULL auto_increment,
  `artist` varchar(64) NOT NULL,
  `song` varchar(128) NOT NULL,
  `url` varchar(128) NOT NULL,
  `date` date NOT NULL,
  `deleted` varchar(3) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=854 ;
