import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);

    // Evitamos un flasheo de página mientras se lee el localStorage
    if (loading) {
        return <div className="text-center mt-5"><div className="spinner-border" role="status"></div></div>;
    }

    // Si no hay usuario ni token, bloquear entrada y redirigir
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Si está autenticado, renderizar la vista protegida (el hijo)
    return children;
};

export default ProtectedRoute;
