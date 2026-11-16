import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, ShieldCheck, User } from 'lucide-react';
import portadaImageBundled from '../../imagenes/portada.jpg';

const AUTHORIZED_USER = 'Somos33';
const AUTHORIZED_PASS = 'Encuesta33';

interface SystemCoverLoginProps {
  onAuthenticated: (keepSessionActive: boolean) => void;
}

export const SystemCoverLogin: React.FC<SystemCoverLoginProps> = ({ onAuthenticated }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [keepSession, setKeepSession] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [coverSrc, setCoverSrc] = useState<string>(portadaImageBundled);
  const [coverLoadFailed, setCoverLoadFailed] = useState<boolean>(false);

  const handleCoverError = () => {
    if (coverSrc !== '/imagenes/portada.jpg') {
      setCoverSrc('/imagenes/portada.jpg');
      return;
    }
    setCoverLoadFailed(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMessage('Ingresa tu usuario y contraseña para continuar.');
      return;
    }

    if (cleanUser === AUTHORIZED_USER && cleanPass === AUTHORIZED_PASS) {
      setErrorMessage(null);
      onAuthenticated(keepSession);
      return;
    }

    setErrorMessage(
      'Usuario o contraseña incorrectos. Verifica tus credenciales e inténtalo nuevamente.'
    );
  };

  return (
    <div className="min-h-screen bg-[#020512] text-slate-100 flex flex-col justify-between">
      <div>
        {/* Portada de ancho completo sin caracteres encima ni difuminaciones */}
        <section aria-label="Portada Ocean System" className="w-full bg-[#020512]">
          {!coverLoadFailed ? (
            <img
              src={coverSrc}
              alt="Portada Ocean System"
              referrerPolicy="no-referrer"
              onError={handleCoverError}
              className="block w-full h-auto select-none"
            />
          ) : (
            <div className="w-full aspect-video bg-[#04091A] flex items-center justify-center px-6">
              <span className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-100">
                OCEAN SYSTEM
              </span>
            </div>
          )}
        </section>

        {/* Sección moderna de acceso de usuarios */}
        <section
          aria-labelledby="ocean-access-heading"
          className="w-full border-t border-sky-400/15 bg-[#020512]"
        >
          <div className="max-w-6xl mx-auto px-6 sm:px-8 pt-8 pb-12 lg:pt-12 lg:pb-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Columna descriptiva editorial */}
            <div className="lg:col-span-6 space-y-5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-sky-300/80">
                <span>Inteligencia Sociopolítica</span>
                <span aria-hidden="true">·</span>
                <span>Cobertura Nacional</span>
                <span aria-hidden="true">·</span>
                <span>Base de Datos en la Nube</span>
              </div>

              <h1
                id="ocean-access-heading"
                className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-50 [text-wrap:balance]"
              >
                Portal de acceso estratégico y análisis estatal
              </h1>

              <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed max-w-xl">
                Accede al centro de mando para consultar indicadores por entidad federativa,
                administrar bloques estatales en archivos Excel conectados a Firebase Firestore y
                aplicar el instrumento completo de participación pública.
              </p>

              <div className="pt-3 grid grid-cols-3 gap-4 border-t border-slate-800/90 max-w-lg">
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-50 tabular-nums">
                    32
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Entidades federativas</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-50 tabular-nums">
                    43
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Reactivos del estudio</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-50 tabular-nums">
                    100
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">Encuestas por bloque</div>
                </div>
              </div>
            </div>

            {/* Tarjeta moderna de inicio de sesión */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl bg-[#070E20] border border-sky-400/20 p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-50 tracking-tight">
                      Acceso de Usuarios
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                      Ingresa tus credenciales autorizadas para entrar al sistema.
                    </p>
                  </div>
                  <ShieldCheck className="w-6 h-6 text-sky-400 shrink-0 mt-0.5" aria-hidden="true" />
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
                  <div>
                    <label
                      htmlFor="ocean-login-username"
                      className="block text-sm font-medium text-slate-200 mb-1.5"
                    >
                      Usuario
                    </label>
                    <div className="relative">
                      <User
                        className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        aria-hidden="true"
                      />
                      <input
                        id="ocean-login-username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        placeholder="Ingresa tu usuario"
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#030714] border border-slate-700/90 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus-visible:outline-none focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400/25"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="ocean-login-password"
                      className="block text-sm font-medium text-slate-200 mb-1.5"
                    >
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock
                        className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        aria-hidden="true"
                      />
                      <input
                        id="ocean-login-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        placeholder="Ingresa tu contraseña"
                        className="w-full h-11 pl-10 pr-11 rounded-xl bg-[#030714] border border-slate-700/90 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus-visible:outline-none focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400/25"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={
                          showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                        }
                        className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 absolute right-1 top-1/2 -translate-y-1/2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <label className="inline-flex items-center gap-2.5 text-xs sm:text-sm text-slate-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={keepSession}
                        onChange={(e) => setKeepSession(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 bg-[#030714] text-sky-400 focus:ring-sky-400/30 cursor-pointer"
                      />
                      <span>Mantener acceso activo en esta sesión</span>
                    </label>
                  </div>

                  {errorMessage && (
                    <div
                      role="alert"
                      className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-start gap-2.5 text-xs sm:text-sm text-rose-200"
                    >
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full h-11 px-5 rounded-xl bg-[#0EA5E9] hover:bg-[#38BDF8] text-slate-950 font-semibold text-sm transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                  >
                    <span>Entrar al Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="w-full border-t border-slate-900 bg-[#020512]">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>Ocean System · Plataforma de Estudio Sociopolítico y Demográfico</span>
          <span>Acceso exclusivo para usuarios autorizados</span>
        </div>
      </footer>
    </div>
  );
};
