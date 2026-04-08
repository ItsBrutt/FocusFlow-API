import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import ObjetivoCard from '../components/ObjetivoCard';
import CrearObjetivoModal from '../components/CrearObjetivoModal';

const Dashboard = () => {
    const [treeData, setTreeData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const response = await api.get('/api/dashboard');
            if (response.data.success) {
                setTreeData(response.data.data);
            }
        } catch (err) {
            setError("No se pudo cargar la información del dashboard.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleObjetivoCreated = (nuevoObjetivo) => {
        fetchDashboard(); // Recargar para obtener la estructura completa del nuevo objetivo
    };

    const handleObjetivoDeleted = (id) => {
        setTreeData(prev => prev.filter(o => o.id !== id));
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary" /></div>;
    if (error) return <div className="alert alert-danger m-4">{error}</div>;

    return (
        <div>
            <Navbar />

            <div className="container">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3>Tus Objetivos FocusFlow</h3>
                    {treeData.length > 0 && (
                        <button className="btn btn-primary shadow-sm fw-bold" onClick={() => setIsModalOpen(true)}>
                            + Nuevo Objetivo
                        </button>
                    )}
                </div>

                {treeData.length === 0 ? (
                    <div className="alert alert-info text-center py-5 shadow-sm border-0">
                        <h4 className="mb-3">Aún no tienes objetivos anuales registrados.</h4>
                        <p className="text-muted mb-4">Empieza el año trazando tus metas. Da el primer paso hacia una mayor productividad.</p>
                        <button className="btn btn-lg btn-primary fw-bold px-5 rounded-pill shadow" onClick={() => setIsModalOpen(true)}>
                            + Crear mi primer Objetivo Anual
                        </button>
                    </div>
                ) : (
                    <div className="row">
                        {treeData.map(objetivo => (
                            <ObjetivoCard key={objetivo.id} objetivo={objetivo} onDelete={handleObjetivoDeleted} />
                        ))}
                    </div>
                )}
            </div>

            <CrearObjetivoModal 
                show={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onObjetivoCreated={handleObjetivoCreated} 
            />
        </div>
    );
};

export default Dashboard;
