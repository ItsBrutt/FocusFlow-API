<?php

namespace App\Controllers;

use App\Utils\AuthMiddleware;
use App\Utils\Response;
use App\Config\Database;
use PDO;

class PlannerController {

    /**
     * GET /api/planner/semana
     * 
     * Retorna todos los días de la semana actual del usuario, 
     * agrupando las tareas de TODOS los objetivos activos por día y bloque horario.
     * "Activo" = tiene un Planner_Semanal cuya fecha_inicio..fecha_fin 
     * solapa con la semana calendario actual (Lun-Vie).
     */
    public function semanaActual() {
        $payload = AuthMiddleware::getPayload();
        $usuario_id = $payload['id'];

        $db = Database::getInstance()->getConnection();

        // Determinar el Lunes y Viernes de la semana a mostrar
        // Si hoy es fin de semana (Sábado o Domingo), saltamos a la próxima semana 
        // para que el usuario vea lo que acaba de planificar.
        $hoy = date('Y-m-d');
        $diaSemana = (int)date('N', strtotime($hoy)); // 1=Lun, 7=Dom
        
        $lunes = ($diaSemana >= 6) 
            ? date('Y-m-d', strtotime('next monday', strtotime('yesterday')))
            : date('Y-m-d', strtotime($hoy . ' -' . ($diaSemana - 1) . ' days'));
        
        $viernes = date('Y-m-d', strtotime($lunes . ' +4 days'));

        $query = "
            SELECT 
                d.id        AS d_id,
                d.nombre_dia,
                d.fecha_exacta,
                d.bloqueado,
                t.id        AS t_id,
                t.descripcion,
                t.estado,
                t.categoria,
                t.bloque_horario,
                t.hora_inicio,
                t.duracion_minutos,
                t.prioridad_orden,
                ps.id       AS ps_id,
                ps.numero_semana,
                ps.completada AS ps_completada,
                ps.titulo   AS ps_titulo,
                om.id       AS om_id,
                om.mes,
                om.titulo   AS om_titulo,
                om.progreso_total AS om_progreso,
                oa.id       AS oa_id,
                oa.titulo   AS oa_titulo,
                oa.color    AS oa_color,
                oa.anio,
                (
                    SELECT COALESCE(AVG(om2.progreso_total), 0)
                    FROM Objetivos_Mensuales om2
                    WHERE om2.objetivo_anual_id = oa.id
                ) AS oa_progreso
            FROM Planner_Semanal ps
            JOIN Objetivos_Mensuales om ON ps.objetivo_mensual_id = om.id
            JOIN Objetivos_Anuales   oa ON om.objetivo_anual_id   = oa.id
            JOIN Dias d ON d.planner_semanal_id = ps.id
            LEFT JOIN Tareas t ON t.dia_id = d.id
            WHERE oa.usuario_id = :uid
              AND d.fecha_exacta BETWEEN :lunes AND :viernes
            ORDER BY d.fecha_exacta ASC, oa.id ASC, 
                     CASE t.bloque_horario
                         WHEN 'Madrugada' THEN 1
                         WHEN 'Mañana'    THEN 2
                         WHEN 'Tarde'     THEN 3
                         WHEN 'Noche'     THEN 4
                         ELSE 5
                     END,
                     t.prioridad_orden ASC
        ";

        $stmt = $db->prepare($query);
        $stmt->execute([':uid' => $usuario_id, ':lunes' => $lunes, ':viernes' => $viernes]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Construir estructura: dias → objetivos_activos → bloques → tareas
        $diasOrdenados = ['Lunes','Martes','Miércoles','Jueves','Viernes'];
        $bloquesOrdenados = ['Madrugada','Mañana','Tarde','Noche'];

        // Inicializar estructura base de la semana
        $semana = [];
        $fechaActual = $lunes;
        foreach ($diasOrdenados as $nombre) {
            $semana[$fechaActual] = [
                'nombre_dia'  => $nombre,
                'fecha_exacta'=> $fechaActual,
                'is_today'    => ($fechaActual === $hoy),
                'objetivos'   => []
            ];
            $fechaActual = date('Y-m-d', strtotime($fechaActual . ' +1 day'));
        }

        // Poblar con datos reales
        foreach ($rows as $row) {
            $fecha  = $row['fecha_exacta'];
            $oa_id  = $row['oa_id'];
            $bloque = $row['bloque_horario'] ?? 'Mañana';

            if (!isset($semana[$fecha])) continue;

            // Inicializar objetivo dentro del día si no existe
            if (!isset($semana[$fecha]['objetivos'][$oa_id])) {
                $semana[$fecha]['objetivos'][$oa_id] = [
                    'oa_id'        => $oa_id,
                    'titulo'       => $row['oa_titulo'],
                    'color'        => $row['oa_color'] ?? '#0d6efd',
                    'anio'         => $row['anio'],
                    'mes_titulo'   => $row['om_titulo'],
                    'semana_titulo'=> $row['ps_titulo'],
                    'semana_id'    => $row['ps_id'],
                    'dia_id'       => $row['d_id'],
                    'bloqueado'    => (bool)$row['bloqueado'],
                    'om_progreso'  => (float)$row['om_progreso'],
                    'oa_progreso'  => (float)$row['oa_progreso'],
                    'bloques'      => array_fill_keys($bloquesOrdenados, [])
                ];
            }

            // Añadir tarea si existe
            if ($row['t_id'] !== null) {
                $semana[$fecha]['objetivos'][$oa_id]['bloques'][$bloque][] = [
                    'id'          => (int)$row['t_id'],
                    'descripcion' => $row['descripcion'],
                    'estado'      => $row['estado'],
                    'categoria'   => $row['categoria'],
                    'bloque_horario' => $bloque,
                    'hora_inicio' => $row['hora_inicio'],
                    'duracion_minutos' => (int)$row['duracion_minutos'],
                    'prioridad_orden' => (int)$row['prioridad_orden'],
                ];
            }
        }

        // Reindexar objetivos como array (no objeto con claves numéricas)
        foreach ($semana as &$dia) {
            $dia['objetivos'] = array_values($dia['objetivos']);
        }

        Response::json(200, "Planner semanal cargado.", [
            'semana'  => array_values($semana),
            'lunes'   => $lunes,
            'viernes' => $viernes,
        ]);
    }
}
