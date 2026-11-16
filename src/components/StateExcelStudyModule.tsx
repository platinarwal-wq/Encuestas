import React, { useMemo, useRef, useState } from 'react';
import { MEXICO_ENTITIES } from '../data/orusCatalogs';
import {
  downloadBlankStateTemplateXlsx,
  downloadSample100StateWorkbookXlsx,
  exportRecordsToExcelXlsx,
  ParsedExcelBatchResult,
  parseUploadedStateExcelFile,
} from '../engine/excelStateProcessor';
import {
  deleteStateBatchFromFirestore,
  saveStateExcelBatchToFirestore,
} from '../services/orusFirestoreService';
import { ActiveModule, OrusResponse, StateBatchRecord } from '../types/orus';
import { StateRespondentsBreakdown } from './StateRespondentsBreakdown';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CloudUpload,
  Database,
  Download,
  Eye,
  FileSpreadsheet,
  LogIn,
  Sparkles,
  Trash2,
  Upload,
  AlertTriangle,
  Users,
} from 'lucide-react';

interface StateExcelStudyModuleProps {
  userEmail: string | null;
  isAuthReady: boolean;
  dbRecords: OrusResponse[];
  allRecords: OrusResponse[];
  stateBatches: StateBatchRecord[];
  pendingLocalExcelCount: number;
  isSyncingPending: boolean;
  onSyncPendingToFirebase: () => Promise<void>;
  onSignInGoogle: () => Promise<boolean>;
  onLocalFallbackInject: (records: OrusResponse[]) => void;
  onInspectEntityInExplorer: (entityName: string) => void;
  onNavigateModule: (mod: ActiveModule) => void;
  onNotify: (msg: string) => void;
  onEmptyState: (stateName: string) => Promise<void>;
  emptyingStateName: string | null;
}

export const StateExcelStudyModule: React.FC<StateExcelStudyModuleProps> = ({
  userEmail,
  isAuthReady,
  dbRecords,
  allRecords,
  stateBatches,
  pendingLocalExcelCount,
  isSyncingPending,
  onSyncPendingToFirebase,
  onSignInGoogle,
  onLocalFallbackInject,
  onInspectEntityInExplorer,
  onNotify,
  onEmptyState,
  emptyingStateName,
}) => {
  const states32 = useMemo(
    () => MEXICO_ENTITIES.filter((e) => e.code !== 'EXT'),
    []
  );

  const [selectedState, setSelectedState] = useState<string>('Guanajuato');
  const [expandedStateName, setExpandedStateName] = useState<string | null>('Guanajuato');
  const [regionFilter, setRegionFilter] = useState<string>('ALL');
  const [lockRowsToSelectedState, setLockRowsToSelectedState] = useState<boolean>(true);
  const [autoSaveToFirebase, setAutoSaveToFirebase] = useState<boolean>(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedPreview, setParsedPreview] = useState<ParsedExcelBatchResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isSavingDb, setIsSavingDb] = useState<boolean>(false);
  const [savingTargetState, setSavingTargetState] = useState<string | null>(null);
  const [saveProgress, setSaveProgress] = useState<{ saved: number; total: number } | null>(
    null
  );
  const [confirmDeleteBatchId, setConfirmDeleteBatchId] = useState<string | null>(null);
  const [deletingBatchId, setDeletingBatchId] = useState<string | null>(null);
  const [confirmEmptyStateName, setConfirmEmptyStateName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const directStateInputRef = useRef<HTMLInputElement | null>(null);
  const directTargetStateRef = useRef<string>('Guanajuato');
  const stateMatrixRef = useRef<HTMLElement | null>(null);
  const uploadSectionRef = useRef<HTMLElement | null>(null);

  const selectedEntityMeta = useMemo(
    () => states32.find((s) => s.name === selectedState) || states32[0],
    [states32, selectedState]
  );

  // Contabilizar progreso estatal real (priorizando registros persistidos en BD cuando ya hay lotes cargados)
  const studySourceRecords = useMemo(() => {
    if (userEmail && dbRecords.length > 0) {
      return dbRecords;
    }
    return allRecords.filter((r) => r.origin === 'REAL');
  }, [userEmail, dbRecords, allRecords]);

  const stateProgressList = useMemo(() => {
    const realCountsByState: Record<string, number> = {};
    const firebaseCountsByState: Record<string, number> = {};
    const totalCountsByState: Record<string, number> = {};
    for (const r of studySourceRecords) {
      realCountsByState[r.p2_entidad] = (realCountsByState[r.p2_entidad] || 0) + 1;
    }
    for (const r of dbRecords) {
      firebaseCountsByState[r.p2_entidad] = (firebaseCountsByState[r.p2_entidad] || 0) + 1;
    }
    for (const r of allRecords) {
      totalCountsByState[r.p2_entidad] = (totalCountsByState[r.p2_entidad] || 0) + 1;
    }
    return states32.map((st) => {
      const count = realCountsByState[st.name] || 0;
      const firebaseCount = firebaseCountsByState[st.name] || 0;
      const totalInView = totalCountsByState[st.name] || 0;
      const pct = Math.min(100, Math.round((count / 100) * 100));
      return {
        ...st,
        count,
        firebaseCount,
        totalInView,
        pct,
        isComplete: count >= 100,
      };
    });
  }, [states32, studySourceRecords, dbRecords, allRecords]);

  const filteredStateProgress = useMemo(() => {
    if (regionFilter === 'ALL') return stateProgressList;
    return stateProgressList.filter((s) => s.region === regionFilter);
  }, [stateProgressList, regionFilter]);

  const completedStatesCount = useMemo(
    () => stateProgressList.filter((s) => s.isComplete).length,
    [stateProgressList]
  );

  const totalStudyCaptured = studySourceRecords.length;
  const nationalTarget = 3200; // 32 estados * 100 personas
  const nationalPct = Math.min(100, Math.round((totalStudyCaptured / nationalTarget) * 100));

  const commitBatchToFirebase = async (
    batchRes: ParsedExcelBatchResult,
    fileName: string,
    effectiveStateName: string
  ) => {
    setIsSavingDb(true);
    setSavingTargetState(effectiveStateName);
    setSaveProgress({ saved: 0, total: batchRes.records.length });

    try {
      const meta =
        states32.find((s) => s.name === effectiveStateName) || selectedEntityMeta;

      const result = await saveStateExcelBatchToFirestore({
        entidad: meta.name,
        stateShortCode: meta.short,
        fileName: fileName || `Bloque_${meta.short}.xlsx`,
        records: batchRes.records,
        targetQuota: 100,
        onProgress: (saved, total) => setSaveProgress({ saved, total }),
      });

      onNotify(
        `Archivo "${fileName}" almacenado en Firebase Firestore para ${meta.name}: ${result.savedCount} personas (${result.batchCode}).`
      );
      setSelectedState(meta.name);
      setExpandedStateName(meta.name);
      setParsedPreview(null);
      setSelectedFile(null);
      setSaveProgress(null);
    } catch (err) {
      setParseError(
        err instanceof Error
          ? `Error al guardar en Firebase Firestore: ${err.message}`
          : 'No se pudo completar el guardado en Firebase Firestore.'
      );
    } finally {
      setIsSavingDb(false);
      setSavingTargetState(null);
    }
  };

  const processExcelFile = async (
    file: File,
    targetStateName: string,
    lockState: boolean,
    shouldAutoPersist = autoSaveToFirebase
  ) => {
    setSelectedFile(file);
    setParseError(null);
    setIsParsing(true);
    try {
      const res = await parseUploadedStateExcelFile(file, {
        targetState: targetStateName,
        lockAllRowsToTargetState: lockState,
      });
      const resolvedState = lockState ? targetStateName : res.detectedState || targetStateName;
      setSelectedState(resolvedState);
      setExpandedStateName(resolvedState);
      setParsedPreview(res);

      // Si la sesión de Firebase está activa y el guardado automático está habilitado, almacenar de inmediato en Firestore
      if (userEmail && shouldAutoPersist && res.records.length > 0) {
        setIsParsing(false);
        await commitBatchToFirebase(res, file.name, resolvedState);
        return;
      }

      if (!userEmail) {
        uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch (err) {
      setParsedPreview(null);
      setParseError(
        err instanceof Error
          ? err.message
          : 'No fue posible leer el archivo Excel. Verifica que sea formato .xlsx, .xls o .csv.'
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    await processExcelFile(f, selectedState, lockRowsToSelectedState, autoSaveToFirebase);
    e.target.value = '';
  };

  const handleDirectStateFileUpload = async (stateName: string, file: File) => {
    setSelectedState(stateName);
    setLockRowsToSelectedState(true);
    await processExcelFile(file, stateName, true, true);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    await processExcelFile(f, selectedState, lockRowsToSelectedState, autoSaveToFirebase);
  };

  const handleSaveBatchToDatabase = async () => {
    if (!parsedPreview || parsedPreview.records.length === 0) return;
    setParseError(null);

    if (!userEmail) {
      const signedIn = await onSignInGoogle();
      if (!signedIn) {
        setParseError(
          'Inicia sesión con tu cuenta Google para almacenar de forma permanente el archivo en Firebase Firestore.'
        );
        return;
      }
    }

    const effectiveState = lockRowsToSelectedState
      ? selectedState
      : parsedPreview.detectedState || selectedState;

    await commitBatchToFirebase(
      parsedPreview,
      selectedFile?.name || `Bloque_${effectiveState}.xlsx`,
      effectiveState
    );
  };

  const handleDeleteBatch = async (batch: StateBatchRecord) => {
    setDeletingBatchId(batch.id);
    try {
      const linkedIds = dbRecords
        .filter((r) => r.batchId === batch.id)
        .map((r) => r.id);
      await deleteStateBatchFromFirestore(batch.id, linkedIds);
      setConfirmDeleteBatchId(null);
      onNotify(`Bloque ${batch.batchCode} (${batch.entidad}) eliminado de la base de datos.`);
    } catch (err) {
      setParseError(
        err instanceof Error ? err.message : 'Error al eliminar el bloque estatal.'
      );
    } finally {
      setDeletingBatchId(null);
    }
  };

  const executeEmptyForState = async (stateName: string) => {
    setParseError(null);
    await onEmptyState(stateName);
    setConfirmEmptyStateName(null);
    setSelectedState(stateName);
    setExpandedStateName(stateName);
    if (parsedPreview && parsedPreview.detectedState === stateName) {
      setParsedPreview(null);
      setSelectedFile(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera Estratégica del Estudio Estatal por Bloques de 100 Personas */}
      <section className="ocean-surface rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
              <span className="text-[#00F0FF]">[ESTUDIO_ESTATAL_EXCEL_100X32]</span>
              <span aria-hidden="true">·</span>
              <span className={userEmail ? 'text-[#00FF9D]' : 'text-amber-300'}>
                {userEmail
                  ? `FIREBASE FIRESTORE ACTIVO (${userEmail})`
                  : 'CONECTA TU CUENTA GOOGLE PARA ALMACENAR ARCHIVOS EN FIREBASE'}
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-semibold text-slate-50">
              Carga de Bloques Excel por Estado en Firebase (100 Personas por Entidad)
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Ingresa archivos Excel o CSV (<code>.xlsx</code>, <code>.xls</code>, <code>.csv</code>) en
              cualquiera de los 32 estados: la información se valida y se almacena directamente en la base de
              datos de Firebase Firestore.
            </p>
          </div>

          {isAuthReady && !userEmail && (
            <button
              type="button"
              onClick={() => void onSignInGoogle()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#00F0FF] text-slate-950 hover:bg-[#38F5FF] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <LogIn className="w-4 h-4" />
              Conectar Firebase (Google)
            </button>
          )}
        </div>

        {pendingLocalExcelCount > 0 && (
          <div className="p-4 rounded-xl bg-amber-950/35 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-amber-100">
              <strong>{pendingLocalExcelCount} registros estatales</strong> fueron cargados previamente en memoria
              local y aún no están respaldados en Firebase Firestore.
            </div>
            <button
              type="button"
              disabled={isSyncingPending}
              onClick={() => void onSyncPendingToFirebase()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#00FF9D] text-slate-950 hover:bg-[#34FFB2] cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <CloudUpload className="w-4 h-4" />
              {isSyncingPending
                ? 'Sincronizando a Firebase...'
                : `Guardar ${pendingLocalExcelCount} pendientes en Firebase`}
            </button>
          </div>
        )}

        {/* KPIs de Cobertura del Estudio Estatal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#05070A]/85 border border-slate-800/90">
            <div className="text-xs font-mono text-slate-400">MUESTRA ESTATAL ACUMULADA</div>
            <div className="mt-1.5 flex items-baseline gap-2 font-mono tabular-nums">
              <span className="text-2xl font-bold text-[#00F0FF]">
                {totalStudyCaptured.toLocaleString('es-MX')}
              </span>
              <span className="text-xs text-slate-400">/ 3,200 meta (32×100)</span>
            </div>
            <div className="mt-2.5 w-full h-1.5 bg-slate-900 rounded overflow-hidden">
              <div
                className="h-full bg-[#00F0FF] transition-all"
                style={{ width: `${nationalPct}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#05070A]/85 border border-slate-800/90">
            <div className="text-xs font-mono text-slate-400">ESTADOS COMPLETOS (≥100)</div>
            <div className="mt-1.5 flex items-baseline gap-2 font-mono tabular-nums">
              <span className="text-2xl font-bold text-[#00FF9D]">{completedStatesCount}</span>
              <span className="text-xs text-slate-400">de 32 entidades</span>
            </div>
            <div className="mt-2 text-xs text-slate-400">
              {32 - completedStatesCount} entidades pendientes de completar cuota
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#05070A]/85 border border-slate-800/90">
            <div className="text-xs font-mono text-slate-400">BLOQUES EXCEL EN BASE DE DATOS</div>
            <div className="mt-1.5 flex items-baseline gap-2 font-mono tabular-nums">
              <span className="text-2xl font-bold text-slate-50">{stateBatches.length}</span>
              <span className="text-xs text-slate-400">archivos procesados</span>
            </div>
            <div className="mt-2 text-xs text-slate-400">
              Sincronización automática con Dashboard y Explorador
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#05070A]/85 border border-slate-800/90">
            <div className="text-xs font-mono text-slate-400">ESTADO ACTIVO SELECCIONADO</div>
            <div className="mt-1.5 text-lg font-bold text-[#F0ABFC] truncate">
              {selectedEntityMeta.name} ({selectedEntityMeta.short})
            </div>
            <div className="mt-1.5 text-xs font-mono text-slate-400 tabular-nums">
              Avance actual:{' '}
              <span className="text-slate-100 font-semibold">
                {stateProgressList.find((s) => s.name === selectedEntityMeta.name)?.count ?? 0} / 100
              </span>{' '}
              personas
            </div>
          </div>
        </div>
      </section>

      {/* Paso 1 y Paso 2: Selección de Estado, Plantillas Excel e Ingreso de Archivo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Configuración del Bloque Estatal y Plantillas */}
        <section className="lg:col-span-5 ocean-surface rounded-xl p-5 sm:p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <div className="text-xs font-mono text-[#00F0FF]">
                PASO 1 · SELECCIONA ENTIDAD Y FORMATO EXCEL
              </div>
              <h2 className="text-lg font-semibold text-slate-100 mt-1">
                Preparar Bloque de 100 Personas
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Elige el estado que vas a integrar al estudio. Puedes descargar la plantilla oficial en blanco
                (100 filas numeradas + catálogo OCEAN) o un archivo Excel muestra de 100 personas listo para probar.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono text-slate-300">
                Entidad Federativa del Bloque (32 Estados)
              </label>
              <select
                value={selectedState}
                onChange={(e) => {
                  const nextState = e.target.value;
                  setSelectedState(nextState);
                  setExpandedStateName(nextState);
                  if (regionFilter !== 'ALL') {
                    const targetSt = states32.find((s) => s.name === nextState);
                    if (targetSt && targetSt.region !== regionFilter) {
                      setRegionFilter('ALL');
                    }
                  }
                  if (selectedFile && lockRowsToSelectedState) {
                    void processExcelFile(selectedFile, nextState, true);
                  }
                }}
                className="w-full rounded-lg bg-[#05070A] border border-slate-700 px-3 py-2.5 text-sm text-slate-100 neon-focus"
              >
                {states32.map((st) => {
                  const prog = stateProgressList.find((p) => p.code === st.code);
                  return (
                    <option key={st.code} value={st.name}>
                      {st.name} ({st.short}) — {prog?.count ?? 0}/100 reales ({prog?.totalInView ?? 0} en vista)
                    </option>
                  );
                })}
              </select>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setExpandedStateName(selectedEntityMeta.name);
                    if (regionFilter !== 'ALL' && selectedEntityMeta.region !== regionFilter) {
                      setRegionFilter('ALL');
                    }
                    stateMatrixRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="flex-1 inline-flex items-center justify-between px-3 py-2 rounded-lg bg-[#00F0FF]/10 hover:bg-[#00F0FF]/18 border border-[#00F0FF]/35 text-xs font-medium text-[#00F0FF] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span className="inline-flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    Desglosar {selectedEntityMeta.short} (
                    {stateProgressList.find((s) => s.code === selectedEntityMeta.code)?.totalInView ?? 0})
                  </span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {(stateProgressList.find((s) => s.code === selectedEntityMeta.code)?.totalInView ?? 0) >
                  0 && (
                  confirmEmptyStateName === `step1_${selectedEntityMeta.name}` ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-950/70 border border-rose-500/45">
                      <button
                        type="button"
                        disabled={emptyingStateName === selectedEntityMeta.name}
                        onClick={() => void executeEmptyForState(selectedEntityMeta.name)}
                        className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer whitespace-nowrap"
                      >
                        {emptyingStateName === selectedEntityMeta.name
                          ? 'Borrando...'
                          : 'Confirmar Empty'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmEmptyStateName(null)}
                        className="px-2 py-0.5 rounded text-xs text-slate-300 bg-slate-800 cursor-pointer whitespace-nowrap"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={Boolean(emptyingStateName) || isSavingDb}
                      onClick={() => setConfirmEmptyStateName(`step1_${selectedEntityMeta.name}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-xs font-semibold text-rose-300 transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
                      title={`Borrar toda la información de ${selectedEntityMeta.name} para subirla nuevamente`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Empty
                    </button>
                  )
                )}
              </div>
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-lg bg-[#05070A]/80 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={lockRowsToSelectedState}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setLockRowsToSelectedState(checked);
                  if (selectedFile) {
                    void processExcelFile(selectedFile, selectedState, checked);
                  }
                }}
                className="mt-0.5 accent-[#00F0FF]"
              />
              <span className="text-xs text-slate-300 leading-relaxed">
                Asignar todas las filas del archivo cargado al estado de{' '}
                <strong className="text-[#00F0FF]">{selectedEntityMeta.name}</strong> (desmarca si tu
                Excel mezcla varios estados en la columna <code>P2_ENTIDAD</code>).
              </span>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
            <div className="text-xs font-mono text-slate-400">
              DESCARGAR ARCHIVOS EXCEL PARA {selectedEntityMeta.name.toUpperCase()}
            </div>
            <button
              type="button"
              onClick={() => downloadBlankStateTemplateXlsx(selectedEntityMeta.name, 100)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#00F0FF]" />
              Descargar Plantilla Vacía (100 Filas .xlsx)
            </button>

            <button
              type="button"
              onClick={() => downloadSample100StateWorkbookXlsx(selectedEntityMeta.name, 100)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#BD00FF]/20 hover:bg-[#BD00FF]/30 text-[#F0ABFC] border border-[#BD00FF]/45 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#F0ABFC]" />
              Descargar Excel Muestra con 100 Personas ({selectedEntityMeta.short}.xlsx)
            </button>
          </div>
        </section>

        {/* Columna Derecha: Carga de Archivo Excel + Previsualización + Almacenamiento en BD */}
        <section
          ref={uploadSectionRef}
          className="lg:col-span-7 ocean-surface rounded-xl p-5 sm:p-6 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-xs font-mono text-[#00FF9D]">
                PASO 2 · INGRESAR ARCHIVO EXCEL Y ALMACENAR EN FIREBASE
              </div>
              <h2 className="text-lg font-semibold text-slate-100 mt-1">
                Importador Estatal Directo a Firebase (.xlsx / .xls / .csv)
              </h2>
            </div>

            <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoSaveToFirebase}
                onChange={(e) => setAutoSaveToFirebase(e.target.checked)}
                className="accent-[#00FF9D]"
              />
              <span>Auto-guardar en Firebase al subir</span>
            </label>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => void handleDrop(e)}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border-2 border-dashed border-[#00F0FF]/35 hover:border-[#00F0FF]/75 bg-[#05070A]/75 p-6 text-center transition-colors cursor-pointer space-y-2.5"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => void handleFileChange(e)}
              className="hidden"
            />
            <div className="w-11 h-11 rounded-xl bg-[#00F0FF]/12 border border-[#00F0FF]/35 flex items-center justify-center mx-auto">
              <Upload className="w-5 h-5 text-[#00F0FF]" />
            </div>
            <div className="text-sm font-semibold text-slate-100">
              {selectedFile
                ? `Archivo cargado: ${selectedFile.name}`
                : 'Haz clic aquí o arrastra tu archivo Excel (.xlsx, .xls, .csv)'}
            </div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Reconoce automáticamente la plantilla oficial OCEAN-43 o cualquier hoja Excel con columnas como{' '}
              <code>Participante</code>, <code>Edad</code>, <code>Estado</code>, <code>Localidad</code>,{' '}
              <code>Preocupaciones</code>, etc.
            </p>
          </div>

          {(isParsing || (isSavingDb && !parsedPreview)) && (
            <div className="p-4 rounded-xl bg-[#05070A]/95 border border-[#00F0FF]/45 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[#00F0FF]">
                <span>
                  {isSavingDb
                    ? `Almacenando archivo en Firebase Firestore (${savingTargetState || selectedEntityMeta.name})...`
                    : 'Validando estructura de celdas y reglas OCEAN-43 del archivo Excel...'}
                </span>
                {saveProgress && (
                  <span className="tabular-nums text-[#00FF9D] font-bold">
                    {saveProgress.saved} / {saveProgress.total}
                  </span>
                )}
              </div>
              {saveProgress && (
                <div className="w-full h-2 bg-slate-900 rounded overflow-hidden">
                  <div
                    className="h-full bg-[#00FF9D] transition-all"
                    style={{
                      width: `${Math.round((saveProgress.saved / saveProgress.total) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {parseError && (
            <div className="p-4 rounded-lg bg-rose-950/50 border border-rose-500/40 flex items-start gap-2.5 text-xs text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{parseError}</span>
            </div>
          )}

          {parsedPreview && (
            <div className="space-y-4 p-4 rounded-xl bg-[#05070A]/90 border border-[#00FF9D]/35">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#00FF9D]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {parsedPreview.records.length} PERSONAS VALIDADAS · HOJA &ldquo;{parsedPreview.sheetName}&rdquo;
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Estado destino:{' '}
                    <strong className="text-slate-50">
                      {lockRowsToSelectedState ? selectedEntityMeta.name : parsedPreview.detectedState}
                    </strong>
                    {parsedPreview.skippedBlankRows > 0 &&
                      ` · Se omitieron ${parsedPreview.skippedBlankRows} filas en blanco`}
                  </p>
                </div>

                <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#00FF9D]/15 text-[#00FF9D] border border-[#00FF9D]/30 tabular-nums shrink-0">
                  LOTE N = {parsedPreview.records.length}
                </span>
              </div>

              {parsedPreview.warnings.map((w, idx) => (
                <div
                  key={idx}
                  className="text-xs text-amber-200 bg-amber-950/35 border border-amber-500/30 rounded-lg px-3 py-2"
                >
                  {w}
                </div>
              ))}

              {/* Tabla compacta de previsualización de las primeras 6 filas */}
              <div className="overflow-x-auto max-h-52 border border-slate-800/90 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-900/95 sticky top-0 text-[11px] font-mono text-slate-400">
                    <tr>
                      <th className="py-2 px-2.5">#</th>
                      <th className="py-2 px-2.5">Folio</th>
                      <th className="py-2 px-2.5">Participante</th>
                      <th className="py-2 px-2.5">Entidad</th>
                      <th className="py-2 px-2.5">Edad · Loc.</th>
                      <th className="py-2 px-2.5">Urgencia (P12)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {parsedPreview.records.slice(0, 8).map((r, i) => (
                      <tr key={r.id} className="text-slate-200">
                        <td className="py-1.5 px-2.5 font-mono text-slate-400 tabular-nums">
                          {i + 1}
                        </td>
                        <td className="py-1.5 px-2.5 font-mono text-[#00F0FF] whitespace-nowrap">
                          {r.folio}
                        </td>
                        <td className="py-1.5 px-2.5 whitespace-nowrap">
                          {r.registroCampo?.participanteAlias || 'Anónima'}
                        </td>
                        <td className="py-1.5 px-2.5 whitespace-nowrap">{r.p2_entidad}</td>
                        <td className="py-1.5 px-2.5 font-mono whitespace-nowrap">
                          {r.p1_edad} · {r.p3_localidad}
                        </td>
                        <td className="py-1.5 px-2.5 max-w-[200px] truncate">
                          {r.p12_mas_urgente}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedPreview.records.length > 8 && (
                <div className="text-[11px] font-mono text-slate-400">
                  Mostrando las primeras 8 de {parsedPreview.records.length} filas listas para insertar.
                </div>
              )}

              {isSavingDb && saveProgress && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono text-[#00F0FF]">
                    <span>Almacenando registros en Base de Datos Firestore...</span>
                    <span className="tabular-nums">
                      {saveProgress.saved} / {saveProgress.total}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded overflow-hidden">
                    <div
                      className="h-full bg-[#00FF9D] transition-all"
                      style={{
                        width: `${Math.round((saveProgress.saved / saveProgress.total) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  disabled={isSavingDb}
                  onClick={() => void handleSaveBatchToDatabase()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#00FF9D] text-slate-950 hover:bg-[#34FFB2] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <CloudUpload className="w-4 h-4" />
                  {userEmail
                    ? `Almacenar ${parsedPreview.records.length} Personas en Firebase Firestore`
                    : `Conectar Google y Guardar ${parsedPreview.records.length} Personas en Firebase`}
                </button>

                <button
                  type="button"
                  disabled={isSavingDb}
                  onClick={() => {
                    onLocalFallbackInject(parsedPreview.records);
                    setParsedPreview(null);
                    setSelectedFile(null);
                  }}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-400 hover:text-slate-200 bg-slate-900/70 hover:bg-slate-800 border border-slate-800 cursor-pointer disabled:opacity-50"
                >
                  Vista previa sin BD
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Mapa / Matriz de Avance del Estudio por Estado con Desglose Directo Debajo del Estado */}
      <section
        ref={stateMatrixRef}
        className="ocean-surface rounded-xl p-5 sm:p-6 space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div>
            <div className="text-xs font-mono text-[#00F0FF]">
              MATRIZ DE COBERTURA ESTATAL · CLIC EN CUALQUIER ESTADO PARA DESGLOSAR SUS ENCUESTADOS DEBAJO
            </div>
            <h2 className="text-lg font-semibold text-slate-100 mt-0.5">
              Avance del Estudio en las 32 Entidades Federativas
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(['ALL', 'Norte', 'Bajío-Occidente', 'Centro-ZMVM', 'Sur-Sureste'] as const).map(
              (reg) => (
                <button
                  key={reg}
                  type="button"
                  onClick={() => setRegionFilter(reg)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                    regionFilter === reg
                      ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40'
                      : 'bg-[#05070A] text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {reg === 'ALL' ? 'Todas (32)' : reg}
                </button>
              )
            )}
          </div>
        </div>

        {/* Input oculto para subir archivo directamente desde cualquier tarjeta estatal */}
        <input
          ref={directStateInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              void handleDirectStateFileUpload(directTargetStateRef.current, f);
            }
            e.target.value = '';
          }}
          className="hidden"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 grid-flow-row-dense gap-3">
          {filteredStateProgress.map((st) => {
            const isSelected = st.name === selectedState;
            const isExpanded = expandedStateName === st.name;

            return (
              <React.Fragment key={st.code}>
                <div
                  onClick={() => {
                    setSelectedState(st.name);
                    setExpandedStateName((prev) => (prev === st.name ? null : st.name));
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isExpanded
                      ? 'bg-[#00F0FF]/14 border-[#00F0FF] glow-cyan'
                      : isSelected
                      ? 'bg-[#00F0FF]/8 border-[#00F0FF]/50'
                      : 'bg-[#05070A]/80 border-slate-800/90 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-100 truncate">
                      {st.name}
                    </span>
                    <span
                      className={`text-[11px] font-mono tabular-nums shrink-0 ${
                        st.isComplete
                          ? 'text-[#00FF9D] font-semibold'
                          : st.count > 0
                          ? 'text-[#00F0FF] font-semibold'
                          : 'text-slate-500'
                      }`}
                    >
                      {st.count}/100
                    </span>
                  </div>

                  <div className="mt-2 w-full h-1.5 bg-slate-900 rounded overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        st.isComplete ? 'bg-[#00FF9D]' : 'bg-[#00F0FF]'
                      }`}
                      style={{ width: `${st.pct}%` }}
                    />
                  </div>

                  <div className="mt-2.5 flex items-center justify-between gap-1.5 text-[11px] font-mono">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isSavingDb || emptyingStateName === st.name}
                        onClick={(e) => {
                          e.stopPropagation();
                          directTargetStateRef.current = st.name;
                          setSelectedState(st.name);
                          directStateInputRef.current?.click();
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#00FF9D]/15 hover:bg-[#00FF9D]/25 text-[#00FF9D] border border-[#00FF9D]/30 font-semibold cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
                        title={`Subir archivo Excel de ${st.name} a Firebase`}
                      >
                        <CloudUpload className="w-3 h-3" />
                        {st.firebaseCount > 0 ? `Firebase (${st.firebaseCount})` : 'Subir'}
                      </button>

                      {(st.totalInView > 0 || st.firebaseCount > 0) && (
                        confirmEmptyStateName === st.name ? (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1"
                          >
                            <button
                              type="button"
                              disabled={emptyingStateName === st.name}
                              onClick={() => void executeEmptyForState(st.name)}
                              className="px-1.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold cursor-pointer whitespace-nowrap"
                            >
                              {emptyingStateName === st.name ? '...' : 'Confirmar'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmEmptyStateName(null)}
                              className="px-1.5 py-1 rounded bg-slate-800 text-slate-300 cursor-pointer"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={Boolean(emptyingStateName) || isSavingDb}
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmEmptyStateName(st.name);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/35 font-semibold cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
                            title={`Borrar información de ${st.name} para subirla nuevamente`}
                          >
                            <Trash2 className="w-3 h-3" />
                            Empty
                          </button>
                        )
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 whitespace-nowrap ${
                        isExpanded ? 'text-[#00FF9D] font-semibold' : 'text-[#00F0FF]'
                      }`}
                    >
                      {isExpanded ? (
                        <>
                          Ocultar ({st.totalInView})
                          <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          Ver ({st.totalInView})
                          <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="col-span-full my-1">
                    <StateRespondentsBreakdown
                      stateName={st.name}
                      stateShortCode={st.short}
                      records={allRecords}
                      onClose={() => setExpandedStateName(null)}
                      onDownloadSampleForState={(name) =>
                        downloadSample100StateWorkbookXlsx(name, 100)
                      }
                      onUploadExcelFileForState={(name, file) =>
                        handleDirectStateFileUpload(name, file)
                      }
                      isUploadingForState={isSavingDb && savingTargetState === st.name}
                      onEmptyStateData={(name) => executeEmptyForState(name)}
                      isEmptyingState={emptyingStateName === st.name}
                      onTriggerUploadForState={(name) => {
                        directTargetStateRef.current = name;
                        setSelectedState(name);
                        directStateInputRef.current?.click();
                      }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </section>

      {/* Historial de Bloques Excel Almacenados en Base de Datos */}
      <section className="ocean-surface rounded-xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-[#00FF9D]" />
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                Bloques Estatales Almacenados en Base de Datos ({stateBatches.length})
              </h2>
              <p className="text-xs text-slate-400">
                Registro auditable de todos los archivos Excel ingresados y persistidos en Firestore.
              </p>
            </div>
          </div>

          {studySourceRecords.length > 0 && (
            <button
              type="button"
              onClick={() =>
                exportRecordsToExcelXlsx(
                  studySourceRecords,
                  `Estudio_Nacional_OCEAN_${studySourceRecords.length}_Personas.xlsx`
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#00F0FF] text-slate-950 hover:bg-[#38F5FF] cursor-pointer whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Exportar Estudio Consolidado (.xlsx)
            </button>
          )}
        </div>

        {!userEmail ? (
          <div className="py-8 text-center space-y-3">
            <p className="text-sm text-slate-300">
              Conecta tu cuenta de Google para consultar, respaldar y administrar tus bloques estatales de 100
              personas en la base de datos.
            </p>
            <button
              type="button"
              onClick={() => void onSignInGoogle()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#00F0FF] text-slate-950 hover:bg-[#38F5FF] cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Iniciar sesión con Google
            </button>
          </div>
        ) : stateBatches.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            Aún no hay bloques Excel guardados en la base de datos. Descarga el Excel Muestra de 100 personas
            arriba o sube tu primer archivo estatal para comenzar el estudio.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 font-mono text-slate-400">
                  <th className="py-2.5 px-3">Código de Bloque</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3">Archivo Ingresado</th>
                  <th className="py-2.5 px-3">Personas</th>
                  <th className="py-2.5 px-3">Fecha de Registro</th>
                  <th className="py-2.5 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {stateBatches.map((batch) => {
                  const batchRecords = dbRecords.filter((r) => r.batchId === batch.id);
                  const isConfirming = confirmDeleteBatchId === batch.id;
                  const isDeleting = deletingBatchId === batch.id;
                  return (
                    <tr key={batch.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-mono font-semibold text-[#00FF9D] whitespace-nowrap">
                        {batch.batchCode}
                      </td>
                      <td className="py-3 px-3 text-slate-100 font-medium whitespace-nowrap">
                        {batch.entidad}
                      </td>
                      <td className="py-3 px-3 text-slate-300 max-w-xs truncate">
                        {batch.fileName}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-[#00F0FF] whitespace-nowrap">
                        {batch.recordsCount} / {batch.targetQuota}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                        {new Date(batch.createdAtIso).toLocaleString('es-MX')}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onInspectEntityInExplorer(batch.entidad)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#00F0FF]" />
                            Auditar
                          </button>

                          {batchRecords.length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                exportRecordsToExcelXlsx(
                                  batchRecords,
                                  `${batch.batchCode}_${batch.entidad}.xlsx`
                                )
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-[#00FF9D]" />
                              .xlsx
                            </button>
                          )}

                          {isConfirming ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => void handleDeleteBatch(batch)}
                                className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold cursor-pointer disabled:opacity-50"
                              >
                                {isDeleting ? 'Borrando...' : 'Confirmar'}
                              </button>
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setConfirmDeleteBatchId(null)}
                                className="px-2 py-1 rounded bg-slate-800 text-slate-300 cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteBatchId(batch.id)}
                              className="p-1.5 rounded bg-slate-900 hover:bg-rose-950/70 text-slate-400 hover:text-rose-300 cursor-pointer"
                              title="Eliminar bloque de la base de datos"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
