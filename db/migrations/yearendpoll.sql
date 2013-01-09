--
-- Table structure for table `yr_2012_albums`
--

CREATE TABLE IF NOT EXISTS `yr_2012_albums` (
  `id` int(5) NOT NULL auto_increment,
  `artist` varchar(64) NOT NULL,
  `title` varchar(64) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=64 ;

-- --------------------------------------------------------

--
-- Table structure for table `yr_2012_artists`
--

CREATE TABLE IF NOT EXISTS `yr_2012_artists` (
  `id` int(5) NOT NULL auto_increment,
  `artist` varchar(64) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=53 ;

-- --------------------------------------------------------

--
-- Table structure for table `yr_2012_best_movies`
--

CREATE TABLE IF NOT EXISTS `yr_2012_best_movies` (
  `id` int(5) NOT NULL auto_increment,
  `title` varchar(64) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=26 ;

-- --------------------------------------------------------

--
-- Table structure for table `yr_2012_biggest_comebacks`
--

CREATE TABLE IF NOT EXISTS `yr_2012_biggest_comebacks` (
  `id` int(5) NOT NULL auto_increment,
  `artist` varchar(64) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=9 ;

-- --------------------------------------------------------

--
-- Table structure for table `yr_2012_celebrity_deaths`
--

CREATE TABLE IF NOT EXISTS `yr_2012_celebrity_deaths` (
  `id` int(5) NOT NULL auto_increment,
  `artist` varchar(64) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=71 ;

-- --------------------------------------------------------

--
-- Table structure for table `yr_2012_concerts`
--

CREATE TABLE IF NOT EXISTS `yr_2012_concerts` (
  `id` int(5) NOT NULL auto_increment,
  `concert` varchar(128) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=79 ;

-- --------------------------------------------------------

--
-- Table structure for table `yr_2012_late_night_tv`
--

CREATE TABLE IF NOT EXISTS `yr_2012_late_night_tv` (
  `id` int(5) NOT NULL auto_increment,
  `show` varchar(64) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=17 ;

-- --------------------------------------------------------

--
-- Table structure for table `yr_2012_most_anticipated`
--

CREATE TABLE IF NOT EXISTS `yr_2012_most_anticipated` (
  `id` int(5) NOT NULL auto_increment,
  `artist` varchar(64) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=39 ;

-- --------------------------------------------------------

--
-- Table structure for table `yr_2012_music_videos`
--

CREATE TABLE IF NOT EXISTS `yr_2012_music_videos` (
  `id` int(5) NOT NULL auto_increment,
  `artist` varchar(64) NOT NULL,
  `title` varchar(64) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=55 ;

-- --------------------------------------------------------

--
-- Table structure for table `yr_2012_new_artists`
--

CREATE TABLE IF NOT EXISTS `yr_2012_new_artists` (
  `id` int(5) NOT NULL auto_increment,
  `artist` varchar(64) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=37 ;

-- --------------------------------------------------------

--
-- Table structure for table `yr_2012_philly_artists`
--

CREATE TABLE IF NOT EXISTS `yr_2012_philly_artists` (
  `id` int(5) NOT NULL auto_increment,
  `artist` varchar(64) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=47 ;

-- --------------------------------------------------------

--
-- Table structure for table `yr_2012_songs`
--

CREATE TABLE IF NOT EXISTS `yr_2012_songs` (
  `id` int(5) NOT NULL auto_increment,
  `artist` varchar(64) NOT NULL,
  `title` varchar(64) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=271 ;

-- --------------------------------------------------------

--
-- Table structure for table `yr_2012_songs_voted`
--

CREATE TABLE IF NOT EXISTS `yr_2012_songs_voted` (
  `id` int(5) NOT NULL auto_increment,
  `ip_address` varchar(20) NOT NULL,
  `song1` varchar(120) NOT NULL,
  `song2` varchar(120) NOT NULL,
  `song3` varchar(120) NOT NULL,
  `song4` varchar(120) NOT NULL,
  `song5` varchar(120) NOT NULL,
  `song6` varchar(120) NOT NULL,
  `song7` varchar(120) NOT NULL,
  `song8` varchar(120) NOT NULL,
  `song9` varchar(120) NOT NULL,
  `song10` varchar(120) NOT NULL,
  `song11` varchar(120) NOT NULL,
  `song12` varchar(120) NOT NULL,
  `song13` varchar(120) NOT NULL,
  `song14` varchar(120) NOT NULL,
  `song15` varchar(120) NOT NULL,
  `song16` varchar(120) NOT NULL,
  `song17` varchar(120) NOT NULL,
  `song18` varchar(120) NOT NULL,
  `song19` varchar(120) NOT NULL,
  `song20` varchar(120) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=357 ;

-- --------------------------------------------------------

--
-- Table structure for table `yr_2012_tv_comedies`
--

CREATE TABLE IF NOT EXISTS `yr_2012_tv_comedies` (
  `id` int(5) NOT NULL auto_increment,
  `show` varchar(64) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=37 ;

-- --------------------------------------------------------

--
-- Table structure for table `yr_2012_tv_dramas`
--

CREATE TABLE IF NOT EXISTS `yr_2012_tv_dramas` (
  `id` int(5) NOT NULL auto_increment,
  `show` varchar(64) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=50 ;

-- --------------------------------------------------------

--
-- Table structure for table `yr_2012_unnecessary_sequels`
--

CREATE TABLE IF NOT EXISTS `yr_2012_unnecessary_sequels` (
  `id` int(5) NOT NULL auto_increment,
  `title` varchar(64) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=20 ;

-- --------------------------------------------------------

--
-- Table structure for table `yr_2012_worst_movies`
--

CREATE TABLE IF NOT EXISTS `yr_2012_worst_movies` (
  `id` int(5) NOT NULL auto_increment,
  `title` varchar(64) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=26 ;

-- --------------------------------------------------------

--
-- Table structure for table `yr_2012_write_ins`
--

CREATE TABLE IF NOT EXISTS `yr_2012_write_ins` (
  `id` int(5) NOT NULL auto_increment,
  `ip_address` varchar(20) NOT NULL,
  `poll` varchar(64) NOT NULL,
  `write_in` mediumtext NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=386 ;

-- --------------------------------------------------------

--
-- Table structure for table `yr_end_contest`
--

CREATE TABLE IF NOT EXISTS `yr_end_contest` (
  `id` int(5) NOT NULL auto_increment,
  `fname` varchar(64) NOT NULL,
  `lname` varchar(64) NOT NULL,
  `email_address` varchar(64) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `hometown` varchar(64) NOT NULL,
  `contest` varchar(3) NOT NULL,
  `email` varchar(10) NOT NULL,
  `ip_address` varchar(20) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=191 ;

-- --------------------------------------------------------

--
-- Table structure for table `yr_end_ips`
--

CREATE TABLE IF NOT EXISTS `yr_end_ips` (
  `id` int(11) NOT NULL auto_increment,
  `ip_address` varchar(20) NOT NULL,
  `poll` varchar(64) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4837 ;
