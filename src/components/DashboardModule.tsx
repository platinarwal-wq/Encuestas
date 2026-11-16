import React, { useMemo, useState } from 'react';
import { AGE_RANGES, LOCALITY_TYPES } from '../data/orusCatalogs';
import {
  computeCareAnalysis,
  computeDashboardKPIs,
  computePartyComparison,
  computeStateTelemetry,
  computeTrustDistribution,
} from '../engine/analyticsEngine';
import { ActiveModule, AgeRange, LocalityType, OrusResponse } from '../types/orus';
import { StateRespondentsBreakdown } from './StateRespondentsBreakdown';
import { RotateCcw, ArrowUpRight, Filter } from 'lucide-react';

interface DashboardModuleProps {
  records: OrusResponse[];
  onNavigateModule: (mod: ActiveModule) => void;
  onInspectEntityInExplorer: (entityName: string) => void;
}

type MapMetricMode = 'SOMOS' | 'CARE' | 'DISAFFECTION';

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  records,
  onNavigateModule,
  onInspectEntityInExplorer,
}) => {
  const [selectedAge, setSelectedAge] = useState<'ALL' | AgeRange>('ALL');
  const [selectedLocality, setSelectedLocality] = useState<'ALL' | LocalityType>('ALL');
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [mapMetric, setMapMetric] = useState<MapMetricMode>('SOMOS');
  const [geoViewMode, setGeoViewMode] = useState<'CARTOGRAM' | 'MATRIX'>('CARTOGRAM');

  // Filtrado demográfico global en el módulo
  const demoFilteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (selectedAge !== 'ALL' && r.p1_edad !== selectedAge) return false;
      if (selectedLocality !== 'ALL' && r.p3_localidad !== selectedLocality) return false;
      return true;
    });
  }, [records, selectedAge, selectedLocality]);

  // Registros enfocados (incluye filtro por estado seleccionado en el mapa)
  const activeRecords = useMemo(() => {
    if (!selectedEntity) return demoFilteredRecords;
    return demoFilteredRecords.filter((r) => r.p2_entidad === selectedEntity);
  }, [demoFilteredRecords, selectedEntity]);

  const kpis = useMemo(() => computeDashboardKPIs(activeRecords), [activeRecords]);
  const stateRows = useMemo(
    () => computeStateTelemetry(demoFilteredRecords),
    [demoFilteredRecords]
  );
  const trustRows = useMemo(() => computeTrustDistribution(activeRecords), [activeRecords]);
  const careAnalysis = useMemo(() => computeCareAnalysis(activeRecords), [activeRecords]);
  const partyRows = useMemo(() => computePartyComparison(activeRecords), [activeRecords]);

  const selectedStateRow = useMemo(
    () => stateRows.find((s) => s.meta.name === selectedEntity) ?? null,
    [stateRows, selectedEntity]
  );

  const hasActiveFilters =
    selectedAge !== 'ALL' || selectedLocality !== 'ALL' || selectedEntity !== null;

  const resetFilters = () => {
    setSelectedAge('ALL');
    setSelectedLocality('ALL');
    setSelectedEntity(null);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado contextual y barra de filtros demográficos */}
      <section className="ocean-surface rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="text-[#00F0FF]">[TELEMETRÍA_ACTIVA]</span>
              <span aria-hidden="true">·</span>
              <span>INSTRUMENTO OCEAN 43 ÍTEMS</span>
              <span aria-hidden="true">·</span>
              <span>
                ALCANCE: {selectedEntity ? selectedEntity.toUpperCase() : '32 ENTIDADES + EXTERIOR'}
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-50">
              Centro de Inteligencia Sociopolítica y Opinión Pública
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#00F0FF]" />
                Restablecer filtros
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigateModule('EXCEL_BATCHES')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-950 bg-[#00FF9D] hover:bg-[#34FFB2] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Bloques Excel (100/Edo)
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateModule('SURVEY')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-950 bg-[#00F0FF] hover:bg-[#38F5FF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Capturar Encuesta OCEAN
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Controles de corte por Edad (P1) y Localidad (P3) */}
        <div className="pt-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 mr-1">
              <Filter className="w-3.5 h-3.5 text-[#00F0FF]" />
              Rango de edad (P1):
            </span>
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[#05070A]/90 border border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedAge('ALL')}
                className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedAge === 'ALL'
                    ? 'bg-[#00F0FF]/18 text-[#00F0FF] font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todas
              </button>
              {AGE_RANGES.map((age) => (
                <button
                  key={age}
                  type="button"
                  onClick={() => setSelectedAge(age)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedAge === age
                      ? 'bg-[#00F0FF]/18 text-[#00F0FF] font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {age}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-slate-400 mr-1">Localidad (P3):</span>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#05070A]/90 border border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedLocality('ALL')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedLocality === 'ALL'
                    ? 'bg-[#00FF9D]/18 text-[#00FF9D] font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todas
              </button>
              {LOCALITY_TYPES.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setSelectedLocality(loc)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedLocality === loc
                      ? 'bg-[#00FF9D]/18 text-[#00FF9D] font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tira de 4 KPIs Globales en Tiempo Real */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="ocean-surface rounded-xl p-5 flex flex-col justify-between">
          <div className="text-xs font-mono text-slate-400">
            Muestra Procesada · Reales + Analizadas
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-[#00F0FF]">
              {kpis.totalCount.toLocaleString('es-MX')}
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-400">
              {kpis.realCount} campo · {kpis.syntheticCount} analizadas
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Cobertura activa</span>
            <span className="text-[#00FF9D]">
              {stateRows.filter((s) => s.count > 0).length}/33 nodos
            </span>
          </div>
        </div>

        <div className="ocean-surface rounded-xl p-5 flex flex-col justify-between">
          <div className="text-xs font-mono text-slate-400">
            Índice de Desafección Partidista (P19)
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-[#BD00FF]">
              {kpis.partyDisaffectionPct.toFixed(1)}%
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-400">
              Ninguna / Poca confianza
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#BD00FF]"
                style={{ width: `${Math.min(100, kpis.partyDisaffectionPct)}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-xs font-mono text-slate-400">
              <span>Contraste confianza OSC</span>
              <span className="text-[#00FF9D]">{kpis.oscTrustPct.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="ocean-surface rounded-xl p-5 flex flex-col justify-between">
          <div className="text-xs font-mono text-slate-400">
            Reconocimiento de &ldquo;Somos&rdquo; (P34 / P37)
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-[#00FF9D]">
              {kpis.somosRecognitionPct.toFixed(1)}%
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-300">
              Cercanía {kpis.somosAvgCloseness.toFixed(2)} / 5.0
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00FF9D]"
                style={{ width: `${Math.min(100, kpis.somosRecognitionPct)}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-xs font-mono text-slate-400">
              <span>Salto P34→P40 activo en</span>
              <span className="text-slate-300">
                {(100 - kpis.somosRecognitionPct).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="ocean-surface rounded-xl p-5 flex flex-col justify-between">
          <div className="text-xs font-mono text-slate-400">
            Top 3 Preocupaciones Nacionales (P11)
          </div>
          <div className="mt-2.5 space-y-2">
            {kpis.topConcerns.slice(0, 3).map((item, idx) => (
              <div key={item.label} className="text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-200 truncate">
                    {idx + 1}. {item.label}
                  </span>
                  <span className="font-mono tabular-nums text-[#00F0FF] shrink-0">
                    {item.pct.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-1 w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#00F0FF]"
                    style={{ width: `${Math.min(100, item.pct)}%` }}
                  />
                </div>
              </div>
            ))}
            {kpis.topConcerns.length === 0 && (
              <p className="text-xs text-slate-500 py-2">Sin registros para el filtro actual.</p>
            )}
          </div>
        </div>
      </section>

      {/* Mapa / Matriz Geográfica Interactiva de México (32 Entidades + Exterior) */}
      <section className="ocean-surface rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              Matriz Cartográfica de México · 32 Entidades Federativas y Exterior
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Selecciona cualquier entidad para focalizar todos los indicadores del tablero o inspeccionar sus folios.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#05070A] border border-slate-800">
              <button
                type="button"
                onClick={() => setMapMetric('SOMOS')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  mapMetric === 'SOMOS'
                    ? 'bg-[#00FF9D]/20 text-[#00FF9D]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Reconocimiento Somos
              </button>
              <button
                type="button"
                onClick={() => setMapMetric('CARE')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  mapMetric === 'CARE'
                    ? 'bg-[#BD00FF]/20 text-[#E879F9]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Carga de Cuidados
              </button>
              <button
                type="button"
                onClick={() => setMapMetric('DISAFFECTION')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  mapMetric === 'DISAFFECTION'
                    ? 'bg-[#00F0FF]/20 text-[#00F0FF]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Desafección Partidista
              </button>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#05070A] border border-slate-800">
              <button
                type="button"
                onClick={() => setGeoViewMode('CARTOGRAM')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  geoViewMode === 'CARTOGRAM'
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Mapa Táctico
              </button>
              <button
                type="button"
                onClick={() => setGeoViewMode('MATRIX')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  geoViewMode === 'MATRIX'
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tabla 33 Nodos
              </button>
            </div>
          </div>
        </div>

        {geoViewMode === 'CARTOGRAM' ? (
          <div className="pt-5 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Cartograma reticular de las 32 entidades + Exterior */}
            <div className="xl:col-span-8 overflow-x-auto pb-2">
              <div className="min-w-[660px] grid grid-cols-9 gap-2">
                {Array.from({ length: 6 * 9 }).map((_, cellIdx) => {
                  const gx = cellIdx % 9;
                  const gy = Math.floor(cellIdx / 9);
                  const entityRow = stateRows.find(
                    (s) => s.meta.gridX === gx && s.meta.gridY === gy
                  );

                  if (!entityRow) {
                    return <div key={`empty-${gx}-${gy}`} className="h-16 rounded-lg" />;
                  }

                  const metricVal =
                    mapMetric === 'SOMOS'
                      ? entityRow.somosRecognitionPct
                      : mapMetric === 'CARE'
                      ? entityRow.careLoadPct
                      : entityRow.disaffectionPct;

                  const isSelected = selectedEntity === entityRow.meta.name;
                  const intensity = entityRow.count === 0 ? 0.05 : Math.max(0.12, metricVal / 100);

                  const borderColor = isSelected
                    ? '#00F0FF'
                    : mapMetric === 'SOMOS'
                    ? `rgba(0, 255, 157, ${0.22 + intensity * 0.5})`
                    : mapMetric === 'CARE'
                    ? `rgba(189, 0, 255, ${0.22 + intensity * 0.5})`
                    : `rgba(0, 240, 255, ${0.22 + intensity * 0.5})`;

                  const bgFill =
                    entityRow.count === 0
                      ? 'rgba(15, 23, 42, 0.35)'
                      : mapMetric === 'SOMOS'
                      ? `rgba(0, 255, 157, ${intensity * 0.22})`
                      : mapMetric === 'CARE'
                      ? `rgba(189, 0, 255, ${intensity * 0.24})`
                      : `rgba(0, 240, 255, ${intensity * 0.22})`;

                  return (
                    <button
                      key={entityRow.meta.code}
                      type="button"
                      onClick={() =>
                        setSelectedEntity((prev) =>
                          prev === entityRow.meta.name ? null : entityRow.meta.name
                        )
                      }
                      style={{ backgroundColor: bgFill, borderColor }}
                      className={`h-16 p-2 rounded-lg border text-left transition-transform duration-150 hover:-translate-y-0.5 flex flex-col justify-between cursor-pointer ${
                        isSelected ? 'ring-2 ring-[#00F0FF]' : ''
                      }`}
                      title={`${entityRow.meta.name} (${entityRow.meta.lat.toFixed(2)}°N, ${entityRow.meta.lng.toFixed(2)}°W)`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-mono font-bold text-slate-100 truncate">
                          {entityRow.meta.short}
                        </span>
                        <span className="text-[11px] font-mono tabular-nums text-slate-300">
                          n={entityRow.count}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-mono tabular-nums font-semibold text-slate-100">
                          {entityRow.count > 0 ? `${metricVal}%` : '—'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 truncate">
                          {entityRow.meta.lat.toFixed(0)}°N
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400 pt-3 border-t border-slate-800/70">
                <span>
                   Coordenadas georreferenciadas INEGI · 32 estados + nodo Exterior (EXT)
                </span>
                <span>
                  Variable activa:{' '}
                  <strong className="text-slate-200">
                    {mapMetric === 'SOMOS'
                      ? 'Tasa de reconocimiento Somos (P34)'
                      : mapMetric === 'CARE'
                      ? 'Carga directa de cuidados (P6)'
                      : 'Desafección hacia partidos (P19)'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Panel de detalle táctico de la entidad seleccionada o resumen nacional */}
            <div className="xl:col-span-4 pt-2 xl:pt-0 xl:pl-6 xl:border-l border-slate-800/80 space-y-4">
              {selectedStateRow ? (
                <>
                  <div>
                    <div className="text-xs font-mono text-[#00F0FF]">
                      NODO ESTATAL SELECCIONADO · {selectedStateRow.meta.region.toUpperCase()}
                    </div>
                    <h3 className="text-xl font-semibold text-slate-50 mt-1">
                      {selectedStateRow.meta.name}
                    </h3>
                    <p className="text-xs font-mono text-slate-400 mt-0.5 tabular-nums">
                      LAT {selectedStateRow.meta.lat.toFixed(4)}° N · LON{' '}
                      {selectedStateRow.meta.lng.toFixed(4)}° W
                    </p>
                  </div>

                  <div className="space-y-3 py-3 border-y border-slate-800/80 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Encuestas en entidad</span>
                      <span className="font-mono tabular-nums font-semibold text-slate-100">
                        {selectedStateRow.count}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Reconocimiento de Somos</span>
                      <span className="font-mono tabular-nums font-semibold text-[#00FF9D]">
                        {selectedStateRow.somosRecognitionPct}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Carga directa de cuidados</span>
                      <span className="font-mono tabular-nums font-semibold text-[#E879F9]">
                        {selectedStateRow.careLoadPct}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Desafección partidista</span>
                      <span className="font-mono tabular-nums font-semibold text-[#00F0FF]">
                        {selectedStateRow.disaffectionPct}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-mono text-slate-400">
                      Principal preocupación estatal (P11):
                    </div>
                    <p className="text-sm text-slate-200 font-medium mt-1">
                      {selectedStateRow.topConcern}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => onInspectEntityInExplorer(selectedStateRow.meta.name)}
                      className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#00F0FF]/15 text-[#00F0FF] hover:bg-[#00F0FF]/25 border border-[#00F0FF]/35 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Auditar folios del estado
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedEntity(null)}
                      className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Ver total nacional
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="text-xs font-mono text-[#00FF9D]">
                      CONSOLIDADO TERRITORIAL ACTIVO
                    </div>
                    <h3 className="text-lg font-semibold text-slate-100 mt-1">
                      Entidades con Mayor Muestra Capturada
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Haz clic en cualquier celda del mapa para aislar la telemetría de esa entidad.
                    </p>
                  </div>

                  <div className="divide-y divide-slate-800/80">
                    {[...stateRows]
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 6)
                      .map((row) => (
                        <button
                          key={row.meta.code}
                          type="button"
                          onClick={() => setSelectedEntity(row.meta.name)}
                          className="w-full py-2.5 flex items-center justify-between text-left hover:bg-slate-800/40 px-2 rounded transition-colors cursor-pointer"
                        >
                          <div>
                            <div className="text-sm font-medium text-slate-200">
                              {row.meta.name}
                            </div>
                            <div className="text-xs font-mono text-slate-400">
                              {row.meta.lat.toFixed(2)}°N, {row.meta.lng.toFixed(2)}°W
                            </div>
                          </div>
                          <div className="text-right font-mono tabular-nums">
                            <div className="text-xs text-[#00F0FF]">n={row.count}</div>
                            <div className="text-xs text-[#00FF9D]">
                              Somos {row.somosRecognitionPct}%
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Vista de Tabla Geográfica Completa (32 entidades + Exterior) */
          <div className="pt-4 overflow-x-auto max-h-[420px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-mono text-slate-400">
                  <th className="py-2.5 px-3">Entidad</th>
                  <th className="py-2.5 px-3">Coordenadas</th>
                  <th className="py-2.5 px-3 text-right">Muestra (n)</th>
                  <th className="py-2.5 px-3 text-right">Somos (P34)</th>
                  <th className="py-2.5 px-3 text-right">Cuidados (P6)</th>
                  <th className="py-2.5 px-3 text-right">Desafección (P19)</th>
                  <th className="py-2.5 px-3">Preocupación #1 (P11)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {stateRows.map((row) => (
                  <tr
                    key={row.meta.code}
                    onClick={() =>
                      setSelectedEntity((prev) =>
                        prev === row.meta.name ? null : row.meta.name
                      )
                    }
                    className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${
                      selectedEntity === row.meta.name ? 'bg-[#00F0FF]/10' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-medium text-slate-100 whitespace-nowrap">
                      {row.meta.name}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-slate-400 whitespace-nowrap">
                      {row.meta.lat.toFixed(2)}°N, {row.meta.lng.toFixed(2)}°W
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-200">
                      {row.count}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-right text-[#00FF9D]">
                      {row.count > 0 ? `${row.somosRecognitionPct}%` : '—'}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-right text-[#E879F9]">
                      {row.count > 0 ? `${row.careLoadPct}%` : '—'}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-right text-[#00F0FF]">
                      {row.count > 0 ? `${row.disaffectionPct}%` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">
                      {row.topConcern}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedStateRow && (
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <StateRespondentsBreakdown
              stateName={selectedStateRow.meta.name}
              stateShortCode={selectedStateRow.meta.short}
              records={demoFilteredRecords}
              onClose={() => setSelectedEntity(null)}
            />
          </div>
        )}
      </section>

      {/* Gráficas Analíticas Neón: P19 Confianza + P6/P29 Cuidados */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Gráfica 1: Distribución de Confianza Institucional (P19 - Matriz 6x5) */}
        <div className="ocean-surface rounded-xl p-6">
          <div className="pb-4 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                Distribución de Confianza Institucional (P19)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparativa porcentual en las 6 instituciones evaluadas en el Bloque D.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-300">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500/85" /> Ninguna
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#BD00FF]/80" /> Poca
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#00F0FF]/85" /> Algo
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#00FF9D]" /> Mucha
              </span>
            </div>
          </div>

          <div className="pt-5 space-y-4">
            {trustRows.map((row) => (
              <div key={row.institution} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">{row.shortName}</span>
                  <span className="font-mono tabular-nums text-slate-400">
                    Confianza positiva:{' '}
                    <strong className="text-[#00FF9D]">
                      {(row.algo + row.mucha).toFixed(1)}%
                    </strong>{' '}
                    · Desconfianza:{' '}
                    <strong className="text-[#E879F9]">
                      {(row.ninguna + row.poca).toFixed(1)}%
                    </strong>
                  </span>
                </div>
                <div className="w-full h-3 rounded bg-slate-900 overflow-hidden flex">
                  <div
                    style={{ width: `${row.ninguna}%` }}
                    className="bg-rose-500/85 h-full"
                    title={`Ninguna confianza: ${row.ninguna}%`}
                  />
                  <div
                    style={{ width: `${row.poca}%` }}
                    className="bg-[#BD00FF]/80 h-full"
                    title={`Poca confianza: ${row.poca}%`}
                  />
                  <div
                    style={{ width: `${row.algo}%` }}
                    className="bg-[#00F0FF]/85 h-full"
                    title={`Algo de confianza: ${row.algo}%`}
                  />
                  <div
                    style={{ width: `${row.mucha}%` }}
                    className="bg-[#00FF9D] h-full"
                    title={`Mucha confianza: ${row.mucha}%`}
                  />
                  <div
                    style={{ width: `${row.noSabe}%` }}
                    className="bg-slate-700 h-full"
                    title={`No sabe / No conoce: ${row.noSabe}%`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfica 2: Carga de Cuidados No Remunerados e Impacto en Vida Personal/Laboral (P6 y P29) */}
        <div className="ocean-surface rounded-xl p-6">
          <div className="pb-4 border-b border-slate-800/80 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                Carga de Cuidados e Impacto en Autonomía (P6 · P29)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cruce de responsabilidades directas de cuidado ({kpis.directCareLoadPct.toFixed(1)}% de la muestra) con impactos frecuentes.
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-[#E879F9]">
              BRECHA DE CUIDADOS
            </span>
          </div>

          <div className="pt-4 space-y-5">
            {/* Impactos P29 */}
            <div className="space-y-3">
              <div className="text-xs font-mono text-slate-400">
                Impacto reportado en P29 (Algunas veces + Frecuentemente + Siempre):
              </div>
              {careAnalysis.impactRows.map((imp) => (
                <div key={imp.item} className="space-y-1">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="text-slate-200 truncate">{imp.shortLabel}</span>
                    <span className="font-mono tabular-nums text-slate-300 shrink-0">
                      <strong className="text-[#E879F9]">{imp.highImpactPct.toFixed(1)}%</strong>{' '}
                      <span className="text-slate-500">
                        (severo: {imp.frequentOrAlwaysPct.toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-900 rounded overflow-hidden relative">
                    <div
                      className="h-full bg-[#BD00FF]/45"
                      style={{ width: `${Math.min(100, imp.highImpactPct)}%` }}
                    />
                    <div
                      className="h-full bg-[#BD00FF] absolute top-0 left-0"
                      style={{ width: `${Math.min(100, imp.frequentOrAlwaysPct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Distribución P6 resumida */}
            <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {careAnalysis.careBreakdown.slice(0, 6).map((c) => (
                <div key={c.label} className="text-xs">
                  <div className="font-mono tabular-nums text-base font-semibold text-slate-100">
                    {c.pct.toFixed(1)}%
                  </div>
                  <div className="text-slate-400 leading-snug line-clamp-2">{c.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gráfica 3: Comparativa de Percepción entre "Somos" y Otros Partidos (P36–P41) */}
      <section className="ocean-surface rounded-xl p-6">
        <div className="pb-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              Comparativa de Percepción: &ldquo;Somos&rdquo; frente a Otros Partidos (P36 – P41)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluación de opinión favorable, cercanía con las mujeres (escala 1–5) y claridad de propuestas percibidas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateModule('SIMULATOR')}
            className="text-xs font-mono text-[#00F0FF] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            Analizar escenarios de posicionamiento →
          </button>
        </div>

        <div className="pt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-mono text-slate-400">
                <th className="py-2.5 px-3">Organización / Partido</th>
                <th className="py-2.5 px-3 text-right">Evaluaciones (n)</th>
                <th className="py-2.5 px-3">Opinión Positiva (Buena / Muy buena)</th>
                <th className="py-2.5 px-3">Cercanía con Mujeres (1.0 – 5.0)</th>
                <th className="py-2.5 px-3 text-right">Propuestas Claras</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-sm">
              {partyRows.map((row) => (
                <tr
                  key={row.party}
                  className={
                    row.isSomos
                      ? 'bg-[#00FF9D]/8 hover:bg-[#00FF9D]/12 transition-colors'
                      : 'hover:bg-slate-800/40 transition-colors'
                  }
                >
                  <td className="py-3 px-3 font-semibold whitespace-nowrap">
                    <span className={row.isSomos ? 'text-[#00FF9D]' : 'text-slate-200'}>
                      {row.party}
                    </span>
                    {row.isSomos && (
                      <span className="ml-2 text-xs font-mono text-slate-400">
                        · Bloque F (P34=Sí)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300">
                    {row.mentions}
                  </td>
                  <td className="py-3 px-3 min-w-[200px]">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-900 rounded overflow-hidden">
                        <div
                          className={`h-full ${
                            row.isSomos ? 'bg-[#00FF9D]' : 'bg-[#00F0FF]/75'
                          }`}
                          style={{ width: `${Math.min(100, row.positiveOpinionPct)}%` }}
                        />
                      </div>
                      <span className="font-mono tabular-nums text-xs w-12 text-right text-slate-200">
                        {row.positiveOpinionPct.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 min-w-[200px]">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-900 rounded overflow-hidden">
                        <div
                          className={`h-full ${
                            row.isSomos ? 'bg-[#00FF9D]' : 'bg-[#BD00FF]/75'
                          }`}
                          style={{ width: `${Math.min(100, (row.avgCloseness / 5) * 100)}%` }}
                        />
                      </div>
                      <span className="font-mono tabular-nums text-xs w-12 text-right text-slate-200">
                        {row.avgCloseness.toFixed(2)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-xs text-slate-200">
                    {row.clearProposalsPct.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
