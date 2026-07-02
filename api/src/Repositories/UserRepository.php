<?php

declare(strict_types=1);

namespace LoupSauvage\Repositories;

use PDO;

final class UserRepository
{
    public function __construct(private readonly PDO $db)
    {
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findActiveOwnerByEmail(string $email): ?array
    {
        $statement = $this->db->prepare('
            SELECT id, username, email, password_hash
            FROM users
            WHERE email = :email
            LIMIT 1
        ');
        $statement->execute(['email' => $email]);

        $user = $statement->fetch();

        return is_array($user) ? $user : null;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findOwnerById(int $id): ?array
    {
        $statement = $this->db->prepare('
            SELECT id, username, email, last_login_at, created_at, updated_at
            FROM users
            WHERE id = :id
            LIMIT 1
        ');
        $statement->execute(['id' => $id]);

        $user = $statement->fetch();

        return is_array($user) ? $this->publicUser($user) : null;
    }

    public function updateLastLogin(int $id): void
    {
        $statement = $this->db->prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = :id');
        $statement->execute(['id' => $id]);
    }

    public function upsertOwner(string $username, string $email, string $passwordHash): void
    {
        $statement = $this->db->prepare('
            INSERT INTO users (username, email, password_hash)
            VALUES (:username, :email, :password_hash)
            ON DUPLICATE KEY UPDATE
                username = VALUES(username),
                password_hash = VALUES(password_hash)
        ');

        $statement->execute([
            'username' => $username,
            'email' => $email,
            'password_hash' => $passwordHash,
        ]);
    }

    /**
     * @param array<string, mixed> $user
     * @return array<string, mixed>
     */
    public function publicUser(array $user): array
    {
        return [
            'id' => (int) $user['id'],
            'username' => (string) $user['username'],
            'email' => (string) $user['email'],
            'role' => 'owner',
        ];
    }
}
