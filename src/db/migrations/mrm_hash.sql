--
-- Table structure for table `mrm_hash`
--

CREATE TABLE IF NOT EXISTS `mrm_hash` (
  `id` int(11) NOT NULL auto_increment,
  `old` int(11) NOT NULL,
  `new` int(11) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=63 ;
