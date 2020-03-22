<?php
/*
 * To run the migration:
 * 1. Login as an administrator
 * 2. Go to yourdomain.com/?migrate=1&version=[tag]
 */

class Migration
{
	private $version;

	public function __construct() {
		if ($this->canMigrate()) {
			add_action('template_redirect', array($this, 'migrate'));
		}
	}

	public function migrate() {
		try {
			$this->runMigrationScript();
			$this->completeProcess();
		} catch (Exception $e) {
			$this->abortProcess($e->getMessage());
		}
	}

	private function canMigrate() {
		try {
			$this->validateRequestParams();
			$this->validateHost();
			$this->authorizeUser();
			return true;
		} catch (Exception $e) {
			return false;
		}
	}

	private function validateRequestParams() {
		if (empty($_REQUEST['migrate'])) {
			throw new Exception('Invalid request parameters.');
		}
	}

	private function validateHost() {
		$host_name = $_SERVER['SERVER_NAME'];
		$invalid_hosts = [
			'ynotradio.net',
			'www.ynotradio.net'
		];
		if (in_array($host_name, $invalid_hosts)) {
			throw new Exception('Invalid host.');
		}
	}

	private function authorizeUser() {
		if (!current_user_can('install_themes')) {
			throw new Exception('Unauthorized.');
		}
	}

	private function runMigrationScript() {
		$this->version = $this->getMigrationVersionFromRequest();
		$file = $this->getMigrationFile($this->version);
		include_once $file;
	}

	private function getMigrationVersionFromRequest() {
		if (empty($_REQUEST['version'])) {
			throw new Exception('No version specified.');
		}
		$version = $_REQUEST['version'];
		$this->validateSemanticVersion($version);
		return $version;
	}

	private function validateSemanticVersion($version) {
		if (!preg_match('/^\d+\.\d+\.\d+$/', $version)) {
			throw new Exception('Invalid version number format.');
		}
	}

	private function getMigrationFile($version) {
		$filename = sprintf('migration-%s.php', $version);
		$filepath = __DIR__ . DIRECTORY_SEPARATOR . $filename;
		if (!file_exists($filepath)) {
			throw new Exception('Migration file does not exist!');
		}
		return $filepath;
	}

	private function completeProcess() {
		echo sprintf('Migration to %s complete!', $this->version);
		exit;
	}

	private	function abortProcess($reason) {
		echo 'Migration failed: ' . $reason;
		exit;
	}

}

new Migration();