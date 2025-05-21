<?php

namespace YNotRadio\Models\implementations;

use YNotRadio\Models\CdOfTheWeek;

class GraphQLCdOfTheWeek implements CdOfTheWeek {
    private $client;
    
    public function __construct($db) {
        // TODO: Initialize GraphQL client
        // This will be implemented when we add GraphQL support
        throw new \Exception('GraphQL implementation not yet available');
    }
    
    public function getCurrent() {
        // TODO: Implement GraphQL query for current CD
        throw new \Exception('GraphQL implementation not yet available');
    }
    
    public function getById(int $id) {
        // TODO: Implement GraphQL query for CD by ID
        throw new \Exception('GraphQL implementation not yet available');
    }
    
    public function getAll(int $limit = 64) {
        // TODO: Implement GraphQL query for all CDs
        throw new \Exception('GraphQL implementation not yet available');
    }
    
    public function add(array $data) {
        // TODO: Implement GraphQL mutation for adding CD
        throw new \Exception('GraphQL implementation not yet available');
    }
    
    public function update(int $id, array $data) {
        // TODO: Implement GraphQL mutation for updating CD
        throw new \Exception('GraphQL implementation not yet available');
    }
    
    public function delete(int $id) {
        // TODO: Implement GraphQL mutation for deleting CD
        throw new \Exception('GraphQL implementation not yet available');
    }
} 