--
-- Table structure for table `custom_text`
--

CREATE TABLE IF NOT EXISTS `custom_texts` (
  `id` int(11) NOT NULL auto_increment,
  `title` varchar(64) NOT NULL,
  `permalink` varchar(64) NOT NULL,
  `html` longtext NOT NULL,
  `status` varchar(10) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;
