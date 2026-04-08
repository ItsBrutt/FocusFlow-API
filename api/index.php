<?php

// Punto de Entrada para Vercel Serverless (PostgreSQL / Supabase)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: OPTIONS,GET,POST,PUT,DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Cargar variables de entorno solo si no están definidas en el servidor
$env_file = __DIR__ . '/../.env';
if (file_exists($env_file)) {
    $lines = file($env_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        if (getenv($name) === false) {
            putenv($name . '=' . trim($value));
        }
    }
}

// Autoload manual para evitar fallos de rutas en ambiente serverless
spl_autoload_register(function ($class_name) {
    if (strpos($class_name, 'App\\') === 0) {
        $relative_class = substr($class_name, 4);
        $file = __DIR__ . '/../src/' . str_replace('\\', '/', $relative_class) . '.php';
        if (file_exists($file)) {
            require $file;
        }
    }
});

\App\Utils\ErrorHandler::register();

// Capturar URI y Método
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Cargar el Router y procesar
$router = require __DIR__ . '/../src/routes.php';
$router->dispatch($uri, $method);
