<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\CustomText;

/**
 * SQL implementation of the CustomText interface
 */
class SqlCustomText implements CustomText
{
    /**
     * @var mixed Database connection
     */
    private $db;

    /**
     * Constructor
     *
     * @param mixed $db Database connection
     */
    public function __construct($db)
    {
        $this->db = $db;
    }

    /**
     * {@inheritdoc}
     */
    public function getAll(): array
    {
        $query = "SELECT * FROM custom_texts WHERE status = 'active'";
        $result = mysqli_query($this->db, $query);

        if (!$result) {
            return [];
        }

        $customTexts = [];
        while ($row = mysqli_fetch_assoc($result)) {
            $customTexts[] = $row;
        }

        return $customTexts;
    }

    /**
     * {@inheritdoc}
     */
    public function getById(int $id): ?array
    {
        $query = "SELECT * FROM custom_texts WHERE status = 'active' AND id = " . $id;
        $result = mysqli_query($this->db, $query);

        if (!$result || mysqli_num_rows($result) === 0) {
            return null;
        }

        return mysqli_fetch_assoc($result);
    }

    /**
     * {@inheritdoc}
     */
    public function findByPermalink(string $permalink): ?array
    {
        $safePermalink = mysqli_real_escape_string($this->db, $permalink);
        $query = "SELECT * FROM custom_texts WHERE status = 'active' AND permalink = '" . $safePermalink . "'";
        $result = mysqli_query($this->db, $query);

        if (!$result || mysqli_num_rows($result) === 0) {
            return null;
        }

        return mysqli_fetch_assoc($result);
    }

    /**
     * {@inheritdoc}
     */
    public function add(array $data): int
    {
        if (!isset($data['title']) || !isset($data['html'])) {
            throw new \InvalidArgumentException("Title and HTML content are required");
        }

        $title = mysqli_real_escape_string($this->db, $data['title']);
        $html = mysqli_real_escape_string($this->db, $data['html']);
        $permalink = $this->createPermalink($title);

        $insert = "INSERT INTO custom_texts VALUES (id, '{$title}', '{$permalink}', '{$html}', 'active')";
        $result = mysqli_query($this->db, $insert);

        if (!$result) {
            throw new \RuntimeException("Error inserting custom text: " . mysqli_error($this->db));
        }

        return mysqli_insert_id($this->db);
    }

    /**
     * {@inheritdoc}
     */
    public function update(int $id, array $data): bool
    {
        if (!isset($data['title']) || !isset($data['html'])) {
            throw new \InvalidArgumentException("Title and HTML content are required");
        }

        $title = mysqli_real_escape_string($this->db, $data['title']);
        $html = mysqli_real_escape_string($this->db, $data['html']);

        $update = "UPDATE custom_texts SET title='{$title}', html='{$html}' WHERE id={$id}";
        $result = mysqli_query($this->db, $update);

        return $result !== false;
    }

    /**
     * {@inheritdoc}
     */
    public function delete(int $id): bool
    {
        $update = "UPDATE custom_texts SET status ='deleted' WHERE id=" . $id;
        $result = mysqli_query($this->db, $update);

        return $result !== false;
    }

    /**
     * {@inheritdoc}
     */
    public function isValidPermalink(string $permalink): bool
    {
        $safePermalink = mysqli_real_escape_string($this->db, $permalink);
        $count = "SELECT count('permalink') AS 'permalink' FROM custom_texts WHERE permalink ='{$safePermalink}'";
        $result = mysqli_query($this->db, $count);

        if (!$result) {
            return false;
        }

        $info = mysqli_fetch_assoc($result);
        return $info['permalink'] == '0';
    }

    /**
     * {@inheritdoc}
     */
    public function createPermalink(string $title): string
    {
        $permalink = strtolower($title);
        $permalink = str_replace(' ', '-', $permalink);

        if (!$this->isValidPermalink($permalink)) {
            $count = 0;
            do {
                $count = $count + 1;
                $temp_permalink = $permalink . '-' . $count;
            } while (!$this->isValidPermalink($temp_permalink));

            $permalink = $temp_permalink;
        }
        
        return $permalink;
    }
}
