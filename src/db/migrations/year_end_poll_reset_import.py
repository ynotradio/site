#!/usr/bin/env python3
"""
Year End Poll Reset & Import Script
====================================

PURPOSE:
    This script converts Year End Poll CSV files exported from Google Sheets
    into SQL import statements with reset logic. It's designed to be run
    annually to set up the new year's poll data.

USAGE:
    1. Export CSV files from Google Sheets to the same directory as this script
    2. Run: python3 year_end_poll_reset_import.py
    3. Import the generated SQL file: year_end_poll_YYYY_import.sql

CSV FILE REQUIREMENTS:
    - CSV files must have a header row with column names
    - Expected columns vary by category (see TABLE_MAPPINGS below)
    - The 'votes' column in CSV can be empty (will be initialized to 0)
    - Files should be named: "YYYY Year End Poll - [Category].csv"

DATABASE SCHEMA:
    All year_end_* tables follow similar patterns:
    - id: INT AUTO_INCREMENT PRIMARY KEY
    - Various data columns (artist, title, concert, etc.)
    - votes: INT (vote count)

MAINTENANCE NOTES FOR FUTURE YEARS:
    1. Update the year in the CSV file names in TABLE_MAPPINGS
    2. If poll categories change:
       - Add new mappings to TABLE_MAPPINGS dict
       - Add new table names to tables_to_reset list
    3. If database schema changes, update the 'columns' in mappings
    4. Verify database tables exist by checking src/db/docker/ynot_db.sql

CREATED: 2024-11-28
LAST MODIFIED: 2024-11-28
"""

import csv
import os
import re
from datetime import datetime

# ==============================================================================
# TABLE MAPPINGS
# ==============================================================================
# Maps CSV files to their corresponding database tables and column structures
#
# Structure:
#   'CSV_FILENAME': {
#       'table': 'database_table_name',
#       'columns': ['col1', 'col2', ...],  # Database columns (including votes)
#       'csv_columns': ['col1', 'col2']     # Columns to read from CSV (excluding votes)
#   }
#
# IMPORTANT: Update the year (2025 -> 2026) in filenames for next year's poll
# ==============================================================================
TABLE_MAPPINGS = {
    '2025 Year End Poll - Songs.csv': {
        'table': 'year_end_songs',
        'columns': ['artist', 'title', 'votes'],
        'csv_columns': ['artist', 'title']
    },
    '2025 Year End Poll - Albums.csv': {
        'table': 'year_end_albums',
        'columns': ['artist', 'title', 'votes'],
        'csv_columns': ['artist', 'title']
    },
    '2025 Year End Poll - Artists.csv': {
        'table': 'year_end_artists',
        'columns': ['artist', 'votes'],
        'csv_columns': ['artist']
    },
    '2025 Year End Poll - New Artist.csv': {
        'table': 'year_end_new_artists',
        'columns': ['artist', 'votes'],
        'csv_columns': ['artist']
    },
    '2025 Year End Poll - Concerts.csv': {
        'table': 'year_end_concerts',
        'columns': ['concert', 'votes'],
        'csv_columns': ['concert']
    },
    '2025 Year End Poll - Philly Artists.csv': {
        'table': 'year_end_philly_artists',
        'columns': ['artist', 'votes'],
        'csv_columns': ['artist']
    },
    '2025 Year End Poll - Most Anticipated.csv': {
        'table': 'year_end_most_anticipated_albums',
        'columns': ['artist', 'votes'],
        'csv_columns': ['artist']
    },
    '2025 Year End Poll - TV Dramas.csv': {
        'table': 'year_end_tv_dramas',
        'columns': ['title', 'votes'],
        'csv_columns': ['title']
    },
    '2025 Year End Poll - TV Comedies.csv': {
        'table': 'year_end_tv_comedies',
        'columns': ['title', 'votes'],
        'csv_columns': ['title']
    },
    '2025 Year End Poll - Best Movies.csv': {
        'table': 'year_end_best_movies',
        'columns': ['title', 'votes'],
        'csv_columns': ['title']
    },
    '2025 Year End Poll - Worst Movies (1).csv': {
        'table': 'year_end_worst_movies',
        'columns': ['title', 'votes'],
        'csv_columns': ['title']
    },
    '2025 Year End Poll - Unnecessary Sequels.csv': {
        'table': 'year_end_unnecessary_sequels',
        'columns': ['title', 'votes'],
        'csv_columns': ['title']
    }
}

def escape_sql_string(value):
    """
    Escape single quotes and backslashes for SQL INSERT statements.

    Args:
        value: String value to escape

    Returns:
        Escaped string safe for SQL insertion
    """
    if value is None:
        return ''
    return value.replace('\\', '\\\\').replace("'", "\\'")


def generate_sql_imports(csv_dir):
    """
    Generate SQL import statements from CSV files.

    This function:
    1. Creates TRUNCATE statements to reset all year-end poll tables
    2. Reads CSV files from the specified directory
    3. Generates INSERT statements with proper escaping
    4. Batches inserts for better readability (50 rows per statement)

    Args:
        csv_dir: Directory containing CSV files

    Returns:
        Complete SQL script as a string
    """
    sql_output = []
    current_year = datetime.now().year

    # Add header
    sql_output.append(f'-- Year End Poll {current_year} Data Import')
    sql_output.append(f'-- Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    sql_output.append('-- Generated from CSV files by year_end_poll_reset_import.py')
    sql_output.append('--')
    sql_output.append('')

    # Add reset logic
    sql_output.append('-- ===========================================================================')
    sql_output.append('-- RESET LOGIC: Truncate all year-end poll tables')
    sql_output.append('-- WARNING: This will DELETE ALL DATA from these tables!')
    sql_output.append('-- ===========================================================================')
    sql_output.append('SET FOREIGN_KEY_CHECKS = 0;')
    sql_output.append('')

    # ==============================================================================
    # TABLES TO RESET
    # ==============================================================================
    # Complete list of all year_end_* tables in the database
    # If you add new poll categories/tables, add them here!
    # ==============================================================================
    tables_to_reset = [
        'year_end_albums',
        'year_end_artists',
        'year_end_best_movies',
        'year_end_biggest_comebacks',
        'year_end_celebrity_deaths',
        'year_end_concerts',
        'year_end_contestants',
        'year_end_ips',
        'year_end_late_night_tv',
        'year_end_most_anticipated_albums',
        'year_end_music_videos',
        'year_end_new_artists',
        'year_end_philly_artists',
        'year_end_song_votes',
        'year_end_songs',
        'year_end_staff_picks',
        'year_end_tv_comedies',
        'year_end_tv_dramas',
        'year_end_unnecessary_sequels',
        'year_end_worst_movies',
        'year_end_write_ins'
    ]

    for table in tables_to_reset:
        sql_output.append(f'TRUNCATE TABLE `{table}`;')

    sql_output.append('')
    sql_output.append('SET FOREIGN_KEY_CHECKS = 1;')
    sql_output.append('')
    sql_output.append('--')
    sql_output.append('-- DATA IMPORTS')
    sql_output.append('--')
    sql_output.append('')

    # Process each CSV file
    for csv_file, mapping in TABLE_MAPPINGS.items():
        csv_path = os.path.join(csv_dir, csv_file)

        if not os.path.exists(csv_path):
            print(f"Warning: {csv_file} not found, skipping...")
            continue

        table = mapping['table']
        columns = mapping['columns']
        csv_columns = mapping['csv_columns']

        sql_output.append(f'--')
        sql_output.append(f'-- Table: {table}')
        sql_output.append(f'-- Source: {csv_file}')
        sql_output.append(f'--')
        sql_output.append('')

        # Read CSV and generate INSERT statements
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = []

            for row in reader:
                # Skip empty rows
                if not any(row.get(col, '').strip() for col in csv_columns):
                    continue

                # Build values list
                values = []
                for col in columns:
                    if col == 'votes':
                        values.append('0')
                    elif col in csv_columns:
                        csv_col = col
                        if col == 'concert':
                            csv_col = 'concert'
                        elif col == 'artist':
                            csv_col = 'artist'
                        elif col == 'title':
                            csv_col = 'title'

                        value = row.get(csv_col, '').strip()
                        values.append(f"'{escape_sql_string(value)}'")

                if values:
                    rows.append(f"({', '.join(values)})")

            if rows:
                # Split into batches of 50 for readability
                batch_size = 50
                for i in range(0, len(rows), batch_size):
                    batch = rows[i:i+batch_size]
                    column_list = ', '.join(f'`{col}`' for col in columns)
                    sql_output.append(f"INSERT INTO `{table}` ({column_list}) VALUES")
                    sql_output.append(',\n'.join(batch) + ';')
                    sql_output.append('')

        sql_output.append('')

    return '\n'.join(sql_output)

if __name__ == '__main__':
    """
    Main execution block.

    Expects CSV files to be in the same directory as this script.
    Generates a SQL file with reset logic and import statements.
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    current_year = datetime.now().year

    print("=" * 80)
    print(f"Year End Poll Reset & Import Script - {current_year}")
    print("=" * 80)
    print(f"Looking for CSV files in: {script_dir}")
    print()

    # Check which CSV files exist
    found_files = []
    missing_files = []
    for csv_file in TABLE_MAPPINGS.keys():
        csv_path = os.path.join(script_dir, csv_file)
        if os.path.exists(csv_path):
            found_files.append(csv_file)
        else:
            missing_files.append(csv_file)

    print(f"Found {len(found_files)} CSV files:")
    for f in found_files:
        print(f"  ✓ {f}")

    if missing_files:
        print(f"\nMissing {len(missing_files)} CSV files:")
        for f in missing_files:
            print(f"  ✗ {f}")

    print("\nGenerating SQL import file...")
    sql_content = generate_sql_imports(script_dir)

    output_file = os.path.join(script_dir, f'year_end_poll_{current_year}_import.sql')
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(sql_content)

    print(f"\n✓ SQL import file generated: {output_file}")
    print("\nNext steps:")
    print("  1. Review the generated SQL file")
    print("  2. Import it into your database:")
    print(f"     mysql -u username -p database_name < {os.path.basename(output_file)}")
    print("=" * 80)
