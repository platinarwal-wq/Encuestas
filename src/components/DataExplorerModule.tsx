import React, { useMemo, useState } from 'react';
import { AGE_RANGES, LOCALITY_TYPES, MEXICO_ENTITIES } from '../data/orusCatalogs';
import {
  analyzeOpenEndedNarratives,
  exportDatasetToCSV,
  exportDatasetToJSON,
} from '../engine/analyticsEngine';
import { exportRecordsToExcelXlsx } from '../engine/excelStateProcessor';
import { AgeRange, LocalityType, OrusResponse, RecordOrigin } from '../types/orus';
import {
  Download,
  Eye,
  FileJson,
  FileSpreadsheet,
  Search,
  X,
  RotateCcw,
} from 'lucide-react';

interface DataExplorerModuleProps {
  records: OrusResponse[];
  initialEntityFilter: string;
  onClearEntityFilter: () => void;
  onResetToSeed: () => void;
}

export const DataExplorerModule: React.FC<DataExplorerModuleProps> = ({
  records,
  initialEntityFilter,
  onClearEntityFilter,
  onResetToSeed,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [originFilter, setOriginFilter] = useState<'ALL' | RecordOrigin>('ALL');
  const [entityFilter, setEntityFilter] = useState<string>(initialEntityFilter || 'ALL');
  const [ageFilter, setAgeFilter] = useState<'ALL' | AgeRange>('ALL');
  const [localityFilter, setLocalityFilter] = useState<'ALL' | LocalityType>('ALL');
  const [somosFilter, setSomosFilter] = useState<'ALL' | 'Sí' | 'No' | 'No estoy segura'>('ALL');
  const [activeSubView, setActiveSubView] = useState<'TABLE' | 'SEMANTIC'>('TABLE');
  const [inspectedRecord, setInspectedRecord] = useState<OrusResponse | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Sincronizar si viene entidad desde el mapa del Dashboard
  React.useEffect(() => {
    if (initialEntityFilter) {
      setEntityFilter(initialEntityFilter);
      setCurrentPage(1);
    }
  }, [initialEntityFilter]);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter((r) => {
      if (originFilter !== 'ALL' && r.origin !== originFilter) return false;
      if (entityFilter !== 'ALL' && r.p2_entidad !== entityFilter) return false;
      if (ageFilter !== 'ALL' && r.p1_edad !== ageFilter) return false;
      if (localityFilter !== 'ALL' && r.p3_localidad !== localityFilter) return false;
      if (somosFilter !== 'ALL' && r.p34_conoce_somos !== somosFilter) return false;
      if (q) {
        const hay = `${r.folio} ${r.p2_entidad} ${r.p12_mas_urgente} ${r.p7_significado_mujer} ${r.p33_apoyo_concreto_cambio}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [records, originFilter, entityFilter, ageFilter, localityFilter, somosFilter, searchQuery]);

  const semanticData = useMemo(
    () => analyzeOpenEndedNarratives(filteredRecords),
    [filteredRecords]
  );

  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, totalPages]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setOriginFilter('ALL');
    setEntityFilter('ALL');
    setAgeFilter('ALL');
    setLocalityFilter('ALL');
    setSomosFilter('ALL');
    setCurrentPage(1);
    onClearEntityFilter();
  };

  return (
    <div className="space-y-6">
      {/* Cabecera de Auditoría y Exportación */}
      <section className="ocean-surface rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="text-[#00F0FF]">[AUDIT_REPOSITORY_ONLINE]</span>
              <span aria-hidden="true">·</span>
              <span>
                MOSTRANDO {filteredRecords.length} DE {records.length} REGISTROS OCEAN-43
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-semibold text-slate-50">
              Explorador de Datos, Análisis Semántico y Exportación
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onResetToSeed}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 cursor-pointer whitespace-nowrap shrink-0"
              title="Restaurar los N=120 registros semilla iniciales"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              Restaurar Semilla (N=120)
            </button>
            <button
              type="button"
              onClick={() => exportRecordsToExcelXlsx(filteredRecords)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#00FF9D] text-slate-950 hover:bg-[#34FFB2] cursor-pointer whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Exportar Excel .xlsx ({filteredRecords.length})
            </button>
            <button
              type="button"
              onClick={() => exportDatasetToCSV(filteredRecords)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-[#00FF9D]" />
              CSV ({filteredRecords.length})
            </button>
            <button
              type="button"
              onClick={() => exportDatasetToJSON(filteredRecords)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#00F0FF] text-slate-950 hover:bg-[#38F5FF] cursor-pointer whitespace-nowrap shrink-0"
            >
              <FileJson className="w-3.5 h-3.5" />
              JSON ({filteredRecords.length})
            </button>
          </div>
        </div>

        {/* Selector de Subvista + Barra de Búsqueda y Filtros */}
        <div className="pt-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#05070A] border border-slate-800 w-fit">
              <button
                type="button"
                onClick={() => setActiveSubView('TABLE')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeSubView === 'TABLE'
                    ? 'bg-[#00F0FF]/20 text-[#00F0FF] font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tabla de Folios e Inspección (43 Ítems)
              </button>
              <button
                type="button"
                onClick={() => setActiveSubView('SEMANTIC')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeSubView === 'SEMANTIC'
                    ? 'bg-[#BD00FF]/25 text-[#F0ABFC] font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Análisis Semántico de Respuestas Abiertas (P7–P10, P33, P39, P43)
              </button>
            </div>

            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Buscar por folio, estado, narrativa o preocupación..."
                className="w-full rounded-lg bg-[#05070A] border border-slate-800 pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 neon-focus"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <select
              value={originFilter}
              onChange={(e) => {
                setOriginFilter(e.target.value as 'ALL' | RecordOrigin);
                setCurrentPage(1);
              }}
              className="rounded-lg bg-[#05070A] border border-slate-800 px-2.5 py-2 text-xs text-slate-200"
            >
              <option value="ALL">Origen: Todos</option>
              <option value="REAL">Solo Encuestas Reales</option>
              <option value="SYNTHETIC">Solo Encuestas Analizadas</option>
            </select>

            <select
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg bg-[#05070A] border border-slate-800 px-2.5 py-2 text-xs text-slate-200"
            >
              <option value="ALL">Entidad: Todas (33)</option>
              {MEXICO_ENTITIES.map((ent) => (
                <option key={ent.code} value={ent.name}>
                  {ent.name}
                </option>
              ))}
            </select>

            <select
              value={ageFilter}
              onChange={(e) => {
                setAgeFilter(e.target.value as 'ALL' | AgeRange);
                setCurrentPage(1);
              }}
              className="rounded-lg bg-[#05070A] border border-slate-800 px-2.5 py-2 text-xs text-slate-200"
            >
              <option value="ALL">Edad: Todas</option>
              {AGE_RANGES.map((a) => (
                <option key={a} value={a}>
                  {a} años
                </option>
              ))}
            </select>

            <select
              value={localityFilter}
              onChange={(e) => {
                setLocalityFilter(e.target.value as 'ALL' | LocalityType);
                setCurrentPage(1);
              }}
              className="rounded-lg bg-[#05070A] border border-slate-800 px-2.5 py-2 text-xs text-slate-200"
            >
              <option value="ALL">Localidad: Todas</option>
              {LOCALITY_TYPES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>

            <select
              value={somosFilter}
              onChange={(e) => {
                setSomosFilter(e.target.value as 'ALL' | 'Sí' | 'No' | 'No estoy segura');
                setCurrentPage(1);
              }}
              className="rounded-lg bg-[#05070A] border border-slate-800 px-2.5 py-2 text-xs text-slate-200"
            >
              <option value="ALL">Conoce Somos (P34): Todos</option>
              <option value="Sí">Sí conoce Somos</option>
              <option value="No">No (Salto a P40)</option>
              <option value="No estoy segura">No estoy segura (Salto a P40)</option>
            </select>

            <button
              type="button"
              onClick={clearAllFilters}
              className="rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-2 text-xs font-medium text-slate-300 cursor-pointer whitespace-nowrap"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </section>

      {activeSubView === 'TABLE' ? (
        <section className="ocean-surface rounded-xl p-5">
          {paginatedRecords.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm text-slate-300">
                No se encontraron encuestas que coincidan con los criterios de filtrado actuales.
              </p>
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#00F0FF] text-slate-950 cursor-pointer"
              >
                Mostrar todos los registros
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-mono text-slate-400">
                      <th className="py-2.5 px-3">Folio</th>
                      <th className="py-2.5 px-3">Origen</th>
                      <th className="py-2.5 px-3">Entidad (P2)</th>
                      <th className="py-2.5 px-3">Edad · Loc.</th>
                      <th className="py-2.5 px-3">Urgencia Principal (P12)</th>
                      <th className="py-2.5 px-3">Somos (P34 / P37)</th>
                      <th className="py-2.5 px-3 text-right">Inspección</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {paginatedRecords.map((rec) => (
                      <tr
                        key={rec.id}
                        onClick={() => setInspectedRecord(rec)}
                        className="hover:bg-slate-800/45 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-3 font-mono font-semibold text-[#00F0FF] whitespace-nowrap">
                          {rec.folio.replace(/^ORUS-/i, 'OCEAN-')}
                        </td>
                        <td className="py-3 px-3 font-mono whitespace-nowrap">
                          <span
                            className={
                              rec.origin === 'REAL' ? 'text-[#00FF9D]' : 'text-slate-300'
                            }
                          >
                            {rec.origin === 'REAL' ? 'CAMPO REAL' : 'ANALIZADA'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-100 whitespace-nowrap">
                          {rec.p2_entidad}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                          {rec.p1_edad} · {rec.p3_localidad}
                        </td>
                        <td className="py-3 px-3 text-slate-200 max-w-xs truncate">
                          {rec.p12_mas_urgente}
                        </td>
                        <td className="py-3 px-3 font-mono tabular-nums whitespace-nowrap">
                          {rec.p34_conoce_somos === 'Sí' ? (
                            <span className="text-[#00FF9D]">
                              Sí · Cercanía {rec.p37_cercania_somos}/5
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              {rec.p34_conoce_somos} (→P40)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInspectedRecord(rec);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#00F0FF]" />
                            Auditar 43 ítems
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <div className="pt-4 mt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>
                  Página {currentPage} de {totalPages} · Total filtrado: {filteredRecords.length}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded border border-slate-800 bg-[#05070A] text-slate-200 disabled:opacity-40 cursor-pointer"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded border border-slate-800 bg-[#05070A] text-slate-200 disabled:opacity-40 cursor-pointer"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      ) : (
        /* Vista de Análisis Semántico de Respuestas Abiertas (P7-P10, P33, P39, P43) */
        <div className="space-y-6">
          {/* Matriz de Conceptos Clave */}
          <section className="ocean-surface rounded-xl p-6">
            <div className="pb-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">
                  Mapa de Conceptos Clave en Narrativas Abiertas (P7–P10 · P33 · P39 · P43)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Frecuencia léxica extraída dinámicamente sobre los {filteredRecords.length} cuestionarios activos.
                </p>
              </div>
              <span className="text-xs font-mono text-[#00F0FF]">
                PROCESAMIENTO SEMÁNTICO LOCAL
              </span>
            </div>

            <div className="pt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {semanticData.keywords.map((kw) => {
                const colorText =
                  kw.category === 'CUIDADOS'
                    ? 'text-[#F0ABFC]'
                    : kw.category === 'SEGURIDAD'
                    ? 'text-[#00F0FF]'
                    : kw.category === 'POLÍTICA'
                    ? 'text-[#00FF9D]'
                    : 'text-slate-100';
                return (
                  <div
                    key={kw.term}
                    className="p-3.5 rounded-lg bg-[#05070A]/85 border border-slate-800 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>{kw.category}</span>
                      <span className="tabular-nums text-slate-200">n={kw.count}</span>
                    </div>
                    <div className={`mt-1.5 text-sm font-semibold ${colorText}`}>
                      {kw.term}
                    </div>
                    <div className="mt-2 w-full h-1 bg-slate-900 rounded overflow-hidden">
                      <div
                        className="h-full bg-[#00F0FF]"
                        style={{ width: `${Math.round(kw.weight * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Agrupación Automática de Narrativas Recurrentes */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {semanticData.clusters.map((cluster) => (
              <div key={cluster.id} className="ocean-surface rounded-xl p-6 space-y-4">
                <div className="pb-3 border-b border-slate-800/80 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-100">{cluster.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{cluster.description}</p>
                  </div>
                  <div className="text-right font-mono tabular-nums shrink-0">
                    <div className="text-xl font-bold text-[#00FF9D]">{cluster.pct}%</div>
                    <div className="text-[11px] text-slate-400">{cluster.count} folios</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-mono text-slate-400">
                    Testimonios representativos en corpus:
                  </div>
                  {cluster.sampleQuotes.map((q) => (
                    <div
                      key={`${cluster.id}-${q.folio}`}
                      className="p-3 rounded-lg bg-[#05070A]/80 border border-slate-800/90 space-y-1.5"
                    >
                      <p className="text-xs text-slate-200 leading-relaxed">
                        &ldquo;{q.text}&rdquo;
                      </p>
                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                        <span className="text-[#00F0FF]">{q.folio}</span>
                        <span aria-hidden="true">·</span>
                        <span>{q.entidad}</span>
                        <span aria-hidden="true">·</span>
                        <span>{q.edad} años</span>
                        <span aria-hidden="true">·</span>
                        <span>Reactivo {q.field}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </div>
      )}

      {/* Inspector Modal de Folio Individual (43 ítems íntegros) */}
      {inspectedRecord && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setInspectedRecord(null)}
        >
          <div
            className="w-full max-w-4xl max-h-[88vh] overflow-y-auto ocean-surface rounded-xl p-6 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="text-xs font-mono text-[#00F0FF]">
                  AUDITORÍA INDIVIDUAL DE EXPEDIENTE · {inspectedRecord.origin === 'REAL' ? 'ENCUESTA DE CAMPO' : 'ENCUESTA ANALIZADA OCEAN'}
                </div>
                <h2 className="text-xl font-bold font-mono text-slate-50 mt-1">
                  {inspectedRecord.folio.replace(/^ORUS-/i, 'OCEAN-')}
                </h2>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  {inspectedRecord.p2_entidad}
                  {inspectedRecord.registroCampo?.municipioColonia
                    ? ` (${inspectedRecord.registroCampo.municipioColonia})`
                    : ''}{' '}
                  · {inspectedRecord.p3_localidad} · {inspectedRecord.p1_edad} años · Captura:{' '}
                  {new Date(inspectedRecord.createdAt).toLocaleString('es-MX')}
                </p>
                {inspectedRecord.registroCampo && (
                  <p className="text-xs font-mono text-[#00FF9D] mt-1">
                    Participante: {inspectedRecord.registroCampo.participanteAlias || 'Anónima'} ·
                    Modalidad: {inspectedRecord.registroCampo.modalidad}
                    {inspectedRecord.registroCampo.encuestadoraClave
                      ? ` · Encuestadora: ${inspectedRecord.registroCampo.encuestadoraClave}`
                      : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    exportDatasetToJSON([inspectedRecord], `${inspectedRecord.folio}.json`)
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#00F0FF]" />
                  JSON Folio
                </button>
                <button
                  type="button"
                  onClick={() => setInspectedRecord(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bloques A, B, C */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-2.5">
                <h3 className="font-mono text-[#00F0FF] font-semibold">
                  BLOQUE A · PERFIL Y CUIDADOS (P1–P6)
                </h3>
                <p className="text-slate-300">
                  <strong>P1–P3:</strong> {inspectedRecord.p1_edad} años · {inspectedRecord.p2_entidad} ({inspectedRecord.p3_localidad})
                </p>
                <p className="text-slate-300">
                  <strong>P4 Actividades:</strong> {inspectedRecord.p4_actividades.join(', ')}
                </p>
                <p className="text-slate-300">
                  <strong>P5 Principal:</strong> {inspectedRecord.p5_actividad_principal}
                </p>
                <p className="text-slate-300">
                  <strong>P6 Cuidados:</strong> {inspectedRecord.p6_cuidados.join(', ')}
                </p>
              </div>

              <div className="space-y-2.5">
                <h3 className="font-mono text-[#00F0FF] font-semibold">
                  BLOQUE B · EXPERIENCIAS ABIERTAS (P7–P10)
                </h3>
                <p className="text-slate-300">
                  <strong>P7 Significado:</strong> {inspectedRecord.p7_significado_mujer}
                </p>
                <p className="text-slate-300">
                  <strong>P8 Orgullo:</strong> {inspectedRecord.p8_orgullo_fortaleza}
                </p>
                <p className="text-slate-300">
                  <strong>P9 Obstáculo:</strong> {inspectedRecord.p9_obstaculo_principal}
                </p>
                <p className="text-slate-300">
                  <strong>P10 Futuro niñas/jóvenes:</strong> {inspectedRecord.p10_cambio_futuro_jovenes}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-2.5">
                <h3 className="font-mono text-[#00F0FF] font-semibold">
                  BLOQUE C · PREOCUPACIONES Y ENTORNO (P11–P16)
                </h3>
                <p className="text-slate-300">
                  <strong>P11 Top 3:</strong> {inspectedRecord.p11_preocupaciones_top3.join(' | ')}
                </p>
                <p className="text-slate-300">
                  <strong>P12 Más urgente:</strong> {inspectedRecord.p12_mas_urgente} —{' '}
                  <em className="text-slate-400">{inspectedRecord.p12_justificacion}</em>
                </p>
                <p className="text-slate-300">
                  <strong>P13 Problema local ({inspectedRecord.p13_problema_local_desatendido}):</strong>{' '}
                  {inspectedRecord.p13_detalle || 'N/A'}
                </p>
                <p className="text-slate-300">
                  <strong>P14 Espacios:</strong> {inspectedRecord.p14_espacios_conversacion.join(', ')}
                </p>
                <p className="text-slate-300">
                  <strong>P15 Entorno mujeres:</strong> {inspectedRecord.p15_preocupacion_entorno_mujeres}
                </p>
                <p className="text-slate-300">
                  <strong>P16 Otros contextos ({inspectedRecord.p16_conoce_contextos_distintos}):</strong>{' '}
                  {inspectedRecord.p16_detalle || 'N/A'}
                </p>
              </div>

              <div className="space-y-2.5">
                <h3 className="font-mono text-[#00F0FF] font-semibold">
                  BLOQUE D · INSTITUCIONES Y PARTICIPACIÓN (P17–P25)
                </h3>
                <p className="text-slate-300">
                  <strong>P17 Atención institucional:</strong>{' '}
                  {inspectedRecord.p17_busco_atencion_institucional}{' '}
                  {inspectedRecord.p17_busco_atencion_institucional === 'No' &&
                    '(Salto P18 activo)'}
                </p>
                <p className="text-slate-300">
                  <strong>P19 Confianza Partidos / OSC:</strong>{' '}
                  {inspectedRecord.p19_confianza_institucional['Partidos políticos']} /{' '}
                  {
                    inspectedRecord.p19_confianza_institucional[
                      'Organizaciones de la sociedad civil y colectivos ciudadanos'
                    ]
                  }
                </p>
                <p className="text-slate-300">
                  <strong>P21 Frecuencia:</strong> {inspectedRecord.p21_frecuencia_participacion}
                </p>
                <p className="text-slate-300">
                  <strong>P22 Barreras:</strong>{' '}
                  {inspectedRecord.p22_dificultades_participacion.join(' | ')}
                </p>
                <p className="text-slate-300">
                  <strong>P23 Habilitadores:</strong>{' '}
                  {inspectedRecord.p23_condiciones_habilitadoras.join(' | ')}
                </p>
                <p className="text-slate-300">
                  <strong>P25 Violencia política:</strong> {inspectedRecord.p25_violencia_politica}{' '}
                  {inspectedRecord.p25_detalle ? `— ${inspectedRecord.p25_detalle}` : ''}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-2.5">
                <h3 className="font-mono text-[#E879F9] font-semibold">
                  BLOQUE E · OPORTUNIDADES, CUIDADOS Y AUTONOMÍA (P26–P33)
                </h3>
                <p className="text-slate-300">
                  <strong>P27 Desventajas:</strong>{' '}
                  {inspectedRecord.p27_ambitos_desventaja.join(', ')}
                </p>
                <p className="text-slate-300">
                  <strong>P28 Sexismo vivido:</strong>{' '}
                  {inspectedRecord.p28_situaciones_sexismo.join(', ')}
                </p>
                <p className="text-slate-300">
                  <strong>P30 Abandono por temor:</strong> {inspectedRecord.p30_abandono_por_temor}
                </p>
                <p className="text-slate-300">
                  <strong>P32 Rutas de apoyo:</strong>{' '}
                  {inspectedRecord.p32_conocimiento_rutas_apoyo}
                </p>
                <p className="text-slate-300">
                  <strong>P33 Cambio concreto prioritario:</strong>{' '}
                  {inspectedRecord.p33_apoyo_concreto_cambio}
                </p>
              </div>

              <div className="space-y-2.5">
                <h3 className="font-mono text-[#00FF9D] font-semibold">
                  BLOQUE F · PERCEPCIÓN DE SOMOS Y PARTIDOS (P34–P43)
                </h3>
                <p className="text-slate-300">
                  <strong>P34 Conoce &ldquo;Somos&rdquo;:</strong> {inspectedRecord.p34_conoce_somos}
                </p>
                {inspectedRecord.p34_conoce_somos === 'Sí' ? (
                  <>
                    <p className="text-slate-300">
                      <strong>P35–P37 Somos:</strong> {inspectedRecord.p35_nivel_conocimiento_somos}{' '}
                      · Opinión: {inspectedRecord.p36_opinion_somos} · Cercanía:{' '}
                      {inspectedRecord.p37_cercania_somos}/5
                    </p>
                    <p className="text-slate-300">
                      <strong>P38 Propuesta ({inspectedRecord.p38_recuerda_propuesta_somos}):</strong>{' '}
                      {inspectedRecord.p38_detalle || 'Sin especificar'}
                    </p>
                    <p className="text-slate-300">
                      <strong>P39 (+ / -):</strong> {inspectedRecord.p39_positivos_somos} //{' '}
                      {inspectedRecord.p39_criticas_somos}
                    </p>
                  </>
                ) : (
                  <p className="font-mono text-[#00F0FF]">
                    [SALTO LÓGICO P34 → P40 APLICADO EN P35–P39]
                  </p>
                )}
                <p className="text-slate-300">
                  <strong>P40–P41 Otros partidos:</strong>{' '}
                  {inspectedRecord.p41_evaluacion_otros_partidos
                    .map((ev) => `${ev.partido} (${ev.opinion}, ${ev.cercania}/5)`)
                    .join(' · ')}
                </p>
                <p className="text-slate-300">
                  <strong>P42 Cambio 6m:</strong> {inspectedRecord.p42_cambio_opinion_6meses}{' '}
                  {inspectedRecord.p42_motivo ? `— ${inspectedRecord.p42_motivo}` : ''}
                </p>
                <p className="text-slate-300">
                  <strong>P43 Escucha social ({inspectedRecord.p43_escucha_social_partidos}):</strong>{' '}
                  {inspectedRecord.p43_relato || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
