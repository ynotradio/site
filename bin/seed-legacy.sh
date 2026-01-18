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
docker compose exec -T -e MYSQL_PWD=root mysql mysql -u root -e "CREATE DATABASE IF NOT EXISTS ynot_site;" 2>/dev/null || true

# Import schema if tables don't exist
TABLE_COUNT=$(docker compose exec -T -e MYSQL_PWD=root mysql mysql -u root ynot_site -N -e "SHOW TABLES;" 2>/dev/null | wc -l)
if [ "$TABLE_COUNT" -eq "0" ]; then
    echo "   Importing database schema..."
    if [ -f "src/db/docker/ynot_db.sql" ]; then
        docker compose exec -T -e MYSQL_PWD=root mysql mysql -u root ynot_site < src/db/docker/ynot_db.sql
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

-- Seed sample stories
INSERT INTO stories (start_date, end_date, headline, story, pic, pic_url, priority, deleted) VALUES
('2026-01-01', '2026-01-31', 'Welcome to Y-Not Radio', 
'<b>Y-Not Radio</b> is an independent online radio station playing the best in indie rock, alternative, and college radio. Tune in 24/7 for new music discoveries and deep cuts from your favorite artists.', 
'https://i.imgur.com/example1.jpg', 'https://www.ynotradio.net', 1, 'n'),
('2026-01-01', '2026-01-15', 'New Music Friday', 
'Check out the latest releases from <b>Sample Artist</b>, <b>Test Band</b>, and <b>Demo Group</b>. New albums spinning all day!', 
'https://i.imgur.com/example2.jpg', 'https://www.ynotradio.net/schedule.php', 2, 'n'),
('2026-01-01', '2026-01-10', 'Win Concert Tickets', 
'<a href="contests.php"><b>ENTER HERE</b></a> for your chance to win tickets to see <b>Sample Artist</b> at The Venue next month!', 
'https://i.imgur.com/example3.jpg', 'contests.php', 3, 'n');

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
echo ""
echo "🌐 View at: http://localhost:8080"
echo "🗄️  PHPMyAdmin: http://localhost:8181"
echo ""
echo "💡 To use production data instead, run: ./bin/refresh_local.sh"
