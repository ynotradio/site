--
-- Table structure for table `top11contest`
--

CREATE TABLE IF NOT EXISTS `top11contest` (
  `id` int(11) NOT NULL auto_increment,
  `firstname` varchar(25) NOT NULL,
  `lastname` varchar(25) NOT NULL,
  `email` varchar(50) NOT NULL,
  `phone` varchar(15) NOT NULL,
  `contest` varchar(3) NOT NULL,
  `newsletter` varchar(10) NOT NULL,
  `display` varchar(3) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3828 ;
