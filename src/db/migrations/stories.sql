--
-- Table structure for table `stories`
--

CREATE TABLE IF NOT EXISTS `stories` (
  `id` int(11) NOT NULL auto_increment,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `headline` varchar(50) NOT NULL,
  `story` text NOT NULL,
  `pic` varchar(128) NOT NULL,
  `pic_url` varchar(128) NOT NULL,
  `priority` varchar(10) NOT NULL,
  `deleted` varchar(1) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=216 ;
