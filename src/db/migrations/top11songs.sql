--
-- Table structure for table `top11songs`
--

CREATE TABLE IF NOT EXISTS `top11songs` (
  `id` int(3) NOT NULL auto_increment,
  `artist` varchar(64) NOT NULL,
  `song` varchar(64) NOT NULL,
  `value` int(11) NOT NULL,
  `deleted` varchar(1) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=299 ;
