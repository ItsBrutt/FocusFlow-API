<?php

namespace App\Controllers;

use App\Models\Usuario;
use App\Utils\JwtHandler;
use App\Utils\Validator;
use App\Utils\Response;

class AuthController {
    
    /**
     * Maneja la ruta /register
     */
    public function register() {
         $data = json_decode(file_get_contents("php://input"));
         
         $validator = new Validator($data);
         $validator->require(['nombre', 'email', 'password'])
                   ->validateEmail('email')
                   ->validateMinLength('password', 6);

         if ($validator->fails()) {
             Response::json(400, "Errores de validacion.", $validator->getErrors());
         }

         $usuario = new Usuario();
         $cleanData = $validator->getRawData();

         if ($usuario->emailExists($cleanData['email'])) {
             Response::json(400, "El correo electronico ya esta registrado.");
         }

         $usuario->nombre = $validator->sanitizeString('nombre');
         $usuario->email = $cleanData['email'];
         $usuario->password_hash = password_hash($cleanData['password'], PASSWORD_BCRYPT);

         if ($usuario->create()) {
             Response::json(201, "Usuario registrado exitosamente.");
         } else {
             Response::json(500, "No se pudo registrar el usuario. Intentelo de nuevo.");
         }
    }

    /**
     * Maneja la ruta /login
     */
    public function login() {
        $data = json_decode(file_get_contents("php://input"));

        $validator = new Validator($data);
        $validator->require(['email', 'password']);

        if ($validator->fails()) {
            Response::json(400, "Errores de validacion.", $validator->getErrors());
        }

        $cleanData = $validator->getRawData();
        $usuarioObj = new Usuario();
        $user_data = $usuarioObj->getByEmail($cleanData['email']);

        if ($user_data && password_verify($cleanData['password'], $user_data['password_hash'])) {
            $jwtHandler = new JwtHandler();
            
            $token = $jwtHandler->generateToken([
                'id' => $user_data['id'],
                'email' => $user_data['email']
            ]);

            Response::json(200, "Login exitoso.", [
                "token" => $token,
                "user" => [
                    "id" => $user_data['id'],
                    "nombre" => $user_data['nombre'],
                    "email" => $user_data['email']
                ]
            ]);
        } else {
            Response::json(401, "Credenciales incorrectas.");
        }
    }
}
