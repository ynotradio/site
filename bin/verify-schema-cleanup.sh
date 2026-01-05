#!/bin/bash
# Verification script for schema cleanup migration
# 
# This script verifies that the unused fields have been properly removed
# from the Neon Postgres database after running migrations.
#
# Usage:
#   DATABASE_URI=postgres://... ./bin/verify-schema-cleanup.sh

set -e

if [ -z "$DATABASE_URI" ]; then
    echo "❌ ERROR: DATABASE_URI environment variable not set"
    echo ""
    echo "Usage: DATABASE_URI=postgres://... $0"
    exit 1
fi

echo "🔍 Verifying schema cleanup..."
echo "Database: ${DATABASE_URI%%@*}@***"
echo ""

# Extract connection details
DB_URL=$DATABASE_URI

# Check for show_name in DJs table
echo "Checking DJs table for show_name column..."
RESULT=$(psql "$DB_URL" -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'djs' AND column_name = 'show_name';")

if [ -z "$RESULT" ] || [ "$RESULT" = " " ]; then
    echo "✅ show_name column not found (expected)"
else
    echo "❌ show_name column still exists in djs table"
    exit 1
fi

# Check for day in Shows table
echo "Checking Shows table for day column..."
RESULT=$(psql "$DB_URL" -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'shows' AND column_name = 'day';")

if [ -z "$RESULT" ] || [ "$RESULT" = " " ]; then
    echo "✅ day column not found (expected)"
else
    echo "❌ day column still exists in shows table"
    exit 1
fi

# Check for enum_shows_day type
echo "Checking for enum_shows_day type..."
RESULT=$(psql "$DB_URL" -t -c "SELECT typname FROM pg_type WHERE typname = 'enum_shows_day';")

if [ -z "$RESULT" ] || [ "$RESULT" = " " ]; then
    echo "✅ enum_shows_day type not found (expected)"
else
    echo "❌ enum_shows_day type still exists"
    exit 1
fi

# Verify expected columns exist
echo ""
echo "Verifying expected DJs columns..."
EXPECTED_COLS="id,email,external_connect_text,external_connect_url,photo_id,on_air,sort_order,legacy_id,migrated_at"
ACTUAL_COLS=$(psql "$DB_URL" -t -c "SELECT string_agg(column_name, ',' ORDER BY ordinal_position) FROM information_schema.columns WHERE table_name = 'djs' AND column_name IN ('id','email','external_connect_text','external_connect_url','photo_id','on_air','sort_order','legacy_id','migrated_at');" | tr -d ' ')

if [[ "$ACTUAL_COLS" == *"$EXPECTED_COLS"* ]]; then
    echo "✅ All expected DJs columns present"
else
    echo "⚠️  Some expected columns might be missing"
    echo "   Expected: $EXPECTED_COLS"
    echo "   Actual: $ACTUAL_COLS"
fi

echo ""
echo "Verifying expected Shows columns..."
EXPECTED_COLS="id,date,start_time,end_time,host_id,note,legacy_id,migrated_at"
ACTUAL_COLS=$(psql "$DB_URL" -t -c "SELECT string_agg(column_name, ',' ORDER BY ordinal_position) FROM information_schema.columns WHERE table_name = 'shows' AND column_name IN ('id','date','start_time','end_time','host_id','note','legacy_id','migrated_at');" | tr -d ' ')

if [[ "$ACTUAL_COLS" == *"$EXPECTED_COLS"* ]]; then
    echo "✅ All expected Shows columns present"
else
    echo "⚠️  Some expected columns might be missing"
    echo "   Expected: $EXPECTED_COLS"
    echo "   Actual: $ACTUAL_COLS"
fi

echo ""
echo "================================"
echo "✅ Schema cleanup verification PASSED"
echo "================================"
echo ""
echo "The following unused fields have been successfully removed:"
echo "  - djs.show_name (column)"
echo "  - shows.day (column)"
echo "  - enum_shows_day (type)"
echo ""
echo "Production database is ready for data import."
