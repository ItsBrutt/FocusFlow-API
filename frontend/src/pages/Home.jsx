import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const Home = () => {
    const { user } = useContext(AuthContext);

    const scrollToFeatures = (e) => {
        e.preventDefault();
        const element = document.getElementById('features');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-vh-100 d-flex flex-column" style={{ overflowX: 'hidden' }}>
            {/* Custom Styles for Animations & Premium Effects */}
            <style>{`
                .text-gradient {
                    background: linear-gradient(135deg, #aa3bff 0%, #3b82f6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .hero-mockup-card {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                [data-bs-theme="light"] .hero-mockup-card {
                    background: rgba(255, 255, 255, 0.7);
                    border: 1px solid rgba(0, 0, 0, 0.05);
                }
                .hero-mockup-card:hover {
                    transform: translateY(-5px) rotate(1deg);
                    box-shadow: 0 15px 30px rgba(170, 59, 255, 0.15);
                }
                .feature-card {
                    transition: all 0.3s ease;
                    border: 1px solid var(--border);
                    background: var(--bg);
                }
                .feature-card:hover {
                    transform: translateY(-8px);
                    box-shadow: var(--shadow);
                    border-color: var(--accent);
                }
                .cta-banner {
                    background: linear-gradient(135deg, #1e1b4b 0%, #311042 100%);
                    color: #ffffff;
                    border-radius: 24px;
                }
                .pulse-badge {
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { transform: scale(0.95); opacity: 0.8; }
                    50% { transform: scale(1.05); opacity: 1; }
                    100% { transform: scale(0.95); opacity: 0.8; }
                }
                .nav-cta-btn {
                    transition: transform 0.2s ease;
                }
                .nav-cta-btn:hover {
                    transform: scale(1.03);
                }
            `}</style>

            {/* Standard App Navbar for Authenticated Users */}
            {user && <Navbar />}

            {/* Public Header for Non-Authenticated Users */}
            {!user && (
                <header className="py-3 px-4 border-bottom" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                    <div className="container d-flex justify-content-between align-items-center">
                        <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none fw-bold fs-4" style={{ color: 'var(--text-h)' }}>
                            <span style={{ fontSize: '1.5rem' }}>⚡</span>
                            <span>FocusFlow</span>
                        </Link>
                        <div className="d-flex gap-2">
                            <Link to="/login" className="btn btn-outline-secondary btn-sm rounded-pill px-3">
                                Iniciar Sesión
                            </Link>
                            <Link to="/register" className="btn btn-primary btn-sm rounded-pill px-3 nav-cta-btn shadow-sm">
                                Registrarse
                            </Link>
                        </div>
                    </div>
                </header>
            )}

            {/* Hero Section */}
            <section className="py-5 my-md-4">
                <div className="container">
                    <div className="row align-items-center g-5 text-start">
                        {/* Hero Text */}
                        <div className="col-lg-6">
                            <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3 bg-opacity-10 bg-primary text-primary fw-semibold small pulse-badge">
                                🚀 Simplifica tu Productividad
                            </div>
                            <h1 className="display-4 fw-extrabold lh-sm mb-3 text-gradient text-start">
                                Domina tu semana.<br />Conquista tus metas.
                            </h1>
                            <p className="lead fs-5 mb-4 opacity-90" style={{ color: 'var(--text)', lineHeight: '1.6' }}>
                                FocusFlow es el espacio donde tus grandes objetivos estratégicos se transforman en pequeñas victorias semanales. Diseñado para quienes buscan claridad, dirección y un sistema de disciplina que fluye con su ritmo de vida.
                            </p>
                            <div className="d-flex flex-wrap gap-3">
                                {user ? (
                                    <Link to="/planner" className="btn btn-primary btn-lg rounded-pill px-4 shadow-sm py-3 fw-bold">
                                        Ir a mi Planner Semanal 📅
                                    </Link>
                                ) : (
                                    <>
                                        <Link to="/register" className="btn btn-primary btn-lg rounded-pill px-4 shadow-sm py-3 fw-bold">
                                            Crear Cuenta Gratis ✨
                                        </Link>
                                        <a href="#features" onClick={scrollToFeatures} className="btn btn-outline-secondary btn-lg rounded-pill px-4 py-3 fw-bold">
                                            Ver cómo funciona
                                        </a>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Interactive UI Mockup Card */}
                        <div className="col-lg-6">
                            <div className="card hero-mockup-card rounded-4 p-4 shadow-lg text-start">
                                <div className="d-flex align-items-center justify-content-between mb-4 border-bottom pb-2">
                                    <div className="d-flex align-items-center gap-2">
                                        <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2.5 py-1 fw-bold">Mayo 2026</span>
                                        <span className="text-muted small">Semana 3</span>
                                    </div>
                                    <div className="d-flex gap-1.5">
                                        <span className="bg-danger rounded-circle" style={{ width: '8px', height: '8px', display: 'inline-block' }}></span>
                                        <span className="bg-warning rounded-circle" style={{ width: '8px', height: '8px', display: 'inline-block' }}></span>
                                        <span className="bg-success rounded-circle" style={{ width: '8px', height: '8px', display: 'inline-block' }}></span>
                                    </div>
                                </div>
                                <div className="row g-3">
                                    <div className="col-6">
                                        <div className="p-3 rounded-3 border bg-body-tertiary h-100">
                                            <div className="fw-bold text-gradient small mb-2">🎯 META DE LA SEMANA</div>
                                            <div className="small fw-semibold" style={{ color: 'var(--text-h)' }}>Lanzar versión beta de API y refactorizar frontend</div>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="p-3 rounded-3 border bg-body-tertiary h-100">
                                            <div className="fw-bold text-success small mb-2">📈 PROGRESO</div>
                                            <div className="progress mb-1" style={{ height: '8px' }}>
                                                <div className="progress-bar bg-success" role="progressbar" style={{ width: '75%' }} aria-valuenow="75" aria-valuemin="0" aria-valuemax="100"></div>
                                            </div>
                                            <span className="small text-muted">6 de 8 completados</span>
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div className="p-3 rounded-3 border bg-body">
                                            <div className="fw-bold small mb-2 text-muted">📅 BLOQUES DE ENFOQUE</div>
                                            <div className="d-flex flex-column gap-2">
                                                <div className="d-flex justify-content-between align-items-center p-2 rounded bg-primary bg-opacity-10 text-primary small">
                                                    <span>💻 Desarrollo de API (PHP)</span>
                                                    <span className="badge bg-primary">09:00 - 11:30</span>
                                                </div>
                                                <div className="d-flex justify-content-between align-items-center p-2 rounded bg-purple bg-opacity-10 text-purple small" style={{ color: 'var(--accent)', backgroundColor: 'var(--accent-bg)' }}>
                                                    <span>🎨 Diseño de Landing Page</span>
                                                    <span className="badge" style={{ backgroundColor: 'var(--accent)' }}>14:00 - 16:00</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-5 border-top" style={{ backgroundColor: 'rgba(var(--bs-tertiary-bg-rgb), 0.5)' }}>
                <div className="container py-4">
                    <div className="text-center max-w-2xl mx-auto mb-5">
                        <h2 className="display-6 fw-bold mb-3">Diseñado para simplificar tu planificación</h2>
                        <p className="text-muted fs-5">Olvídate de las agendas complejas. FocusFlow te ofrece un sistema fluido en tres niveles.</p>
                    </div>

                    <div className="row g-4">
                        {/* Feature 1 */}
                        <div className="col-md-4">
                            <div className="card feature-card h-100 p-4 rounded-4 shadow-sm text-start">
                                <div className="fs-1 mb-3">📅</div>
                                <h3 className="h4 fw-bold mb-2">Planner Semanal</h3>
                                <p className="text-muted small" style={{ lineHeight: '1.6' }}>
                                    Organiza tus días de forma visual. Crea bloques de tareas, define tus prioridades y mantén un registro de tus logros diarios con una interfaz intuitiva y rápida.
                                </p>
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="col-md-4">
                            <div className="card feature-card h-100 p-4 rounded-4 shadow-sm text-start">
                                <div className="fs-1 mb-3">🗺️</div>
                                <h3 className="h4 fw-bold mb-2">Planificación Estratégica</h3>
                                <p className="text-muted small" style={{ lineHeight: '1.6' }}>
                                    Divide el año en meses enfocados. Conecta tu agenda diaria con tus objetivos mensuales para asegurarte de que cada acción cuenta hacia tu visión a largo plazo.
                                </p>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="col-md-4">
                            <div className="card feature-card h-100 p-4 rounded-4 shadow-sm text-start">
                                <div className="fs-1 mb-3">🎯</div>
                                <h3 className="h4 fw-bold mb-2">Objetivos Dinámicos</h3>
                                <p className="text-muted small" style={{ lineHeight: '1.6' }}>
                                    Crea metas claras con hitos y porcentajes de avance automático. Controla tu progreso global y celebra cada paso completado.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Target Audience Section */}
            <section className="py-5">
                <div className="container py-4">
                    <div className="text-center mb-5">
                        <h2 className="display-6 fw-bold mb-3">¿Para quién es FocusFlow?</h2>
                        <p className="text-muted fs-5">Un sistema flexible que se adapta a diferentes necesidades sin perder el foco.</p>
                    </div>

                    <div className="row g-4 align-items-center">
                        <div className="col-lg-4">
                            <div className="p-4 rounded-4 border bg-body h-100 text-start">
                                <div className="d-flex align-items-center gap-3 mb-3">
                                    <span className="fs-3">🎓</span>
                                    <h4 className="fw-bold mb-0">Estudiantes</h4>
                                </div>
                                <p className="text-muted small" style={{ lineHeight: '1.6' }}>
                                    Organiza clases, entregas de trabajos y sesiones de estudio de manera balanceada. Con FocusFlow, evitas las largas noches de estudio de último minuto estructurando tu semana con claridad y anticipación.
                                </p>
                            </div>
                        </div>

                        <div className="col-lg-4">
                            <div className="p-4 rounded-4 border bg-body h-100 text-start">
                                <div className="d-flex align-items-center gap-3 mb-3">
                                    <span className="fs-3">💻</span>
                                    <h4 className="fw-bold mb-0">Freelancers y Creadores</h4>
                                </div>
                                <p className="text-muted small" style={{ lineHeight: '1.6' }}>
                                    Maneja múltiples clientes y proyectos a la vez sin perder el control. Establece bloques de enfoque semanales específicos para avanzar de forma constante y mantener un balance saludable.
                                </p>
                            </div>
                        </div>

                        <div className="col-lg-4">
                            <div className="p-4 rounded-4 border bg-body h-100 text-start">
                                <div className="d-flex align-items-center gap-3 mb-3">
                                    <span className="fs-3">🚀</span>
                                    <h4 className="fw-bold mb-0">Profesionales</h4>
                                </div>
                                <p className="text-muted small" style={{ lineHeight: '1.6' }}>
                                    Alinea tu agenda diaria con tus objetivos de carrera. Filtra el ruido digital y enfoca tus horas de trabajo en las tareas estratégicas que realmente mueven la aguja.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Callout / Narrative Section */}
            <section className="py-5 mb-5">
                <div className="container">
                    <div className="cta-banner p-5 text-center shadow-lg position-relative overflow-hidden">
                        <div className="position-relative z-3">
                            <h2 className="display-5 fw-bold mb-3 text-white">Diseña una semana de la que te sientas orgulloso</h2>
                            <p className="lead mb-4 mx-auto" style={{ maxWidth: '700px', opacity: 0.9, fontSize: '1.15rem', lineHeight: '1.7' }}>
                                La organización semanal no es una camisa de fuerza; es el mapa que te da la libertad de crear, crecer y respirar con tranquilidad. Deja atrás el estrés del caos diario. Planifica hoy y empieza a fluir en tus metas.
                            </p>
                            {user ? (
                                <Link to="/planner" className="btn btn-light btn-lg rounded-pill px-5 py-3 fw-bold text-primary shadow-sm hover-scale">
                                    Ir a mi Planner Semanal 📅
                                </Link>
                            ) : (
                                <div className="d-flex justify-content-center gap-3 flex-wrap">
                                    <Link to="/register" className="btn btn-light btn-lg rounded-pill px-5 py-3 fw-bold text-primary shadow-sm">
                                        Crear Cuenta Gratis
                                    </Link>
                                    <Link to="/login" className="btn btn-outline-light btn-lg rounded-pill px-4 py-3 fw-bold">
                                        Iniciar Sesión
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="mt-auto py-4 border-top bg-body-tertiary">
                <div className="container text-center text-muted small">
                    <p className="mb-0">© {new Date().getFullYear()} FocusFlow. Todos los derechos reservados.</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;
