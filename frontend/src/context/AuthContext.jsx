import { createContext, useState, useEffect } from 'react';
import api from '../api/axiosConfig';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Al arrancar o recargar, verificamos si ya había una sesion en curso
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('/login', { email, password });
            if (response.data.success) {
                const { token, user: userData } = response.data.data;
                // Guardamos en el navegador
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(userData));
                // Guardamos en la memoria global de React
                setUser(userData);
                return { success: true };
            }
        } catch (error) {
            // El backend PHP devuelve 401 si falla y response captura el mensaje
            return { 
                success: false, 
                message: error.response?.data?.message || "Error al conectar con la API" 
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
