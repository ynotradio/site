--
-- Table structure for table `deejays`
--

CREATE TABLE IF NOT EXISTS `deejays` (
  `id` int(11) NOT NULL auto_increment,
  `name` varchar(64) NOT NULL,
  `show` varchar(64) NOT NULL,
  `email` varchar(64) NOT NULL,
  `external_connect_text` varchar(64) NOT NULL,
  `external_connect_url` varchar(128) NOT NULL,
  `pic` varchar(128) NOT NULL,
  `sort` int(1) NOT NULL,
  `deleted` varchar(3) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=40 ;
