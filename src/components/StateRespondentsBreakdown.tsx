import React, { useMemo, useState } from 'react';
import { exportRecordsToExcelXlsx } from '../engine/excelStateProcessor';
import { OrusResponse, RecordOrigin } from '../types/orus';
import { getRespondentDisplayProfile } from '../utils/respondentProfileHelper';
import {
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  Search,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';

interface StateRespondentsBreakdownProps {
  stateName: string;
  stateShortCode?: string;
  records: OrusResponse[];
  onClose?: () => void;
  onDownloadSampleForState?: (stateName: string) => void;
  onTriggerUploadForState?: (stateName: string) => void;
}

export const StateRespondentsBreakdown: React.FC<StateRespondentsBreakdownProps> = ({
  stateName,
  stateShortCode,
  records,
  onClose,
  onDownloadSampleForState,
  onTriggerUploadForState,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [originFilter, setOriginFilter] = useState<'ALL' | RecordOrigin>('ALL');
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const stateRecords = useMemo(
    () => records.filter((r) => r.p2_entidad === stateName),
    [records, stateName]
  );

  const realCount = useMemo(
    () => stateRecords.filter((r) => r.origin === 'REAL').length,
    [stateRecords]
  );
  const synthCount = stateRecords.length - realCount;

  const filteredRecords = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return stateRecords.filter((rec) => {
      if (originFilter !== 'ALL' && rec.origin !== originFilter) return false;
      if (q) {
        const prof = getRespondentDisplayProfile(rec);
        const haystack = `${prof.nombre} ${prof.municipio} ${rec.folio} ${rec.p1_edad} ${rec.p3_localidad} ${rec.p5_actividad_principal} ${rec.p12_mas_urgente} ${rec.p34_conoce_somos}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [stateRecords, originFilter, searchTerm]);

  const pageSize = 100;
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const visibleRecords = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, safePage]);

  return (
    <div className="rounded-xl bg-[#05070A]/95 border border-[#00F0FF]/35 p-4 sm:p-5 space-y-4">
      {/* Cabecera del Desglose Estatal */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-slate-800/90">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
            <span className="text-[#00F0FF] font-semibold">
              DESGLOSE NOMINAL · {stateName.toUpperCase()}
              {stateShortCode ? ` (${stateShortCode})` : ''}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums text-slate-200">
              {stateRecords.length} personas registradas
            </span>
            {realCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums text-[#00FF9D]">
                  {realCount} reales / Excel
                </span>
              </>
            )}
            {synthCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums text-slate-400">
                  {synthCount} analizadas
                </span>
              </>
            )}
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-50 mt-1">
            Padrón y Respuestas de Encuestados en {stateName}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {filteredRecords.length > 0 && (
            <button
              type="button"
              onClick={() =>
                exportRecordsToExcelXlsx(
                  filteredRecords,
                  `Desglose_${stateShortCode || stateName}_${filteredRecords.length}_Encuestados.xlsx`
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#00FF9D] text-slate-950 hover:bg-[#34FFB2] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Descargar Excel de {stateName} ({filteredRecords.length})
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 cursor-pointer whitespace-nowrap shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              Cerrar desglose
            </button>
          )}
        </div>
      </div>

      {stateRecords.length === 0 ? (
        <div className="py-8 px-4 text-center space-y-3 rounded-lg bg-[#0B0F17]/70 border border-slate-800/80">
          <p className="text-sm text-slate-200 font-medium">
            Aún no hay personas registradas en {stateName} dentro de esta vista.
          </p>
          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            Puedes subir el archivo Excel de 100 personas correspondiente a {stateName} o descargar un archivo
            muestra listo con 100 registros para probar el estudio estatal.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            {onTriggerUploadForState && (
              <button
                type="button"
                onClick={() => onTriggerUploadForState(stateName)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#00F0FF] text-slate-950 hover:bg-[#38F5FF] cursor-pointer whitespace-nowrap shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                Subir Excel de {stateName}
              </button>
            )}
            {onDownloadSampleForState && (
              <button
                type="button"
                onClick={() => onDownloadSampleForState(stateName)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#F0ABFC]" />
                Descargar Muestra 100 Personas (.xlsx)
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Barra de búsqueda interna y filtro por origen */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={`Buscar por nombre, municipio, folio o urgencia en ${stateName}...`}
                className="w-full rounded-lg bg-[#0B0F17] border border-slate-800 pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 neon-focus"
              />
            </div>

            {realCount > 0 && synthCount > 0 && (
              <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0B0F17] border border-slate-800 w-fit">
                <button
                  type="button"
                  onClick={() => {
                    setOriginFilter('ALL');
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-mono cursor-pointer whitespace-nowrap shrink-0 ${
                    originFilter === 'ALL'
                      ? 'bg-[#00F0FF]/20 text-[#00F0FF] font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Todos ({stateRecords.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOriginFilter('REAL');
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-mono cursor-pointer whitespace-nowrap shrink-0 ${
                    originFilter === 'REAL'
                      ? 'bg-[#00FF9D]/20 text-[#00FF9D] font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Reales / Excel ({realCount})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOriginFilter('SYNTHETIC');
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-mono cursor-pointer whitespace-nowrap shrink-0 ${
                    originFilter === 'SYNTHETIC'
                      ? 'bg-slate-800 text-slate-100 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Analizadas ({synthCount})
                </button>
              </div>
            )}
          </div>

          {/* Tabla desplegable con Nombre y Datos de cada Encuestada */}
          <div className="overflow-x-auto max-h-[540px] overflow-y-auto rounded-lg border border-slate-800/90">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#0B0F17] sticky top-0 z-10 border-b border-slate-800 font-mono text-[11px] text-slate-400">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Nombre / Encuestada</th>
                  <th className="py-2.5 px-3">Municipio · Zona</th>
                  <th className="py-2.5 px-3">Edad</th>
                  <th className="py-2.5 px-3">Actividad y Cuidados</th>
                  <th className="py-2.5 px-3">Urgencia Principal (P12)</th>
                  <th className="py-2.5 px-3">Somos (P34/P37)</th>
                  <th className="py-2.5 px-3 text-right">Ficha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {visibleRecords.map((rec, idx) => {
                  const rowNum = (safePage - 1) * pageSize + idx + 1;
                  const prof = getRespondentDisplayProfile(rec);
                  const isRowOpen = expandedRecordId === rec.id;

                  return (
                    <React.Fragment key={rec.id}>
                      <tr
                        onClick={() =>
                          setExpandedRecordId((prev) => (prev === rec.id ? null : rec.id))
                        }
                        className={`transition-colors cursor-pointer ${
                          isRowOpen
                            ? 'bg-[#00F0FF]/12'
                            : 'hover:bg-slate-900/80'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono tabular-nums text-slate-400 whitespace-nowrap">
                          {rowNum}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-100">{prof.nombre}</div>
                          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="text-[#00F0FF]">
                              {rec.folio.replace(/^ORUS-/i, 'OCEAN-')}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={
                                rec.origin === 'REAL' ? 'text-[#00FF9D]' : 'text-slate-400'
                              }
                            >
                              {rec.origin === 'REAL' ? 'Campo / Excel' : 'Analizada'}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="text-slate-200">{prof.municipio}</div>
                          <div className="text-[11px] font-mono text-slate-400">
                            {rec.p3_localidad}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-slate-200 whitespace-nowrap">
                          {rec.p1_edad} años
                        </td>
                        <td className="py-2.5 px-3 max-w-[220px]">
                          <div className="text-slate-200 truncate" title={rec.p5_actividad_principal}>
                            {rec.p5_actividad_principal}
                          </div>
                          <div
                            className="text-[11px] text-slate-400 truncate"
                            title={rec.p6_cuidados.join(', ')}
                          >
                            {rec.p6_cuidados[0]}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 max-w-[230px]">
                          <div className="text-slate-200 truncate" title={rec.p12_mas_urgente}>
                            {rec.p12_mas_urgente}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums whitespace-nowrap">
                          {rec.p34_conoce_somos === 'Sí' ? (
                            <span className="text-[#00FF9D]">
                              Sí · {rec.p37_cercania_somos}/5
                            </span>
                          ) : (
                            <span className="text-slate-400">{rec.p34_conoce_somos}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedRecordId((prev) =>
                                prev === rec.id ? null : rec.id
                              );
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
                          >
                            {isRowOpen ? (
                              <>
                                Ocultar
                                <ChevronUp className="w-3.5 h-3.5 text-[#00F0FF]" />
                              </>
                            ) : (
                              <>
                                Ver datos
                                <ChevronDown className="w-3.5 h-3.5 text-[#00F0FF]" />
                              </>
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Ficha Completa Desplegable de la Persona Seleccionada */}
                      {isRowOpen && (
                        <tr className="bg-[#0B0F17]/95">
                          <td colSpan={8} className="p-4 sm:p-5 border-y border-[#00F0FF]/25">
                            <div className="space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                                <div>
                                  <div className="text-sm font-semibold text-slate-50">
                                    Expediente Individual: {prof.nombre}
                                  </div>
                                  <div className="text-xs font-mono text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                                    <span className="text-[#00F0FF]">
                                      {rec.folio.replace(/^ORUS-/i, 'OCEAN-')}
                                    </span>
                                    <span aria-hidden="true">·</span>
                                    <span>
                                      {rec.p2_entidad} ({prof.municipio})
                                    </span>
                                    <span aria-hidden="true">·</span>
                                    <span>{prof.modalidad}</span>
                                    <span aria-hidden="true">·</span>
                                    <span>Brigada: {prof.encuestadora}</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    exportRecordsToExcelXlsx(
                                      [rec],
                                      `Ficha_${rec.folio}_${prof.nombre.replace(/\s+/g, '_')}.xlsx`
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-100 cursor-pointer whitespace-nowrap shrink-0 w-fit"
                                >
                                  <Download className="w-3.5 h-3.5 text-[#00FF9D]" />
                                  Descargar Ficha (.xlsx)
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                {/* Columna 1: Bloques A y B */}
                                <div className="space-y-2 p-3.5 rounded-lg bg-[#05070A]/80 border border-slate-800/90">
                                  <div className="font-mono font-semibold text-[#00F0FF]">
                                    PERFIL E IDENTIDAD (P1–P10)
                                  </div>
                                  <p className="text-slate-300">
                                    <strong>Edad y Localidad:</strong> {rec.p1_edad} años ·{' '}
                                    {rec.p3_localidad}
                                  </p>
                                  <p className="text-slate-300">
                                    <strong>Actividades (P4):</strong>{' '}
                                    {rec.p4_actividades.join(', ')}
                                  </p>
                                  <p className="text-slate-300">
                                    <strong>Principal (P5):</strong> {rec.p5_actividad_principal}
                                  </p>
                                  <p className="text-slate-300">
                                    <strong>Cuidados (P6):</strong> {rec.p6_cuidados.join(', ')}
                                  </p>
                                  <p className="text-slate-300">
                                    <strong>Ser mujer hoy (P7):</strong> {rec.p7_significado_mujer}
                                  </p>
                                  <p className="text-slate-300">
                                    <strong>Obstáculo (P9):</strong> {rec.p9_obstaculo_principal}
                                  </p>
                                </div>

                                {/* Columna 2: Bloques C y D */}
                                <div className="space-y-2 p-3.5 rounded-lg bg-[#05070A]/80 border border-slate-800/90">
                                  <div className="font-mono font-semibold text-[#00FF9D]">
                                    NECESIDADES Y PARTICIPACIÓN (P11–P25)
                                  </div>
                                  <p className="text-slate-300">
                                    <strong>Top 3 Preocupaciones (P11):</strong>{' '}
                                    {rec.p11_preocupaciones_top3.join(' · ')}
                                  </p>
                                  <p className="text-slate-300">
                                    <strong>Más urgente (P12):</strong> {rec.p12_mas_urgente}
                                    {rec.p12_justificacion ? ` — ${rec.p12_justificacion}` : ''}
                                  </p>
                                  <p className="text-slate-300">
                                    <strong>Problema local (P13 - {rec.p13_problema_local_desatendido}):</strong>{' '}
                                    {rec.p13_detalle || 'Sin detalle adicional'}
                                  </p>
                                  <p className="text-slate-300">
                                    <strong>Confianza Partidos / OSC (P19):</strong>{' '}
                                    {rec.p19_confianza_institucional['Partidos políticos'] || 'N/D'}{' '}
                                    /{' '}
                                    {rec.p19_confianza_institucional[
                                      'Organizaciones de la sociedad civil y colectivos ciudadanos'
                                    ] || 'N/D'}
                                  </p>
                                  <p className="text-slate-300">
                                    <strong>Participación (P21):</strong>{' '}
                                    {rec.p21_frecuencia_participacion}
                                  </p>
                                  <p className="text-slate-300">
                                    <strong>Violencia política (P25):</strong>{' '}
                                    {rec.p25_violencia_politica}
                                  </p>
                                </div>

                                {/* Columna 3: Bloques E y F */}
                                <div className="space-y-2 p-3.5 rounded-lg bg-[#05070A]/80 border border-slate-800/90">
                                  <div className="font-mono font-semibold text-[#F0ABFC]">
                                    DERECHOS Y PERCEPCIÓN POLÍTICA (P26–P43)
                                  </div>
                                  <p className="text-slate-300">
                                    <strong>Desventajas (P27):</strong>{' '}
                                    {rec.p27_ambitos_desventaja.join(', ')}
                                  </p>
                                  <p className="text-slate-300">
                                    <strong>Rutas de apoyo (P32):</strong>{' '}
                                    {rec.p32_conocimiento_rutas_apoyo}
                                  </p>
                                  <p className="text-slate-300">
                                    <strong>Apoyo prioritario (P33):</strong>{' '}
                                    {rec.p33_apoyo_concreto_cambio}
                                  </p>
                                  <p className="text-slate-300">
                                    <strong>Conoce &ldquo;Somos&rdquo; (P34):</strong>{' '}
                                    {rec.p34_conoce_somos}
                                    {rec.p34_conoce_somos === 'Sí'
                                      ? ` · Opinión: ${rec.p36_opinion_somos} · Cercanía: ${rec.p37_cercania_somos}/5`
                                      : ' (Salto a P40)'}
                                  </p>
                                  <p className="text-slate-300">
                                    <strong>Otros partidos (P40–P41):</strong>{' '}
                                    {rec.p41_evaluacion_otros_partidos
                                      .map((ev) => `${ev.partido} (${ev.opinion}, ${ev.cercania}/5)`)
                                      .join(' · ')}
                                  </p>
                                  {prof.notas && (
                                    <p className="text-slate-400">
                                      <strong>Notas:</strong> {prof.notas}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
              <span>
                Mostrando {(safePage - 1) * pageSize + 1}–
                {Math.min(safePage * pageSize, filteredRecords.length)} de{' '}
                {filteredRecords.length} encuestados en {stateName}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded border border-slate-800 bg-[#0B0F17] text-slate-200 disabled:opacity-40 cursor-pointer"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded border border-slate-800 bg-[#0B0F17] text-slate-200 disabled:opacity-40 cursor-pointer"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
