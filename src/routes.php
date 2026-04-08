<?php

/**
 * Definición de Rutas de la API
 * NOTA: No incluir el prefijo '/api' aquí, el ruteador lo maneja automáticamente
 * según el entorno de despliegue (Vercel, Local, etc.)
 */

use App\Core\Router;
use App\Controllers\AuthController;
use App\Controllers\DashboardController;
use App\Controllers\ObjetivoController;
use App\Controllers\TareaController;
use App\Controllers\PlannerController;
use App\Utils\Response;

$router = new Router();

// Rutas Públicas
$router->get('/', function() {
    Response::json(200, "FocusFlow API - Escuchando Rutas");
});
$router->post('/register', [AuthController::class, 'register']);
$router->post('/login', [AuthController::class, 'login']);

// Rutas Privadas
$router->get('/dashboard', [DashboardController::class, 'getTree'])->middleware('auth');
$router->post('/objetivos', [ObjetivoController::class, 'create'])->middleware('auth');

// Planner
$router->get('/planner/semana', [PlannerController::class, 'semanaActual'])->middleware('auth');

// Objetivos y Meses
$router->get('/objetivos/{id}', [ObjetivoController::class, 'show'])->middleware('auth');
$router->put('/objetivos/{id}/meses/{mes_id}', [ObjetivoController::class, 'renameMonth'])->middleware('auth');

// Semanas
$router->post('/objetivos/{id}/meses/{mes_id}/semanas/{numero_semana}', [ObjetivoController::class, 'initWeek'])->middleware('auth');
$router->put('/objetivos/{id}/semanas/{semana_id}', [ObjetivoController::class, 'renameWeek'])->middleware('auth');

// Tareas
$router->post('/tareas', [TareaController::class, 'create'])->middleware('auth');
$router->put('/tareas/{id}', [TareaController::class, 'update'])->middleware('auth');
$router->patch('/tareas/{id}', [TareaController::class, 'edit'])->middleware('auth');
$router->delete('/tareas/{id}', [TareaController::class, 'delete'])->middleware('auth');

// CRUD Objetivos
$router->put('/objetivos/{id}/editar', [ObjetivoController::class, 'updateObjetivo'])->middleware('auth');
$router->delete('/objetivos/{id}', [ObjetivoController::class, 'deleteObjetivo'])->middleware('auth');

return $router;
