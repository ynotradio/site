SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

--
-- Table structure for table `cdotw`
--

CREATE TABLE IF NOT EXISTS `cdotw` (
  `id` int(11) NOT NULL auto_increment,
  `artist` varchar(64) NOT NULL,
  `title` varchar(64) NOT NULL,
  `label` varchar(64) NOT NULL,
  `review` longtext NOT NULL,
  `cd_pic_url` varchar(128) NOT NULL,
  `band` varchar(128) NOT NULL,
  `reviewer` varchar(48) NOT NULL,
  `date` date NOT NULL,
  `deleted` varchar(3) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=120 ;
