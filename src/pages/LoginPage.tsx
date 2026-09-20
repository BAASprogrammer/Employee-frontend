import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/axiosInstance';
import { User, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Users } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Manejo del formulario de login
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    // Validación de campos
    if (!username || !password) {
      setError('Por favor ingresa tu usuario y contraseña');
      return;
    }

    // Manejo del login
    const started = Date.now(); // Marca el inicio para calcular cuánto falta para los 5s
    try {
      // Esperar a que el login se complete
      setIsLoading(true);
      await login(username, password);
      // Navegar al dashboard
      navigate('/dashboard');
    } catch (err) {
      // Evita que el error aparezca antes de cumplirse ~5s de spinner
      const remaining = Math.max(0, 5000 - (Date.now() - started));
      // Esperar a que pasen los segundos restantes
      await new Promise((resolve) => window.setTimeout(resolve, remaining));
      // Recién acá se muestra el error (mientras tanto el spinner sigue girando)
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
      // Limpiar los campos del formulario
      setUsername('');
      setPassword('');
    }
  };

  // Manejo del botón de "Olvidé mi contraseña"
  const forgetPassword = () => {
    setError('Contacta a Recursos Humanos para restablecer tu contraseña.');
    setTimeout(() => setError(null), 6000);
  };

  // Renderizado del componente
  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Panel Izquierdo - Branding */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 relative overflow-hidden">
        {/* Círculos decorativos */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 right-0 w-80 h-80 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/15 backdrop-blur rounded-xl flex items-center justify-center border border-white/20">
            <Users size={22} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Portal de Empleados</span>
        </div>

        {/* Texto central */}
        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Gestión de Empleados<br />
            <span className="text-blue-300">centralizada y eficiente.</span>
          </h2>
          <p className="text-blue-200/80 text-base max-w-sm leading-relaxed">
            Consulta el directorio completo de empleados, departamentos y cargos desde un solo lugar, con acceso rápido y seguro.
          </p>

          {/* Estadísticas */}
          <div className="mt-10 grid grid-cols-3 gap-6">
            {[
              { value: '1000+', label: 'Empleados' },
              { value: '4+', label: 'Departamentos' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-blue-300/80 text-xs mt-1 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-blue-300/50 text-xs">
          © {new Date().getFullYear()} Portal de Empleados · Todos los derechos reservados
        </p>
      </div>

      {/* Panel Derecho - Formulario de login */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-slate-950">
        <div className="w-full max-w-sm">
          {/* Logo móvil */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Users size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg">Portal de Empleados</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1.5">Iniciar Sesión</h1>
            <p className="text-slate-400 text-sm">Ingresa tus credenciales para continuar</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-950/60 border border-red-800/60 text-red-300 rounded-xl text-sm flex items-center gap-2.5" role="alert">
              <AlertCircle size={17} className="shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {/* Campo de usuario */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Usuario
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 text-slate-500 pointer-events-none" size={17} />
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nombre de usuario"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-600"
                  required
                />
              </div>
            </div>

            {/* Campo de contraseña */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="current-password" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 text-slate-500 pointer-events-none" size={17} />
                <input
                  id="current-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-600"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 text-slate-500 hover:text-slate-300 p-1 rounded-lg transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Botón de restablecer contraseña */}
            <div className="flex items-center justify-end text-sm mt-1">
              <button
                type="button"
                className="text-blue-400 hover:text-blue-300 font-medium text-xs transition-colors"
                onClick={forgetPassword}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Botón de submit */}
            <button
              type="submit"
              className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-700/30 active:scale-[0.98] disabled:bg-blue-900 disabled:text-blue-500 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-300 rounded-full animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
