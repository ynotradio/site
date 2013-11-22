--
-- Table structure for table `year_end_albums`
--

CREATE TABLE IF NOT EXISTS `year_end_albums` (
  `id` int(5) NOT NULL auto_increment,
  `artist` varchar(64) NOT NULL,
  `title` varchar(64) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=0;

-- --------------------------------------------------------

--
-- Table structure for table `year_end_artists`
--

CREATE TABLE IF NOT EXISTS `year_end_artists` (
  `id` int(5) NOT NULL auto_increment,
  `artist` varchar(64) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=0;

-- --------------------------------------------------------

--
-- Table structure for table `year_end_best_movies`
--

CREATE TABLE IF NOT EXISTS `year_end_best_movies` (
  `id` int(5) NOT NULL auto_increment,
  `title` varchar(64) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=0;

-- --------------------------------------------------------

--
-- Table structure for table `year_end_biggest_comebacks`
--

CREATE TABLE IF NOT EXISTS `year_end_biggest_comebacks` (
  `id` int(5) NOT NULL auto_increment,
  `artist` varchar(64) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=0;

-- --------------------------------------------------------

--
-- Table structure for table `year_end_celebrity_deaths`
--

CREATE TABLE IF NOT EXISTS `year_end_celebrity_deaths` (
  `id` int(5) NOT NULL auto_increment,
  `artist` varchar(64) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=0;

-- --------------------------------------------------------

--
-- Table structure for table `year_end_concerts`
--

CREATE TABLE IF NOT EXISTS `year_end_concerts` (
  `id` int(5) NOT NULL auto_increment,
  `concert` varchar(128) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=0;

-- --------------------------------------------------------

--
-- Table structure for table `year_end_late_night_tv`
--

CREATE TABLE IF NOT EXISTS `year_end_late_night_tv` (
  `id` int(5) NOT NULL auto_increment,
  `show` varchar(64) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=0;

-- --------------------------------------------------------

--
-- Table structure for table `year_end_most_anticipated_albums`
--

CREATE TABLE IF NOT EXISTS `year_end_most_anticipated_albums` (
  `id` int(5) NOT NULL auto_increment,
  `artist` varchar(64) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=0;

-- --------------------------------------------------------

--
-- Table structure for table `year_end_music_videos`
--

CREATE TABLE IF NOT EXISTS `year_end_music_videos` (
  `id` int(5) NOT NULL auto_increment,
  `artist` varchar(64) NOT NULL,
  `title` varchar(64) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=0;

-- --------------------------------------------------------

--
-- Table structure for table `year_end_new_artists`
--

CREATE TABLE IF NOT EXISTS `year_end_new_artists` (
  `id` int(5) NOT NULL auto_increment,
  `artist` varchar(64) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=0;

-- --------------------------------------------------------

--
-- Table structure for table `year_end_philly_artists`
--

CREATE TABLE IF NOT EXISTS `year_end_philly_artists` (
  `id` int(5) NOT NULL auto_increment,
  `artist` varchar(64) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=0;

-- --------------------------------------------------------

--
-- Table structure for table `year_end_songs`
--

CREATE TABLE IF NOT EXISTS `year_end_songs` (
  `id` int(5) NOT NULL auto_increment,
  `artist` varchar(64) NOT NULL,
  `title` varchar(64) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=0;

-- --------------------------------------------------------

--
-- Table structure for table `year_end_song_votes`
--

CREATE TABLE IF NOT EXISTS `year_end_song_votes` (
  `id` int(5) NOT NULL auto_increment,
  `ip_address` varchar(20) NOT NULL,
  `song1` varchar(120),
  `song2` varchar(120),
  `song3` varchar(120),
  `song4` varchar(120),
  `song5` varchar(120),
  `song6` varchar(120),
  `song7` varchar(120),
  `song8` varchar(120),
  `song9` varchar(120),
  `song10` varchar(120),
  `song11` varchar(120),
  `song12` varchar(120),
  `song13` varchar(120),
  `song14` varchar(120),
  `song15` varchar(120),
  `song16` varchar(120),
  `song17` varchar(120),
  `song18` varchar(120),
  `song19` varchar(120),
  `song20` varchar(120),
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=0;

-- --------------------------------------------------------

--
-- Table structure for table `year_end_tv_comedies`
--

CREATE TABLE IF NOT EXISTS `year_end_tv_comedies` (
  `id` int(5) NOT NULL auto_increment,
  `show` varchar(64) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=0;

-- --------------------------------------------------------

--
-- Table structure for table `year_end_tv_dramas`
--

CREATE TABLE IF NOT EXISTS `year_end_tv_dramas` (
  `id` int(5) NOT NULL auto_increment,
  `show` varchar(64) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=0;

-- --------------------------------------------------------

--
-- Table structure for table `year_end_unnecessary_sequels`
--

CREATE TABLE IF NOT EXISTS `year_end_unnecessary_sequels` (
  `id` int(5) NOT NULL auto_increment,
  `title` varchar(64) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=0;

-- --------------------------------------------------------

--
-- Table structure for table `year_end_worst_movies`
--

CREATE TABLE IF NOT EXISTS `year_end_worst_movies` (
  `id` int(5) NOT NULL auto_increment,
  `title` varchar(64) NOT NULL,
  `votes` int(5) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=0;

-- --------------------------------------------------------

--
-- Table structure for table `year_end_write_ins`
--

CREATE TABLE IF NOT EXISTS `year_end_write_ins` (
  `id` int(5) NOT NULL auto_increment,
  `ip_address` varchar(20) NOT NULL,
  `poll` varchar(64) NOT NULL,
  `write_in` mediumtext NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=0;

-- --------------------------------------------------------

--
-- Table structure for table `year_end_contestants`
--

CREATE TABLE IF NOT EXISTS `year_end_contestants` (
  `id` int(5) NOT NULL auto_increment,
  `name` varchar(64) NOT NULL,
  `email` varchar(64) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `hometown` varchar(64) NOT NULL,
  `contest` varchar(3) NOT NULL,
  `newsletter` varchar(10) NOT NULL,
  `ip_address` varchar(20) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=0;

-- --------------------------------------------------------

--
-- Table structure for table `year_end_ips`
--

CREATE TABLE IF NOT EXISTS `year_end_ips` (
  `id` int(11) NOT NULL auto_increment,
  `ip_address` varchar(20) NOT NULL,
  `poll` varchar(64) NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=0;
