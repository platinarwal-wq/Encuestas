/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { DashboardModule } from './components/DashboardModule';
import { DataExplorerModule } from './components/DataExplorerModule';
import { StateExcelStudyModule } from './components/StateExcelStudyModule';
import { SurveyTerminalModule } from './components/SurveyTerminalModule';
import { SwarmSimulatorModule } from './components/SwarmSimulatorModule';
import { exportRecordsToExcelXlsx } from './engine/excelStateProcessor';
import { generateInitialSeedDataset } from './engine/swarmSimulator';
import { auth, googleProvider } from './lib/firebase';
import {
  saveSingleSurveyToFirestore,
  subscribeUserStateBatches,
  subscribeUserSurveys,
} from './services/orusFirestoreService';
import { ActiveModule, OrusResponse, StateBatchRecord } from './types/orus';
import {
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Cpu,
  Database,
  Download,
  FileSpreadsheet,
  LogIn,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const STORAGE_KEY = 'ocean_system_v43_records';

export default function App() {
  const [activeModule, setActiveModule] = useState<ActiveModule>('EXCEL_BATCHES');
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const [explorerEntityFilter, setExplorerEntityFilter] = useState<string>('');
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Estado de Autenticación y Base de Datos Firestore
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [dbRecords, setDbRecords] = useState<OrusResponse[]>([]);
  const [stateBatches, setStateBatches] = useState<StateBatchRecord[]>([]);
  const [onlyDbDatasetMode, setOnlyDbDatasetMode] = useState<boolean>(false);

  // Semilla y capturas locales / sintéticas
  const [localRecords, setLocalRecords] = useState<OrusResponse[]>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as OrusResponse[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback directo a la semilla precargada N = 120
    }
    return generateInitialSeedDataset(120);
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(localRecords));
    } catch {
      // Evitar bloqueo si el almacenamiento local alcanza cuota tras lotes grandes
    }
  }, [localRecords]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthReady(true);
      if (!user) {
        setDbRecords([]);
        setStateBatches([]);
        setOnlyDbDatasetMode(false);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const unsubSurveys = subscribeUserSurveys(
      currentUser.uid,
      (cloudList) => {
        setDbRecords(cloudList);
      },
      () => {
        // Manejado de forma estructurada en orusFirestoreService
      }
    );

    const unsubBatches = subscribeUserStateBatches(
      currentUser.uid,
      (batches) => {
        setStateBatches(batches);
      },
      () => {
        // Manejado de forma estructurada en orusFirestoreService
      }
    );

    return () => {
      unsubSurveys();
      unsubBatches();
    };
  }, [currentUser]);

  // Cuando el usuario ya subió bloques reales a la BD por primera vez, priorizar sus datos reales por defecto
  useEffect(() => {
    if (dbRecords.length >= 100 && !onlyDbDatasetMode) {
      setOnlyDbDatasetMode(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbRecords.length > 0]);

  const combinedRecords = useMemo(() => {
    if (onlyDbDatasetMode && dbRecords.length > 0) {
      return dbRecords;
    }
    if (dbRecords.length === 0) {
      return localRecords;
    }
    const seenFolios = new Set(dbRecords.map((r) => r.folio));
    const uniqueLocal = localRecords.filter((r) => !seenFolios.has(r.folio));
    return [...dbRecords, ...uniqueLocal];
  }, [dbRecords, localRecords, onlyDbDatasetMode]);

  const triggerBanner = (msg: string) => {
    setBannerNotice(msg);
    window.setTimeout(() => {
      setBannerNotice((cur) => (cur === msg ? null : cur));
    }, 5000);
  };

  const handleSignInGoogle = async (): Promise<boolean> => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user) {
        triggerBanner(`Base de datos conectada con la cuenta ${cred.user.email}.`);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    triggerBanner('Sesión de base de datos cerrada. Operando en vista previa local.');
  };

  const handleSurveySubmitted = (newRecord: OrusResponse) => {
    if (currentUser) {
      void saveSingleSurveyToFirestore(newRecord, 'TERMINAL')
        .then(() => {
          triggerBanner(
            `Encuesta ${newRecord.folio} (${newRecord.p2_entidad}) almacenada en la Base de Datos.`
          );
        })
        .catch(() => {
          setLocalRecords((prev) => [newRecord, ...prev]);
          triggerBanner(
            `Encuesta ${newRecord.folio} registrada localmente (verifica conexión para sincronizar BD).`
          );
        });
    } else {
      setLocalRecords((prev) => [newRecord, ...prev]);
      triggerBanner(
        `Encuesta ${newRecord.folio} (${newRecord.p2_entidad}) registrada en memoria activa.`
      );
    }
  };

  const handleBatchInjected = (batch: OrusResponse[]) => {
    setLocalRecords((prev) => [...batch, ...prev]);
    if (onlyDbDatasetMode) {
      setOnlyDbDatasetMode(false);
    }
    triggerBanner(
      `Lote de N=${batch.length} registros integrado al motor analítico.`
    );
  };

  const handleInspectEntityInExplorer = (entityName: string) => {
    setExplorerEntityFilter(entityName);
    setActiveModule('EXPLORER');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetSeed = () => {
    const freshSeed = generateInitialSeedDataset(120);
    setLocalRecords(freshSeed);
    setExplorerEntityFilter('');
    triggerBanner('Semilla local restaurada (N = 120 registros base).');
  };

  const navItems: Array<{
    id: ActiveModule;
    shortLabel: string;
    sidebarTitle: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'DASHBOARD',
      shortLabel: 'Dashboard',
      sidebarTitle: '01. Dashboard Táctico',
      subtitle: 'Telemetría nacional y gráficas OCEAN',
      icon: BarChart3,
    },
    {
      id: 'SURVEY',
      shortLabel: 'Realizar Encuesta',
      sidebarTitle: '02. Realizar Encuesta',
      subtitle: 'Contestar los 43 ítems individuales',
      icon: ClipboardCheck,
    },
    {
      id: 'EXCEL_BATCHES',
      shortLabel: 'Bloques Excel',
      sidebarTitle: '03. Bloques Excel (100/Edo)',
      subtitle: 'Carga estatal .xlsx y Base de Datos',
      icon: FileSpreadsheet,
    },
    {
      id: 'SIMULATOR',
      shortLabel: 'Analizador IA',
      sidebarTitle: '04. Analizador Demográfico',
      subtitle: 'Modelado de encuestas analizadas',
      icon: Cpu,
    },
    {
      id: 'EXPLORER',
      shortLabel: 'Explorador',
      sidebarTitle: '05. Explorador y Auditoría',
      subtitle: 'Folios, semántica y exportación',
      icon: Database,
    },
  ];

  const realCount = combinedRecords.filter((r) => r.origin === 'REAL').length;
  const synthCount = combinedRecords.length - realCount;

  return (
    <div className="min-h-screen bg-[#05070A] ocean-grid-bg text-slate-100 flex flex-col">
      {/* Top Bar de 3 Zonas */}
      <header className="sticky top-0 z-40 h-16 bg-[#05070A]/90 backdrop-blur-xl border-b border-[#00F0FF]/18 px-4 lg:px-6 flex items-center justify-between gap-8">
        {/* Zona 1: Wordmark limpio */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileNavOpen((v) => !v)}
            className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 cursor-pointer"
            aria-label="Abrir menú de módulos"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={() => setActiveModule('DASHBOARD')}
            className="text-lg font-bold tracking-tight text-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            OCEAN SYSTEM
          </button>
        </div>

        {/* Zona 2: Enlaces limpios de una sola línea */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveModule(item.id)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                  isActive
                    ? 'text-[#00F0FF] border-[#00F0FF]'
                    : 'text-slate-400 border-transparent hover:text-slate-100'
                }`}
              >
                {item.shortLabel}
              </button>
            );
          })}
        </nav>

        {/* Zona 3: 1 Acción Primaria */}
        <div className="flex items-center shrink-0">
          {activeModule !== 'EXCEL_BATCHES' ? (
            <button
              type="button"
              onClick={() => setActiveModule('EXCEL_BATCHES')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#00FF9D] text-slate-950 hover:bg-[#34FFB2] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Cargar Excel (100/Edo)
            </button>
          ) : (
            <button
              type="button"
              onClick={() => exportRecordsToExcelXlsx(combinedRecords)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#00F0FF] text-slate-950 hover:bg-[#38F5FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar .xlsx ({combinedRecords.length})
            </button>
          )}
        </div>
      </header>

      {/* Layout Principal: Barra Lateral de Comando + Área de Trabajo */}
      <div className="flex-1 flex relative">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex lg:w-68 xl:w-72 shrink-0 flex-col justify-between bg-[#0B0F17]/92 border-r border-slate-800/90 p-4">
          <div className="space-y-5">
            <div className="px-2 pt-1">
              <div className="text-[11px] font-mono text-[#00F0FF]">
                SUITE SOCIOPOLÍTICA · OCEAN-43
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Estudio nacional por bloques estatales de 100 personas y telemetría de opinión pública.
              </p>
            </div>

            <div className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveModule(item.id)}
                    className={`w-full p-3 rounded-xl text-left transition-colors flex items-start gap-3 cursor-pointer border ${
                      active
                        ? 'bg-[#00F0FF]/12 border-[#00F0FF]/45 text-slate-50 glow-cyan'
                        : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-900/80 hover:text-slate-200'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        active ? 'text-[#00F0FF]' : 'text-slate-400'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{item.sidebarTitle}</div>
                      <div className="text-xs text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Panel de Base de Datos y Muestra Activa */}
          <div className="p-3.5 rounded-xl bg-[#05070A]/90 border border-slate-800/90 space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">BASE DE DATOS</span>
              <span className={currentUser ? 'text-[#00FF9D]' : 'text-slate-500'}>
                {currentUser ? 'ACTIVA' : 'SIN SESIÓN'}
              </span>
            </div>

            {isAuthReady && (
              currentUser ? (
                <div className="space-y-2 pb-2 border-b border-slate-800">
                  <div className="text-[11px] text-slate-300 truncate" title={currentUser.email || ''}>
                    {currentUser.email}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Guardados en BD</span>
                    <span className="tabular-nums font-bold text-[#00FF9D]">
                      {dbRecords.length}
                    </span>
                  </div>
                  {dbRecords.length > 0 && (
                    <div className="grid grid-cols-2 gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => setOnlyDbDatasetMode(true)}
                        className={`py-1 px-1.5 rounded text-[10px] cursor-pointer ${
                          onlyDbDatasetMode
                            ? 'bg-[#00FF9D]/20 text-[#00FF9D] border border-[#00FF9D]/40'
                            : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        Solo BD ({dbRecords.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setOnlyDbDatasetMode(false)}
                        className={`py-1 px-1.5 rounded text-[10px] cursor-pointer ${
                          !onlyDbDatasetMode
                            ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40'
                            : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        BD + Analizadas
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    Cerrar sesión
                  </button>
                </div>
              ) : (
                <div className="pb-2 border-b border-slate-800">
                  <button
                    type="button"
                    onClick={() => void handleSignInGoogle()}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 text-[#00F0FF] border border-[#00F0FF]/35 font-semibold cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Conectar Google BD
                  </button>
                </div>
              )
            )}

            <div className="flex items-center justify-between">
              <span className="text-slate-300">Muestra en vista</span>
              <span className="tabular-nums font-bold text-[#00F0FF]">
                {combinedRecords.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Encuestas reales</span>
              <span className="tabular-nums text-[#00FF9D]">{realCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Encuestas analizadas</span>
              <span className="tabular-nums text-slate-300">{synthCount}</span>
            </div>
          </div>
        </aside>

        {/* Drawer Móvil */}
        {mobileNavOpen && (
          <div
            className="fixed inset-0 z-50 lg:hidden bg-black/75 backdrop-blur-xs"
            onClick={() => setMobileNavOpen(false)}
          >
            <div
              className="w-72 h-full bg-[#0B0F17] border-r border-slate-800 p-4 space-y-4 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-bold text-slate-100">Módulos Operativos</span>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeModule === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveModule(item.id);
                        setMobileNavOpen(false);
                      }}
                      className={`w-full p-3 rounded-lg text-left flex items-center gap-3 ${
                        active
                          ? 'bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40'
                          : 'text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <div>
                        <div className="text-sm font-semibold">{item.sidebarTitle}</div>
                        <div className="text-xs text-slate-400">{item.subtitle}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Viewport Principal */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto w-full">
          {bannerNotice && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#00FF9D]/12 border border-[#00FF9D]/40 flex items-center justify-between gap-3 text-xs font-mono text-[#00FF9D]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{bannerNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setBannerNotice(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {activeModule === 'DASHBOARD' && (
            <DashboardModule
              records={combinedRecords}
              onNavigateModule={setActiveModule}
              onInspectEntityInExplorer={handleInspectEntityInExplorer}
            />
          )}

          {activeModule === 'SURVEY' && (
            <SurveyTerminalModule
              totalRecordsCount={combinedRecords.length}
              onSubmitSurvey={handleSurveySubmitted}
              onNavigateModule={setActiveModule}
            />
          )}

          {activeModule === 'EXCEL_BATCHES' && (
            <StateExcelStudyModule
              userEmail={currentUser?.email ?? null}
              isAuthReady={isAuthReady}
              dbRecords={dbRecords}
              allRecords={combinedRecords}
              stateBatches={stateBatches}
              onSignInGoogle={handleSignInGoogle}
              onLocalFallbackInject={handleBatchInjected}
              onInspectEntityInExplorer={handleInspectEntityInExplorer}
              onNavigateModule={setActiveModule}
              onNotify={triggerBanner}
            />
          )}

          {activeModule === 'SIMULATOR' && (
            <SwarmSimulatorModule
              existingCount={combinedRecords.length}
              onInjectBatch={handleBatchInjected}
              onNavigateModule={setActiveModule}
            />
          )}

          {activeModule === 'EXPLORER' && (
            <DataExplorerModule
              records={combinedRecords}
              initialEntityFilter={explorerEntityFilter}
              onClearEntityFilter={() => setExplorerEntityFilter('')}
              onResetToSeed={handleResetSeed}
            />
          )}
        </main>
      </div>
    </div>
  );
}
