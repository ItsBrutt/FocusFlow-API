import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import PlannerMaestro from './pages/PlannerMaestro';
import Planificacion from './pages/Planificacion';
import ObjetivoView from './pages/ObjetivoView';

function App() {
  return (
    <Router>
      <div className="bg-light min-vh-100">
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rutas Protegidas */}
          <Route path="/planner" element={
            <ProtectedRoute><PlannerMaestro /></ProtectedRoute>
          } />

          <Route path="/planificacion" element={
            <ProtectedRoute><Planificacion /></ProtectedRoute>
          } />

          <Route path="/planificacion/objetivo/:id" element={
            <ProtectedRoute><ObjetivoView /></ProtectedRoute>
          } />

          {/* Compatibilidad con rutas legacy */}
          <Route path="/dashboard" element={<Navigate to="/planificacion" replace />} />
          <Route path="/dashboard/objetivo/:id" element={<Navigate to="/planificacion/objetivo/:id" replace />} />

          {/* Fallback → Planner es la home */}
          <Route path="*" element={<Navigate to="/planner" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
