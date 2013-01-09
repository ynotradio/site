--
-- Table structure for table `top11`
--

CREATE TABLE IF NOT EXISTS `top11` (
  `placement` int(2) NOT NULL,
  `artist` varchar(64) NOT NULL,
  `song` varchar(64) NOT NULL,
  `note` varchar(24) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
