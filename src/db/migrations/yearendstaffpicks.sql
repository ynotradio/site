--
-- Table structure for table `year_end_staff_picks`
--

CREATE TABLE IF NOT EXISTS `year_end_staff_picks` (
  `id` int(11) NOT NULL auto_increment,
  `order_id` int(11) NOT NULL,
  `html` longtext NOT NULL,
  `deleted` char(1) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=0;
