import axios from 'axios';

// Crear una instancia de Axios centralizada
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor de peticiones: Se ejecuta ANTES de que cualquier peticion salga del cliente
api.interceptors.request.use(
    (config) => {
        // Obtenemos el token desde localStorage
        const token = localStorage.getItem('token');
        
        // Si existe el token, lo inyectamos obligatoriamente en los Headers
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
