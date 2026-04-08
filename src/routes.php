<?php

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
$router->post('/api/register', [AuthController::class, 'register']);
$router->post('/api/login', [AuthController::class, 'login']);

// Rutas Privadas Protegidas por Middleware
$router->get('/api/dashboard', [DashboardController::class, 'getTree'])->middleware('auth');
$router->post('/api/objetivos', [ObjetivoController::class, 'create'])->middleware('auth');

// Planner Semanal Unificado
$router->get('/api/planner/semana', [PlannerController::class, 'semanaActual'])->middleware('auth');

// Nivel 2: Objetivo Singular y Meses
$router->get('/api/objetivos/{id}', [ObjetivoController::class, 'show'])->middleware('auth');
$router->put('/api/objetivos/{id}/meses/{mes_id}', [ObjetivoController::class, 'renameMonth'])->middleware('auth');

// Nivel 3: Árbol de Habilidades — Iniciación Intencional de Semanas
$router->post('/api/objetivos/{id}/meses/{mes_id}/semanas/{numero_semana}', [ObjetivoController::class, 'initWeek'])->middleware('auth');
$router->put('/api/objetivos/{id}/semanas/{semana_id}', [ObjetivoController::class, 'renameWeek'])->middleware('auth');

// Tareas - CRUD Completo
$router->post('/api/tareas', [TareaController::class, 'create'])->middleware('auth');
$router->put('/api/tareas/{id}', [TareaController::class, 'update'])->middleware('auth');      // Cambiar estado
$router->patch('/api/tareas/{id}', [TareaController::class, 'edit'])->middleware('auth');      // Editar descripcion/categoria
$router->delete('/api/tareas/{id}', [TareaController::class, 'delete'])->middleware('auth');

// Objetivos Anuales - CRUD Completo
$router->put('/api/objetivos/{id}/editar', [ObjetivoController::class, 'updateObjetivo'])->middleware('auth');
$router->delete('/api/objetivos/{id}', [ObjetivoController::class, 'deleteObjetivo'])->middleware('auth');

return $router;
