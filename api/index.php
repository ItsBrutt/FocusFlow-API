<?php

// Redirigir todas las peticiones al index.php original en public
// o simplemente copiar la lógica aquí para Vercel.
// Vercel requiere que las funciones estén en /api para ser detectadas.

require __DIR__ . '/../public/index.php';
