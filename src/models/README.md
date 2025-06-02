# Y-Not Radio Models

This directory contains the Model layer classes for the Y-Not Radio site.

## Model Migration

We are gradually migrating functionality from the legacy `/functions` directory to this model-based approach. 

### Completed Migrations:
- CdOfTheWeek (cdotw_fns.php → models/CdOfTheWeek.php)
- Ad (ad_fns.php → models/Ad.php)
- Concert (concert_fns.php → models/Concert.php)
- Deejay (deejay_fns.php → models/Deejay.php) - **FULLY MIGRATED**: All code now uses the Deejay model directly and deejay_fns.php has been removed. Redundant files were also eliminated.
- Custom Text (custom_text_fns.php → models/CustomText.php) - **FULLY MIGRATED**: All code now uses the CustomText model directly and custom_text_fns.php has been removed.
- Story (story_fns.php → models/Story.php) - **FULLY MIGRATED**: All code now uses the Story model directly and story_fns.php has been removed.

### Planned Migrations:
#### Next in Queue:
- New Music (music_fns.php → models/Music.php) - Frequently used feature
- On Demand (on_demand_fns.php → models/OnDemand.php) - Important site content
- Schedule (schedule_fns.php → models/Schedule.php) - Core site functionality

#### Final Migrations (Complex):
- Top 11 @ 11 (top11_fns.php → models/Top11.php) - Involves voting system
- Year End Staff Picks (year_end_staff_pick_fns.php → models/YearEndStaffPick.php) - Annual content
- Modern Rock Madness (mrm_fns.php → models/ModernRockMadness.php) - Complex tournament system
- Year End Poll (year_end_poll_fns.php → models/YearEndPoll.php) - Complex voting system

### Will Not Be Migrated:
- Images (image_fns.php) - Decision made on June 2, 2025

### Benefits of the Model Approach:
1. **Clear Interface**: Each model has a defined interface that makes it clear what operations are available
2. **Separation of Concerns**: Models handle data access logic, separate from presentation
3. **Type Safety**: PHP type hints ensure functions receive and return the expected types
4. **Error Handling**: Consistent error handling with exceptions
5. **Testability**: Models can be more easily tested in isolation
6. **Factory Pattern**: Allows for different implementations (SQL, GraphQL, etc.)

## Usage Example

```php
// Get an instance of the model
require_once ("models/DeejayFactory.php");
$db = open_db();
$deejayModel = \YNotRadio\Models\DeejayFactory::create($db);

// Use the model
$deejays = $deejayModel->getAll();
$specificDeejay = $deejayModel->getById(1);

// Create a new entry
$data = [
  'name' => 'New Deejay',
  'show' => 'Morning Show',
  'email' => 'deejay@example.com',
  // ... other fields
];
$newId = $deejayModel->add($data);

// Update an existing entry
$deejayModel->update($id, $data);

// Delete an entry
$deejayModel->delete($id);
```
