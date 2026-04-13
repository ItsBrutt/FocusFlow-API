import { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();

    if (!user) return null;

    const isActive = (path) => location.pathname.startsWith(path);

    return (
        <header>
            <nav className="navbar navbar-expand-lg navbar-dark shadow-sm mb-3 mb-md-4" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }} aria-label="Navegación principal">
                <style>{`
                    @media (max-width: 767px) {
                        body { padding-bottom: 70px; }
                    }
                `}</style>
                <div className="container">
                    {/* Brand */}
                    <Link className="navbar-brand fw-bold fs-4 d-flex align-items-center gap-2" to="/planner">
                        <span style={{ fontSize: '1.4rem' }}>⚡</span>
                        <span>FocusFlow</span>
                    </Link>

                    {/* Nav Links - Desktop */}
                    <div className="d-none d-md-flex align-items-center gap-1 me-auto ms-4">
                        <Link
                            to="/planner"
                            className={`nav-link px-3 py-2 rounded-pill fw-semibold ${isActive('/planner') ? 'text-white bg-white bg-opacity-25' : 'text-white opacity-75'}`}
                            style={{ transition: '0.2s', fontSize: '0.92rem' }}
                        >
                            📅 Planner
                        </Link>
                        <Link
                            to="/planificacion"
                            className={`nav-link px-3 py-2 rounded-pill fw-semibold ${isActive('/planificacion') ? 'text-white bg-white bg-opacity-25' : 'text-white opacity-75'}`}
                            style={{ transition: '0.2s', fontSize: '0.92rem' }}
                        >
                            🗺️ Planificación
                        </Link>
                    </div>

                    {/* User info */}
                    <div className="d-flex align-items-center gap-2 gap-md-3 ms-auto">
                        <span className="text-white opacity-75 small d-none d-md-inline">Hola, <strong>{user.nombre}</strong></span>
                        <button onClick={logout} className="btn btn-sm btn-outline-light rounded-pill px-3">
                            Salir
                        </button>
                    </div>
                </div>

                {/* Bottom Nav - Mobile */}
                <nav className="d-md-none fixed-bottom bg-white d-flex justify-content-around align-items-center pb-2 pt-2" style={{ height: '65px', boxShadow: '0 -4px 12px rgba(0,0,0,0.06)', zIndex: 1050, borderTop: '1px solid #f1f5f9' }} aria-label="Navegación móvil">
                    <Link to="/planner" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: isActive('/planner') ? '#2563eb' : '#94a3b8' }}>
                        <span style={{ fontSize: '1.25rem', marginBottom: '2px', filter: isActive('/planner') ? 'none' : 'grayscale(100%)', opacity: isActive('/planner') ? 1 : 0.6 }}>📅</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: isActive('/planner') ? '700' : '500' }}>Planner</span>
                    </Link>
                    <Link to="/planificacion" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: isActive('/planificacion') ? '#2563eb' : '#94a3b8' }}>
                        <span style={{ fontSize: '1.25rem', marginBottom: '2px', filter: isActive('/planificacion') ? 'none' : 'grayscale(100%)', opacity: isActive('/planificacion') ? 1 : 0.6 }}>🗺️</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: isActive('/planificacion') ? '700' : '500' }}>Planificación</span>
                    </Link>
                </nav>
            </nav>
        </header>
    );
};

export default Navbar;
