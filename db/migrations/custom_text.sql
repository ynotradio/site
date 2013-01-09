--
-- Table structure for table `custom_text`
--

CREATE TABLE IF NOT EXISTS `custom_text` (
  `id` int(11) NOT NULL auto_increment,
  `html` longtext NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4 ;
