<?php

namespace App\Utils;

class Validator {
    private array $errors = [];
    private $data;

    public function __construct($data) {
        // En caso de que recibamos un JSON object (stdClass) o Array
        $this->data = is_object($data) ? (array)$data : (is_array($data) ? $data : []);
    }

    /**
     * Revisa que las claves pedidas existan y no esten vacías.
     */
    public function require(array $keys): self {
        foreach ($keys as $key) {
            if (!isset($this->data[$key]) || (is_string($this->data[$key]) && trim($this->data[$key]) === '')) {
                $this->addError($key, "El campo es obligatorio y no puede estar vacio.");
            }
        }
        return $this;
    }

    public function sanitizeString(string $key): ?string {
        if (!isset($this->data[$key])) return null;
        return htmlspecialchars(strip_tags((string)$this->data[$key]));
    }

    public function validateEmail(string $key): self {
        if (isset($this->data[$key])) {
            $email = filter_var($this->data[$key], FILTER_SANITIZE_EMAIL);
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $this->addError($key, "El formato del correo electronico no es valido.");
            }
        }
        return $this;
    }

    public function validateMinLength(string $key, int $min): self {
        if (isset($this->data[$key])) {
            if (strlen((string)$this->data[$key]) < $min) {
                $this->addError($key, "Debe tener al menos {$min} caracteres.");
            }
        }
        return $this;
    }

    /**
     * Valida pertenencia a un grupo determinado (Ej: Enum de Base de Datos)
     */
    public function validateEnum(string $key, array $allowed): self {
        if (isset($this->data[$key])) {
            if (!in_array($this->data[$key], $allowed)) {
                $this->addError($key, "Opcion invalida. Permitidos: " . implode(", ", $allowed));
            }
        }
        return $this;
    }

    private function addError(string $field, string $message) {
        if (!isset($this->errors[$field])) {
            $this->errors[$field] = [];
        }
        $this->errors[$field][] = $message;
    }

    public function fails(): bool {
        return count($this->errors) > 0;
    }

    public function getErrors(): array {
        return $this->errors;
    }

    public function getRawData(): array {
        return $this->data;
    }
}
