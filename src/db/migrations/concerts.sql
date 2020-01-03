--
-- Table structure for table `concerts`
--

CREATE TABLE IF NOT EXISTS `concerts` (
  `id` int(5) NOT NULL auto_increment,
  `date` date NOT NULL,
  `artist` varchar(256) NOT NULL,
  `band_pic_url` varchar(128) NOT NULL,
  `band_url` varchar(128) NOT NULL,
  `venue` varchar(64) NOT NULL,
  `ticketinfo` varchar(64) NOT NULL,
  `ticketurl` varchar(128) NOT NULL,
  `featured` varchar(3) NOT NULL,
  `deleted` varchar(1) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=767 ;
