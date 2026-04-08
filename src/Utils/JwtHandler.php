<?php

namespace App\Utils;

class JwtHandler {
    private string $secret;

    public function __construct() {
        // En producción, esto debe venir de un archivo seguro (.env o configuracion externa)
        $this->secret = getenv('JWT_SECRET') ?: 'cLaV3_s3cR3T4_F0cuSFl0w_A92b8Cd!'; 
    }

    public function generateToken(array $payload): string {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload['iat'] = time();
        $payload['exp'] = time() + (60 * 60 * 24 * 7); // Token válido por 7 días
        $payloadJson = json_encode($payload);

        $base64UrlHeader = $this->base64UrlEncode($header);
        $base64UrlPayload = $this->base64UrlEncode($payloadJson);

        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $this->secret, true);
        $base64UrlSignature = $this->base64UrlEncode($signature);

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    public function validateToken(string $token): ?array {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$base64UrlHeader, $base64UrlPayload, $base64UrlSignature] = $parts;

        // Verificar la firma
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $this->secret, true);
        $expectedSignature = $this->base64UrlEncode($signature);

        if (!hash_equals($expectedSignature, $base64UrlSignature)) {
            return null;
        }

        $payload = json_decode($this->base64UrlDecode($base64UrlPayload), true);
        
        // Verificar expiración
        if (isset($payload['exp']) && time() >= $payload['exp']) {
            return null;
        }

        return $payload;
    }

    private function base64UrlEncode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $data): string {
        $padding = strlen($data) % 4;
        if ($padding !== 0) {
            $data .= str_repeat('=', 4 - $padding);
        }
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
