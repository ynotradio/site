-- Create ondemand table in PostgreSQL for testing
-- This matches the MySQL schema structure

CREATE TABLE IF NOT EXISTS ondemand (
    id SERIAL PRIMARY KEY,
    date timestamp(3) with time zone NOT NULL,
    image varchar(255) NOT NULL,
    headline varchar(255) NOT NULL,
    note text NOT NULL,
    songs text NOT NULL,
    audio_url varchar(255) NOT NULL,
    source varchar(10) NOT NULL DEFAULT 'opendrive',
    legacy_id numeric,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    _status varchar(50)
);

-- Insert sample data (5 recent entries from MySQL dump for testing)
INSERT INTO ondemand (id, date, image, headline, note, songs, audio_url, source, legacy_id) VALUES
(522, '2025-12-12', 'https://i.imgur.com/0A04l6q.png', 'Teen Jesus and The Jean Teasers', 'Y-Not Radio Takeover', 'n/a', '229728665_St0iz', 'opendrive', 522),
(521, '2025-11-14', 'https://i.imgur.com/1PvoIOs.jpeg', 'Ida Maria', 'Y-Not Radio Takeover', 'n/a', '229385344_6RdWJ', 'opendrive', 521),
(520, '2025-10-29', 'https://i.imgur.com/35rbCln.jpeg', 'The Noisy', 'Y-Not Philly Session<br><a href="https://youtu.be/z4yGLIetWDU?si=Jerx6t6EOPiYqOSo" target=_blank><i>Click here for video of the session.</i></a>', 'Morricone / Neckline / Nightshade', '229128251_iXHgE', 'opendrive', 520),
(519, '2025-10-10', 'https://i.imgur.com/D8aejVw.jpeg', 'Petey USA', 'Y-Not Session<br><a href="https://youtu.be/prG6un7tDks" target=_blank><i>Click here for video of the session.</i></a>', 'Ask Someone Else / The Yips / The Milkman', '228632089_Wlj45', 'opendrive', 519),
(518, '2025-09-12', 'https://i.imgur.com/mLlhtxs.jpeg', 'We Are Scientists', 'Y-Not Session<br><a href="https://www.youtube.com/watch?v=I_mhnUKWu1c" target=_blank><i>Click here for video of the session.</i></a>', 'Please Don''t Say It / I Could Do Much Worse / A Lesson I Never Learned', '227956609_oun4Z', 'opendrive', 518),
(517, '2025-07-18', 'https://i.imgur.com/KbCT2xe.jpeg', 'Deep Sea Diver', 'Y-Not Radio Takeover', 'n/a', '225142640_gfkmJ', 'opendrive', 517),
(516, '2025-06-25', 'https://i.imgur.com/8OC8jqN.jpeg', 'Deerking', 'Y-Not Philly Session', 'The Gap / Dallas / High School Park', '223865154_XF2Wk', 'opendrive', 516),
(515, '2025-06-27', 'https://i.imgur.com/3owsyBp.jpeg', 'Polaroid Fade', 'Y-Not Session @ Cambridge Sound Studios<br><a href="https://www.youtube.com/watch?v=WGoKxaaQ_2g" target=_blank><i>Click here for video of the session.</i></a>', 'Bliss / Scared / Any Other Way / Just Like Heaven', '223860329_p5fwo', 'opendrive', 515),
(514, '2025-06-13', 'https://i.imgur.com/6IsZeW5.jpeg', 'OK Go', 'Y-Not Interview', 'n/a', '223015739_Ek5WS', 'opendrive', 514),
(513, '2025-05-30', 'https://i.imgur.com/W6pqnMx.jpeg', 'The Tisburys', 'Y-Not Session<br><a href="https://youtu.be/fLKY01HytlQ" target=_blank><i>Click here for video of the session.</i></a>', 'Forever / Water In The Clouds / A Still Life Without You', '222498177_IHFta', 'opendrive', 513)
ON CONFLICT (id) DO NOTHING;

-- Update sequence to continue from max id
SELECT setval('ondemand_id_seq', (SELECT MAX(id) FROM ondemand));
