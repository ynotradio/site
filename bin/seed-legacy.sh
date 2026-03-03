#!/bin/bash
# Seed legacy MySQL database with sample data based on ynot_db.sql structure
# Usage: ./bin/seed-legacy.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "🌱 Seeding legacy MySQL database with sample data..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    exit 1
fi

# Check if MySQL container is running
if ! docker compose ps mysql | grep -q "Up"; then
    echo "❌ Error: MySQL container is not running"
    echo "   Start with: docker compose up -d"
    exit 1
fi

# Create database and import schema if needed
echo "   Checking database schema..."
docker compose exec -T mysql bash -c 'MYSQL_PWD=root mysql -u root -e "CREATE DATABASE IF NOT EXISTS ynot_site;"'

# Import schema if tables don't exist
TABLE_COUNT=$(docker compose exec -T -e MYSQL_PWD=root mysql mysql -u root ynot_site -N -e "SHOW TABLES;" 2>/dev/null | wc -l)
if [ "$TABLE_COUNT" -eq "0" ]; then
    echo "   Importing database schema..."
    if [ -f "src/db/docker/ynot_db.sql" ]; then
        docker compose exec -T mysql bash -c 'MYSQL_PWD=root mysql -u root ynot_site' < src/db/docker/ynot_db.sql
        echo "   ✅ Schema imported successfully"
    else
        echo "   ⚠️  Warning: Schema file not found at src/db/docker/ynot_db.sql"
        echo "   Database may not have proper structure"
    fi
fi

# Create temporary SQL file with sample data
cat > /tmp/ynot_seed.sql << 'EOF'
-- Clear existing data (keep structure)
DELETE FROM stories;
DELETE FROM deejays;
DELETE FROM concerts;
DELETE FROM cdotw;

-- Seed stories based on real ynotradio.net content with realistic HTML markup
INSERT INTO stories (start_date, end_date, headline, story, pic, pic_url, priority, deleted) VALUES
('2026-02-01', '2026-03-31', 'Top 11 @ 11:<br>Vote & Win The Hives Tickets', 
'Every Thursday at 11am and 11pm, Y-Not Radio counts down the Top 11 indie rock songs of the week.  Vote this week and you\'ll be entered to win tickets for <b>The Hives</b> on Monday, March 16th at The Fillmore.<br><br>
<center>
<b><a href="top11.php">VOTE HERE</a></b></center>', 
'https://i.imgur.com/QjZCxwM.jpeg', 'top11.php', 1, 'n'),
('2026-02-01', '2026-03-31', '<font size=2>Rodney Anonymous Tells You How To Live</font>', 
'On the first Friday of each month <b>Rodney Anonymous</b> takes us on a 2 hour trip into his world of industrial, goth, and dark wave music!  <!--Tune in this Friday, February 6th from 9-11pm or Sunday the 8th from 7-9pm for a dance-party episode!  -->If you missed Rodney\'s February dance party show, catch the replay this Sunday from 7-9pm, or you can hear it any time <a href="rodney.php">On Demand</a>.', 
'images/rodney.png', 'rodney.php', 2, 'n'),
('2026-02-01', '2026-03-31', 'Trainwreck Boyfriend Y-Not Session', 
'Philly newcomers <b>Trainwreck Boyfriend</b> just released their self-titled debut album and joined Y-Not\'s <strong>Josh T. Landow </strong>to chat about it and perform an acoustic set.  If you missed Trainwreck Boyfriend\'s <em>Y-Not Session</em>, you can listen to it any time  <a href="ondemand.php">On Demand</a>. <em>Get Trainwreck Boyfriend\'s album on <a href="https://trainwreckboyfriend.bandcamp.com" target="_blank">Bandcamp</a>.</em>', 
'https://i.imgur.com/TH7qD6Y.jpeg', 'ondemand.php', 3, 'n');

-- Seed sample DJs
INSERT INTO deejays (id, name, `show`, email, external_connect_text, external_connect_url, pic, sort, deleted) VALUES
(1, 'Josh T. Landow', 'Top 11 @ 11<br>Future Fridays', 'josh@ynotradio.net', 'Josh T. on Facebook', 'http://www.facebook.com/josh.t.landow.1', 'https://i.imgur.com/example.jpg', 1, 'no'),
(2, 'Test DJ', 'Mondays 1-5pm', 'test@ynotradio.net', '', '', 'https://i.imgur.com/example.jpg', 2, 'no'),
(3, 'Sample Host', 'Wednesdays 8-10pm', 'sample@ynotradio.net', 'Follow on Twitter', 'http://twitter.com/sample', 'https://i.imgur.com/example.jpg', 3, 'no');

-- Seed sample concerts
INSERT INTO concerts (date, artist, band_pic_url, band_url, venue, ticketinfo, ticketurl, featured, deleted) VALUES
('2026-02-01', 'Sample Artist', 'https://i.imgur.com/band1.jpg', 'https://sampleartist.com', 'The Foundry', 'Tickets', 'https://ticketmaster.com/example1', 'yes', 'n'),
('2026-02-05', 'Test Band with Special Guest', 'https://i.imgur.com/band2.jpg', 'https://testband.com', 'Union Transfer', 'Sold Out', '', 'no', 'n'),
('2026-02-10', 'Demo Group', 'https://i.imgur.com/band3.jpg', 'https://demogroup.com', 'World Cafe Live', 'Buy Tickets', 'https://ticketmaster.com/example2', 'yes', 'n'),
('2026-02-15', 'Example Artist', 'https://i.imgur.com/band4.jpg', 'https://exampleartist.com', 'The Fillmore', 'Tickets', 'https://ticketmaster.com/example3', 'no', 'n'),
('2026-02-20', 'Another Band', 'https://i.imgur.com/band5.jpg', 'https://anotherband.com', 'Johnny Brenda\'s', 'Tickets', 'https://johnnybrendas.com', 'no', 'n');

-- Seed sample CD of the Week
INSERT INTO cdotw (artist, title, label, review, cd_pic_url, band, reviewer, date, deleted) VALUES
('Sample Artist', 'Great Album', 'Independent', 
'This is a sample review for testing purposes. <b>Sample Artist</b> delivers an incredible performance on their latest album <em>Great Album</em>. The production is crisp, the songwriting is mature, and the energy is infectious. Standout tracks include "Hit Single" and "Deep Cut". Highly recommended!', 
'https://i.imgur.com/album1.jpg', 'https://sampleartist.com', 'Test Reviewer', CURDATE(), 'no');

-- Seed Year End Poll tables with controlled test fixtures
-- Clear voting tracking tables for a clean test state
DELETE FROM year_end_ips;
DELETE FROM year_end_song_votes;
DELETE FROM year_end_write_ins;
DELETE FROM year_end_contestants;

-- Seed poll option tables with a small, predictable dataset
DELETE FROM year_end_songs;
INSERT INTO year_end_songs (artist, title, votes) VALUES
('Franz Ferdinand', 'Audacious', 0),
('Wet Leg', 'Oh No', 0),
('HAIM', 'Lost Track', 0),
('The Beths', 'Knucklehead', 0),
('Pulp', 'Spike Island', 0);

DELETE FROM year_end_albums;
INSERT INTO year_end_albums (artist, title, votes) VALUES
('Franz Ferdinand', 'The Human Fear', 0),
('Wet Leg', 'moisturizer', 0),
('HAIM', 'I Quit', 0),
('The Beths', 'Straight Line Was a Lie', 0),
('Pulp', 'More', 0);

DELETE FROM year_end_artists;
INSERT INTO year_end_artists (artist, votes) VALUES
('Franz Ferdinand', 0),
('Wet Leg', 0),
('HAIM', 0),
('The Beths', 0),
('Pulp', 0);

DELETE FROM year_end_concerts;
INSERT INTO year_end_concerts (concert, votes) VALUES
('Franz Ferdinand @ The Fillmore', 0),
('Wet Leg @ Franklin Music Hall', 0),
('HAIM @ Mann Center', 0);

DELETE FROM year_end_new_artists;
INSERT INTO year_end_new_artists (artist, votes) VALUES
('Lambrini Girls', 0),
('Rocket', 0),
('Wisp', 0);

DELETE FROM year_end_philly_artists;
INSERT INTO year_end_philly_artists (artist, votes) VALUES
('Kurt Vile', 0),
('Mannequin Pussy', 0),
('Tisburys, The', 0);

DELETE FROM year_end_most_anticipated_albums;
INSERT INTO year_end_most_anticipated_albums (artist, votes) VALUES
('LCD Soundsystem', 0),
('Radiohead', 0);

DELETE FROM year_end_tv_dramas;
INSERT INTO year_end_tv_dramas (title, votes) VALUES
('Severance', 0),
('Andor', 0),
('The Bear', 0);

DELETE FROM year_end_tv_comedies;
INSERT INTO year_end_tv_comedies (title, votes) VALUES
('Abbott Elementary', 0),
('Only Murders in the Building', 0),
('Hacks', 0);

DELETE FROM year_end_best_movies;
INSERT INTO year_end_best_movies (title, votes) VALUES
('Sinners', 0),
('Superman', 0),
('The Naked Gun', 0);

DELETE FROM year_end_worst_movies;
INSERT INTO year_end_worst_movies (title, votes) VALUES
('Snow White', 0),
('A Minecraft Movie', 0);

DELETE FROM year_end_unnecessary_sequels;
INSERT INTO year_end_unnecessary_sequels (title, votes) VALUES
('Freakier Friday', 0),
('Happy Gilmore 2', 0),
('Five Nights at Freddy''s 2', 0);

EOF

# Import the seed data
echo "   Importing seed data..."
docker compose exec -T -e MYSQL_PWD=root mysql mysql -u root ynot_site < /tmp/ynot_seed.sql

# Clean up
rm /tmp/ynot_seed.sql

# Verify data
echo ""
echo "✅ Sample data seeded successfully!"
echo ""
echo "📊 Database contents:"
echo "   Stories: $(docker compose exec -T -e MYSQL_PWD=root mysql mysql -u root ynot_site -N -e "SELECT COUNT(*) FROM stories")"
echo "   DJs: $(docker compose exec -T -e MYSQL_PWD=root mysql mysql -u root ynot_site -N -e "SELECT COUNT(*) FROM deejays")"
echo "   Concerts: $(docker compose exec -T -e MYSQL_PWD=root mysql mysql -u root ynot_site -N -e "SELECT COUNT(*) FROM concerts")"
echo "   CD of the Week: $(docker compose exec -T -e MYSQL_PWD=root mysql mysql -u root ynot_site -N -e "SELECT COUNT(*) FROM cdotw")"
echo "   Year End Songs: $(docker compose exec -T -e MYSQL_PWD=root mysql mysql -u root ynot_site -N -e "SELECT COUNT(*) FROM year_end_songs")"
echo "   Year End Albums: $(docker compose exec -T -e MYSQL_PWD=root mysql mysql -u root ynot_site -N -e "SELECT COUNT(*) FROM year_end_albums")"
echo ""
echo "🌐 View at: http://localhost:8080"
echo "🗄️  PHPMyAdmin: http://localhost:8181"
echo ""
echo "💡 To use production data instead, run: ./bin/refresh_local.sh"
