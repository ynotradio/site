<?php

namespace YNotRadio\Models\Implementations;

use YNotRadio\Models\CdOfTheWeek;

class GraphQLCdOfTheWeek implements CdOfTheWeek {
    private $client;
    
    public function __construct($db) {
        // TODO: Initialize GraphQL client
        // This will be implemented when we add GraphQL support
        throw new \Exception('GraphQL implementation not yet available');
    }
    
    public function getCurrent(): ?array {
        // TODO: Implement GraphQL query for current CD
        throw new \Exception('GraphQL implementation not yet available');
    }
    
    public function getById(int $id): ?array {
        // TODO: Implement GraphQL query for CD by ID
        throw new \Exception('GraphQL implementation not yet available');
    }
    
    public function getAll(int $limit = 64): array {
        // TODO: Implement GraphQL query for all CDs
        throw new \Exception('GraphQL implementation not yet available');
    }
    
    public function add(array $data): int {
        // TODO: Implement GraphQL mutation for adding CD
        throw new \Exception('GraphQL implementation not yet available');
    }
    
    public function update(int $id, array $data): bool {
        // TODO: Implement GraphQL mutation for updating CD
        throw new \Exception('GraphQL implementation not yet available');
    }
    
    public function delete(int $id): bool {
        // TODO: Implement GraphQL mutation for deleting CD
        throw new \Exception('GraphQL implementation not yet available');
    }
} 