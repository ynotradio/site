--
-- Table structure for table `ondemand`
--

CREATE TABLE IF NOT EXISTS `ondemand` (
  `id` int(11) NOT NULL auto_increment,
  `artist` varchar(48) NOT NULL,
  `title` varchar(64) NOT NULL,
  `url` varchar(128) NOT NULL,
  `deleted` varchar(3) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=39 ;
