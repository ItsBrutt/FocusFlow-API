import { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import Navbar from '../components/Navbar';
import ObjetivoCard from '../components/ObjetivoCard';
import CrearObjetivoModal from '../components/CrearObjetivoModal';

const Planificacion = () => {
    const [treeData, setTreeData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => { fetchDashboard(); }, []);

    const fetchDashboard = async () => {
        try {
            const res = await api.get('/api/dashboard');
            if (res.data.success) setTreeData(res.data.data);
        } catch { setError("No se pudo cargar la información."); }
        finally { setLoading(false); }
    };

    const handleObjetivoDeleted = (id) => setTreeData(prev => prev.filter(o => o.id !== id));

    if (loading) return (
        <div style={{ background: '#f0f4f8', minHeight: '100vh' }}>
            <Navbar />
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div className="spinner-border text-primary" />
            </div>
        </div>
    );

    if (error) return (
        <div style={{ background: '#f0f4f8', minHeight: '100vh' }}>
            <Navbar />
            <div className="container"><div className="alert alert-danger mt-4">{error}</div></div>
        </div>
    );

    return (
        <div style={{ background: '#f0f4f8', minHeight: '100vh' }}>
            <Navbar />
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px 40px' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>🗺️ Planificación</h1>
                        <p style={{ color: '#64748b', margin: '2px 0 0', fontSize: '0.85rem' }}>
                            Define tus objetivos y desbloquea semanas paso a paso.
                        </p>
                    </div>
                    {treeData.length > 0 && (
                        <button onClick={() => setIsModalOpen(true)} style={{
                            background: '#1e293b', color: '#fff', border: 'none',
                            borderRadius: '10px', padding: '10px 20px', fontWeight: '700',
                            fontSize: '0.88rem', cursor: 'pointer', display: 'flex',
                            alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}>
                            + Nuevo Objetivo
                        </button>
                    )}
                </div>

                {treeData.length === 0 ? (
                    /* Empty State */
                    <div style={{
                        background: '#fff', borderRadius: '16px', padding: '60px 32px',
                        textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        border: '1px solid #f1f5f9'
                    }}>
                        <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🎯</div>
                        <h3 style={{ fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Sin objetivos todavía</h3>
                        <p style={{ color: '#64748b', marginBottom: '28px', maxWidth: '380px', margin: '0 auto 28px' }}>
                            Define tu primer objetivo. Establece cuántos meses te llevará y planifica semana a semana.
                        </p>
                        <button onClick={() => setIsModalOpen(true)} style={{
                            background: '#2563eb', color: '#fff', border: 'none',
                            borderRadius: '10px', padding: '12px 32px', fontWeight: '700',
                            fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
                        }}>
                            + Crear mi primer Objetivo Anual
                        </button>
                        <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '16px' }}>
                            💡 Consejo: puedes planificar los fines de semana sin distracciones
                        </p>
                    </div>
                ) : (
                    <div>
                        {treeData.map(objetivo => (
                            <ObjetivoCard key={objetivo.id} objetivo={objetivo} onDelete={handleObjetivoDeleted} />
                        ))}
                    </div>
                )}
            </div>

            <CrearObjetivoModal show={isModalOpen} onClose={() => setIsModalOpen(false)} onObjetivoCreado={fetchDashboard} />
        </div>
    );
};

export default Planificacion;
