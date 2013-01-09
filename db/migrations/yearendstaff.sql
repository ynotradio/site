--
-- Table structure for table `yearendstaff`
--

CREATE TABLE IF NOT EXISTS `yearendstaff` (
  `id` int(11) NOT NULL auto_increment,
  `order_id` int(11) NOT NULL,
  `html` longtext NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=39 ;
