--
-- Table structure for table `ondemand2`
--

CREATE TABLE IF NOT EXISTS `ondemand2` (
  `id` int(11) NOT NULL auto_increment,
  `date` date NOT NULL,
  `image` varchar(255) NOT NULL,
  `headline` varchar(255) NOT NULL,
  `note` varchar(255) NOT NULL,
  `songs` varchar(255) NOT NULL,
  `audio_url` varchar(255) NOT NULL,
  `source` varchar(10) NOT NULL,
  `deleted` varchar(3) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=173 ;
