<?php

namespace App\Controllers;

use App\Utils\AuthMiddleware;
use App\Models\Dashboard;

class DashboardController {
    
    /**
     * Retorna el arbol completo de datos para el frontend.
     */
    public function getTree() {
        $payload = AuthMiddleware::getPayload();
        $usuario_id = $payload['id'];

        $dashboardModel = new Dashboard();
        $data = $dashboardModel->getUserDashboardTree($usuario_id);

        \App\Utils\Response::json(200, "Dashboard recuperado con exito.", $data);
    }
}
