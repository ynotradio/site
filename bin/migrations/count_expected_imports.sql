-- Count records expected to be imported from Y-Not Radio MySQL database
-- Filters out deleted records and applies date windows where applicable
-- Note: Different tables use different values for the 'deleted' column ('n'/'y' or 'no'/'yes')
--
-- Usage:
--   mysql -u username -p database_name < count_expected_imports.sql
--
-- Date Windows:
--   - Music, Concerts, Posts, Ads: Last 3 months
--   - On Demand, CD of the Week: Last 3 months
--   - Shows (Schedule): Last 30 days
--   - DJs: All records (no date filtering)

SELECT 
  'Ads' as collection,
  COUNT(*) as total_records,
  (SELECT COUNT(*) FROM ads WHERE deleted = 'n' AND start_date >= DATE_SUB(NOW(), INTERVAL 3 MONTH)) as last_3_months
FROM ads WHERE deleted = 'n'

UNION ALL

SELECT 
  'Concerts' as collection,
  COUNT(*) as total_records,
  (SELECT COUNT(*) FROM concerts WHERE deleted = 'n' AND date >= DATE_SUB(NOW(), INTERVAL 3 MONTH)) as last_3_months
FROM concerts WHERE deleted = 'n'

UNION ALL

SELECT 
  'CD of the Week' as collection,
  COUNT(*) as total_records,
  (SELECT COUNT(*) FROM cdotw WHERE deleted = 'no' AND date >= DATE_SUB(NOW(), INTERVAL 3 MONTH)) as last_3_months
FROM cdotw WHERE deleted = 'no'

UNION ALL

SELECT 
  'DJs' as collection,
  COUNT(*) as total_records,
  COUNT(*) as all_records_imported
FROM deejays WHERE deleted = 'no'

UNION ALL

SELECT 
  'Music (Songs)' as collection,
  COUNT(*) as total_records,
  (SELECT COUNT(*) FROM music WHERE deleted = 'n' AND date >= DATE_SUB(NOW(), INTERVAL 3 MONTH)) as last_3_months
FROM music WHERE deleted = 'n'

UNION ALL

SELECT 
  'On Demand' as collection,
  COUNT(*) as total_records,
  (SELECT COUNT(*) FROM ondemand WHERE deleted = 'no' AND date >= DATE_SUB(NOW(), INTERVAL 3 MONTH)) as last_3_months
FROM ondemand WHERE deleted = 'no'

UNION ALL

SELECT 
  'Posts' as collection,
  COUNT(*) as total_records,
  (SELECT COUNT(*) FROM stories WHERE deleted = 'n' AND start_date >= DATE_SUB(NOW(), INTERVAL 3 MONTH)) as last_3_months
FROM stories WHERE deleted = 'n'

UNION ALL

SELECT 
  'Shows (Schedule)' as collection,
  COUNT(*) as total_records,
  (SELECT COUNT(*) FROM schedule WHERE deleted = 'n' AND date >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as last_30_days
FROM schedule WHERE deleted = 'n'

ORDER BY collection;
