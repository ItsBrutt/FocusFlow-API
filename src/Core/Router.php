<?php

namespace App\Core;

use App\Utils\Response;
use App\Utils\AuthMiddleware;

class Router {
    private array $routes = [];

    private function add(string $method, string $path, $action): self {
        // Transformar params dinámicos como {id} a regex
        $pathRegex = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '([a-zA-Z0-9_]+)', $path);
        // Escapar barras
        $pathRegex = str_replace('/', '\/', $pathRegex);

        $this->routes[] = [
            'method' => $method,
            'path' => $path,
            'regex' => '/^' . $pathRegex . '$/',
            'action' => $action,
            'middleware' => null
        ];
        return $this;
    }

    public function get(string $path, $action): self {
        return $this->add('GET', $path, $action);
    }

    public function post(string $path, $action): self {
        return $this->add('POST', $path, $action);
    }

    public function put(string $path, $action): self {
        return $this->add('PUT', $path, $action);
    }

    public function delete(string $path, $action): self {
        return $this->add('DELETE', $path, $action);
    }

    public function patch(string $path, $action): self {
        return $this->add('PATCH', $path, $action);
    }

    public function middleware(string $name): self {
        $last = array_key_last($this->routes);
        if ($last !== null) {
            $this->routes[$last]['middleware'] = $name;
        }
        return $this;
    }

    public function dispatch(string $uri, string $method) {
        // En algunas configuraciones existe un subdirectorio global que estorba
        $base_path = str_replace('/index.php', '', $_SERVER['SCRIPT_NAME']);
        if (strpos($uri, $base_path) === 0) {
            $uri = substr($uri, strlen($base_path));
        }

        foreach ($this->routes as $route) {
            if ($route['method'] === $method && preg_match($route['regex'], $uri, $matches)) {
                
                // Extraer variables que machean con regex ({id})
                array_shift($matches); // Quitar la URL entera del indice 0
                
                // Validar Middleware
                if ($route['middleware'] === 'auth') {
                    AuthMiddleware::validateToken();
                }

                $action = $route['action'];

                // Ejecutar logica si es Closure
                if (is_callable($action)) {
                    call_user_func_array($action, $matches);
                    return;
                }

                // Ejecutar logica si es Array [Clase, Método]
                if (is_array($action)) {
                    $class = $action[0];
                    $function = $action[1];
    
                    $controller = new $class();
                    call_user_func_array([$controller, $function], $matches);
                    return;
                }
            }
        }

        // Si iteró todo sin hacer return, disparar 404
        Response::json(404, "Ruta no encontrada (Router)", ["path" => $uri]);
    }
}
