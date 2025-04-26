<?php

class Auth0Service {
    private static $instance = null;
    private $auth0;
    private $configuration;

    private function __construct() {
        $uri = $_SERVER["HTTP_HOST"];
        $protocol = isset($_SERVER["HTTPS"]) ? 'https' : 'http';

        $this->configuration = new Auth0\SDK\Configuration\SdkConfiguration([
            'strategy' => 'webapp',
            'domain' => $_ENV['AUTH0_DOMAIN'],
            'clientId' => $_ENV['AUTH0_CLIENT_ID'],
            'clientSecret' => $_ENV['AUTH0_CLIENT_SECRET'],
            'redirectUri' => $protocol . "://" . $uri,
            'scope' => ['openid', 'profile', 'email'],
            'cookieSecret' => $_ENV['AUTH0_CLIENT_SECRET'],
            'cookieSecure' => false,
            'cookieDomain' => $uri
        ]);
        
        $this->auth0 = new Auth0\SDK\Auth0($this->configuration);
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getAuth0() {
        return $this->auth0;
    }

    public function getUser() {
        try {
            return $this->auth0->getUser();
        } catch (\Exception $e) {
            error_log('Auth0 getUser error: ' . $e->getMessage());
            return null;
        }
    }

    public function login($redirectPath = '') {
        try {
            $uri = $_SERVER["HTTP_HOST"];
            $protocol = isset($_SERVER["HTTPS"]) ? 'https' : 'http';
            
            if ($redirectPath) {
                $this->configuration->setRedirectUri($protocol . "://" . $uri . $redirectPath);
                $this->auth0 = new Auth0\SDK\Auth0($this->configuration);
            }
            
            $this->auth0->login();
        } catch (\Exception $e) {
            error_log('Auth0 login error: ' . $e->getMessage());
        }
    }

    public function logout() {
        try {
            $this->auth0->logout();
            $uri = $_SERVER["HTTP_HOST"];
            $protocol = isset($_SERVER["HTTPS"]) ? 'https' : 'http';
            $return_to = $protocol . '://' . $uri;
            $logout_url = sprintf('https://%s/v2/logout?client_id=%s&returnTo=%s', 
                $_ENV['AUTH0_DOMAIN'], 
                $_ENV['AUTH0_CLIENT_ID'], 
                $return_to
            );
            header('Location: ' . $logout_url);
        } catch (\Exception $e) {
            error_log('Auth0 logout error: ' . $e->getMessage());
        }
    }
}