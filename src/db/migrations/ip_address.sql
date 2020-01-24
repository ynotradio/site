--
-- Table structure for table `ip_address`
--

CREATE TABLE IF NOT EXISTS `ip_address` (
  `id` int(11) NOT NULL auto_increment,
  `address` varchar(20) NOT NULL,
  `deleted` varchar(3) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4759 ;
