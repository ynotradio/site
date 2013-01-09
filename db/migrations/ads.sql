SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

--
-- Table structure for table `ads`
--

CREATE TABLE IF NOT EXISTS `ads` (
  `id` int(11) NOT NULL auto_increment,
  `name` char(55) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `pic_url` char(180) NOT NULL,
  `web_url` char(180) NOT NULL,
  `deleted` char(1) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=14 ;
