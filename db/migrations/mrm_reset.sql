TRUNCATE table mrm_votes;

UPDATE mrm_matches SET band1_votes = 0, band2_votes = 0, show_score = 0, winner_id = 0;

UPDATE mrm_matches SET band1_id = 0, band2_id = 0 WHERE id > 32;