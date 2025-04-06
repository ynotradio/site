# Modern Rock Madness - Annual Update Checklist

This document outlines the steps needed to update the Modern Rock Madness tournament each year.

## 1. Update Configuration

Edit the configuration file at `/src/partials/_mrm_config.php`:

- Update `$madness_start_date` to the new tournament start date (format: YYYY-MM-DD)
- Update `$madness_bracket_pdf_url` with the URL to the new bracket PDF
- Update `$madness_banner_image_url` with the URL to the new banner image

## 2. Reset the Database

1. Navigate to the MRM Admin page (`/src/mrm_admin.php`)
2. Click "Generate Reset SQL" to download the SQL reset script
3. Backup your current database
4. Execute the SQL script in your database management tool (e.g., phpMyAdmin)

## 3. Update Band Data

1. Navigate to MRM Bands page (`/src/mrm_view_all.php`) 
2. Add/update bands for the new tournament:
   - Upload band images to `/src/images/bands/` directory
   - Add all 64 bands participating in the tournament
   - Assign proper seeds and regions

## 4. Test the Tournament

1. Visit the MRM Admin page (`/src/mrm_admin.php`)
2. Click "Preview Tournament" to verify the tournament display
3. Check that all match dates are calculated correctly
4. Verify that all bands appear in the proper positions 

## 5. Update Front-end Assets (if needed)

- Update any year-specific graphics or text
- Check for hardcoded years in templates that need updating

## 6. Final Verification

Before launching:
- Test voting functionality with a test match
- Verify match progression works properly
- Check mobile view of the tournament bracket

## 7. Launch

The tournament will automatically go live on the configured start date. No further action is needed.

## Troubleshooting

- If dates aren't appearing correctly, check the `_mrm_config.php` file
- If matches aren't progressing properly, check the `mrm_matches_flow` table
- For issues with the preview mode, make sure URL parameter `?preview=1` is present

---

Last updated: March 2025