<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\Schedule;
use mysqli;

class SqlSchedule implements Schedule {
    private mysqli $db;

    public function __construct(mysqli $db) {
        $this->db = $db;
    }

    public function getById(int $id): ?array {
        $id = mysqli_real_escape_string($this->db, $id);
        $query = "SELECT * FROM schedule WHERE id = $id";
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \RuntimeException("Error fetching schedule by ID: " . mysqli_error($this->db));
        }

        $data = mysqli_fetch_assoc($result);
        return $data ?: null;
    }

    public function getByDate(string $date): array {
        $date = mysqli_real_escape_string($this->db, $date);
        $query = "SELECT 
                    id, date, start_time, end_time, DATE_FORMAT(date, '%M %d, %Y' ) as fdate, day, host, note, 
                    TIME_FORMAT(start_time, '%l:%i%p' ) as stime, 
                    TIME_FORMAT(start_time, '%l%p' ) as stime_no_min, 
                    TIME_FORMAT(start_time, '%i' ) as start_min, 
                    TIME_FORMAT(end_time, '%l:%i%p' ) as etime, 
                    TIME_FORMAT(end_time, '%l%p' ) as etime_no_min, 
                    TIME_FORMAT(end_time, '%i' ) as end_min 
                  FROM schedule 
                  WHERE date = '$date' AND deleted = 'n' 
                  ORDER BY start_time";
        
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            throw new \RuntimeException("Error fetching schedule by date: " . mysqli_error($this->db));
        }

        $schedules = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $schedules[] = $row;
        }

        return $schedules;
    }

    public function getUpcoming(int $limit = 7): array {
        // Get dates
        $date_query = "SELECT 
                          date, day, DATE_FORMAT(date, '%m/%d/%y') as fdate 
                        FROM schedule 
                        WHERE deleted = 'n' AND date >= date(now()) 
                        GROUP BY date, day 
                        ORDER BY date 
                        LIMIT $limit";
        
        $date_result = mysqli_query($this->db, $date_query);

        if (!$date_result) {
            throw new \RuntimeException("Error fetching upcoming schedule dates: " . mysqli_error($this->db));
        }

        // Get all schedule entries
        $day_query = "SELECT 
                        id, date, start_time, end_time, DATE_FORMAT(date, '%m/%d/%y') as fdate, day, host, note, 
                        start_time, TIME_FORMAT(start_time, '%l:%i%p') as stime, 
                        TIME_FORMAT(start_time, '%l%p') as stime_no_min, 
                        TIME_FORMAT(start_time, '%i') as start_min, 
                        TIME_FORMAT(end_time, '%l:%i%p') as etime, 
                        TIME_FORMAT(end_time, '%l%p') as etime_no_min, 
                        TIME_FORMAT(end_time, '%i') as end_min 
                      FROM schedule 
                      WHERE deleted = 'n' AND date >= date(now()) 
                      ORDER BY date, start_time";
        
        $day_result = mysqli_query($this->db, $day_query);

        if (!$day_result) {
            throw new \RuntimeException("Error fetching upcoming schedule entries: " . mysqli_error($this->db));
        }

        $dates = [];
        while ($date_info = mysqli_fetch_assoc($date_result)) {
            $dates[] = $date_info;
        }

        $all_entries = [];
        while ($day_info = mysqli_fetch_assoc($day_result)) {
            $all_entries[] = $day_info;
        }

        $schedule = [];
        foreach ($dates as $date) {
            $date_entries = [];
            foreach ($all_entries as $entry) {
                if ($entry['date'] == $date['date']) {
                    $date_entries[] = $entry;
                }
            }
            $schedule[] = [
                'date_info' => $date,
                'entries' => $date_entries
            ];
        }

        return $schedule;
    }

    public function getAllForAdmin(): array {
        // Get dates
        $date_query = "SELECT 
                          date, day, DATE_FORMAT(date, '%m/%d/%y') as fdate 
                        FROM schedule 
                        WHERE deleted = 'n' AND date >= date(now()) 
                        GROUP BY date, day 
                        ORDER BY date";
        
        $date_result = mysqli_query($this->db, $date_query);

        if (!$date_result) {
            throw new \RuntimeException("Error fetching all schedule dates: " . mysqli_error($this->db));
        }

        // Get all schedule entries
        $day_query = "SELECT 
                        id, date, start_time, end_time, DATE_FORMAT(date, '%m/%d/%y') as fdate, day, host, note, 
                        start_time, TIME_FORMAT(start_time, '%l:%i%p') as stime, 
                        TIME_FORMAT(start_time, '%l%p') as stime_no_min, 
                        TIME_FORMAT(start_time, '%i') as start_min, 
                        TIME_FORMAT(end_time, '%l:%i%p') as etime, 
                        TIME_FORMAT(end_time, '%l%p') as etime_no_min, 
                        TIME_FORMAT(end_time, '%i') as end_min 
                      FROM schedule 
                      WHERE deleted = 'n' AND date >= date(now()) 
                      ORDER BY date, start_time";
        
        $day_result = mysqli_query($this->db, $day_query);

        if (!$day_result) {
            throw new \RuntimeException("Error fetching all schedule entries: " . mysqli_error($this->db));
        }

        $dates = [];
        while ($date_info = mysqli_fetch_assoc($date_result)) {
            $dates[] = $date_info;
        }

        $all_entries = [];
        while ($day_info = mysqli_fetch_assoc($day_result)) {
            $all_entries[] = $day_info;
        }

        $schedule = [];
        foreach ($dates as $date) {
            $date_entries = [];
            foreach ($all_entries as $entry) {
                if ($entry['date'] == $date['date']) {
                    $date_entries[] = $entry;
                }
            }
            $schedule[] = [
                'date_info' => $date,
                'entries' => $date_entries
            ];
        }

        return $schedule;
    }

    public function add(array $data): int {
        $host = mysqli_real_escape_string($this->db, $data['host']);
        $date = mysqli_real_escape_string($this->db, $data['date']);
        $start_time = mysqli_real_escape_string($this->db, $data['start_time']);
        $end_time = mysqli_real_escape_string($this->db, $data['end_time']);
        $note = mysqli_real_escape_string($this->db, $data['note'] ?? '');

        if (($timestamp = strtotime($date)) === false) {
            throw new \InvalidArgumentException("Invalid date format: $date");
        }

        $day_insert = date("l", $timestamp);
        $insert = "INSERT INTO schedule VALUES (id, '$date', '$day_insert', '$start_time', '$end_time', '$host', '$note', 'n')";
        
        $result = mysqli_query($this->db, $insert);

        if (!$result) {
            throw new \RuntimeException("Error adding schedule: " . mysqli_error($this->db));
        }

        return mysqli_insert_id($this->db);
    }

    public function update(int $id, array $data): bool {
        $id = mysqli_real_escape_string($this->db, $id);
        $host = mysqli_real_escape_string($this->db, $data['host']);
        $date = mysqli_real_escape_string($this->db, $data['date']);
        $start_time = mysqli_real_escape_string($this->db, $data['start_time']);
        $end_time = mysqli_real_escape_string($this->db, $data['end_time']);
        $note = mysqli_real_escape_string($this->db, $data['note'] ?? '');

        if (($timestamp = strtotime($date)) === false) {
            throw new \InvalidArgumentException("Invalid date format: $date");
        }

        $day_insert = date("l", $timestamp);
        $update = "UPDATE schedule 
                   SET date='$date', day='$day_insert', start_time='$start_time', 
                       end_time='$end_time', host='$host', note='$note' 
                   WHERE id=$id";
        
        $result = mysqli_query($this->db, $update);

        if (!$result) {
            throw new \RuntimeException("Error updating schedule: " . mysqli_error($this->db));
        }

        return true;
    }

    public function delete(int $id): bool {
        $id = mysqli_real_escape_string($this->db, $id);
        $update = "UPDATE schedule SET deleted ='y' WHERE id=$id";
        
        $result = mysqli_query($this->db, $update);

        if (!$result) {
            throw new \RuntimeException("Error deleting schedule: " . mysqli_error($this->db));
        }

        return true;
    }

    public function copyDay(string $sourceDate, string $targetDate): bool {
        $sourceDate = mysqli_real_escape_string($this->db, $sourceDate);
        $targetDate = mysqli_real_escape_string($this->db, $targetDate);
        
        // Get the day name for the target date
        if (($timestamp = strtotime($targetDate)) === false) {
            throw new \InvalidArgumentException("Invalid target date format: $targetDate");
        }
        
        $targetDay = date("l", $timestamp);
        
        // First, get all entries from source date
        $query = "SELECT host, start_time, end_time, note 
                  FROM schedule 
                  WHERE date = '$sourceDate' AND deleted = 'n'";
        
        $result = mysqli_query($this->db, $query);
        
        if (!$result) {
            throw new \RuntimeException("Error fetching source date schedule: " . mysqli_error($this->db));
        }
        
        // Insert each entry for the target date
        $success = true;
        while ($row = mysqli_fetch_assoc($result)) {
            $host = mysqli_real_escape_string($this->db, $row['host']);
            $start_time = mysqli_real_escape_string($this->db, $row['start_time']);
            $end_time = mysqli_real_escape_string($this->db, $row['end_time']);
            $note = mysqli_real_escape_string($this->db, $row['note']);
            
            $insert = "INSERT INTO schedule VALUES (id, '$targetDate', '$targetDay', '$start_time', '$end_time', '$host', '$note', 'n')";
            $insert_result = mysqli_query($this->db, $insert);
            
            if (!$insert_result) {
                $success = false;
                throw new \RuntimeException("Error copying schedule entry: " . mysqli_error($this->db));
            }
        }
        
        return $success;
    }
}
