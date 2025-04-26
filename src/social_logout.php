<?php
require 'vendor/autoload.php';
require 'partials/__env_loader.php';
require_once $_SERVER['DOCUMENT_ROOT'] . '/functions/Auth0Service.php';

Auth0Service::getInstance()->logout();
