--
-- Table structure for table `write_in`
--

CREATE TABLE IF NOT EXISTS `write_in` (
  `id` int(11) NOT NULL auto_increment,
  `write_in` varchar(128) NOT NULL,
  `deleted` varchar(3) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=304 ;
