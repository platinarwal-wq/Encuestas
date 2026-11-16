import React, { useEffect, useRef, useState } from 'react';
import { generateSingleSyntheticAgent } from '../engine/swarmSimulator';
import {
  ActiveModule,
  GeoBiasOption,
  OrusResponse,
  SimulationConfig,
  SocioCareArchetype,
  SomosPositioningScenario,
} from '../types/orus';
import { Play, Terminal, CheckCircle2, ArrowUpRight, Trash2 } from 'lucide-react';

interface SwarmSimulatorModuleProps {
  existingCount: number;
  onInjectBatch: (batch: OrusResponse[]) => void;
  onNavigateModule: (mod: ActiveModule) => void;
}

const GEO_OPTIONS: Array<{ id: GeoBiasOption; label: string; desc: string }> = [
  {
    id: 'NACIONAL_PONDERADO',
    label: 'Nacional Ponderado (32 Entidades)',
    desc: 'Distribución demográfica proporcional al padrón poblacional mexicano.',
  },
  {
    id: 'BAJIO_GUANAJUATO',
    label: 'Bajío / Enfoque Guanajuato',
    desc: 'Sobremuestreo estratégico en Guanajuato, Querétaro, Aguascalientes y Jalisco.',
  },
  {
    id: 'ZMVM_CENTRO',
    label: 'Zona Metropolitana Valle de México',
    desc: 'Concentración en CDMX, Estado de México, Puebla, Hidalgo y Morelos.',
  },
  {
    id: 'SUR_SURESTE',
    label: 'Sur - Sureste',
    desc: 'Foco en Chiapas, Oaxaca, Guerrero, Veracruz, Tabasco y Península de Yucatán.',
  },
  {
    id: 'NORTE_INDUSTRIAL',
    label: 'Norte Fronterizo e Industrial',
    desc: 'Foco en Nuevo León, Chihuahua, Baja California, Sonora, Coahuila y Tamaulipas.',
  },
];

const SOCIO_OPTIONS: Array<{ id: SocioCareArchetype; label: string; desc: string }> = [
  {
    id: 'MIXTO_NACIONAL',
    label: 'Mosaico Sociodemográfico Nacional',
    desc: 'Combinación balanceada de ocupaciones, edades y niveles de cuidado.',
  },
  {
    id: 'ALTA_CARGA_CUIDADOS',
    label: 'Alta Carga de Cuidados No Remunerados',
    desc: 'Madres y cuidadoras directas de menores, adultos mayores o personas enfermas.',
  },
  {
    id: 'JOVENES_UNIVERSITARIAS_URBANAS',
    label: 'Jóvenes Universitarias y Profesionistas Urbanas',
    desc: 'Cohorte 18–34 años en localidades urbanas con alta sensibilidad a movilidad y empleo.',
  },
  {
    id: 'MUJERES_RURALES_ACCESO_LIMITADO',
    label: 'Mujeres Rurales con Acceso Limitado a Servicios',
    desc: 'Localidades rurales/mixtas con brechas agudas en salud, agua potable y justicia.',
  },
  {
    id: 'ECONOMIA_PROPIA_INFORMAL',
    label: 'Trabajadoras por Cuenta Propia / Comercio',
    desc: 'Emprendedoras y comerciantes sin seguridad social ni acceso a crédito formal.',
  },
];

const SOMOS_SCENARIOS: Array<{
  id: SomosPositioningScenario;
  label: string;
  rate: string;
  desc: string;
}> = [
  {
    id: 'BAJA_15',
    label: 'Baja Penetración',
    rate: '15%',
    desc: 'Escenario línea base temprana: 85% activa salto P34→P40.',
  },
  {
    id: 'ORGANICO_40',
    label: 'Crecimiento Orgánico',
    rate: '40%',
    desc: 'Expansión intermedia por redes vecinales y conversación digital.',
  },
  {
    id: 'ALTA_70',
    label: 'Alta Exposición Territorial',
    rate: '70%',
    desc: 'Despliegue intensivo con evaluación profunda en P35–P39.',
  },
];

export const SwarmSimulatorModule: React.FC<SwarmSimulatorModuleProps> = ({
  existingCount,
  onInjectBatch,
  onNavigateModule,
}) => {
  const [batchSize, setBatchSize] = useState<SimulationConfig['batchSize']>(50);
  const [geoBias, setGeoBias] = useState<GeoBiasOption>('BAJIO_GUANAJUATO');
  const [socioProfile, setSocioProfile] =
    useState<SocioCareArchetype>('ALTA_CARGA_CUIDADOS');
  const [somosScenario, setSomosScenario] =
    useState<SomosPositioningScenario>('ORGANICO_40');

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progressCount, setProgressCount] = useState<number>(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '[SYS_INIT] :: Motor Analítico OCEAN-43 calibrado y en espera de parámetros.',
    `[DATASET_STATE] :: ${existingCount} registros activos en memoria operativa.`,
  ]);
  const [lastBatchSummary, setLastBatchSummary] = useState<{
    generated: number;
    somosYesPct: number;
    topState: string;
  } | null>(null);

  const consoleEndRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollTop = consoleEndRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const formatAgentLogLine = (agent: OrusResponse, seqIndex: number): string => {
    const idTag = String(seqIndex).padStart(4, '0');
    const priorityShort =
      agent.p12_mas_urgente.length > 34
        ? `${agent.p12_mas_urgente.slice(0, 34)}…`
        : agent.p12_mas_urgente;
    const somosStatus =
      agent.p34_conoce_somos === 'Sí'
        ? `Somos: Cercanía ${agent.p37_cercania_somos}/5`
        : `Somos: Salto P34→P40 (${agent.p34_conoce_somos})`;
    return `[OCEAN_${idTag}] :: ${agent.p2_entidad} | ${agent.p1_edad} | ${agent.p3_localidad} | Prioridad: ${priorityShort} | ${somosStatus}`;
  };

  const handleStartSimulation = () => {
    if (isRunning) return;
    setIsRunning(true);
    setProgressCount(0);
    setLastBatchSummary(null);

    const allGenerated: OrusResponse[] = [];
    for (let i = 0; i < batchSize; i++) {
      const rec = generateSingleSyntheticAgent(existingCount + i + 1, {
        geoBias,
        socioProfile,
        somosScenario,
      });
      allGenerated.push(rec);
    }

    setTerminalLogs((prev) => [
      ...prev.slice(-80),
      `[OCEAN_START] :: Analizando lote N=${batchSize} | Sesgo=${geoBias} | Arquetipo=${socioProfile} | Escenario=${somosScenario}`,
    ]);

    // Transmitir visualmente en pasos ágiles (máximo ~1.4 segundos para cualquier N)
    const totalSteps = 14;
    const chunkSize = Math.max(1, Math.ceil(batchSize / totalSteps));
    let cursor = 0;

    timerRef.current = window.setInterval(() => {
      const slice = allGenerated.slice(cursor, cursor + chunkSize);
      cursor += slice.length;
      setProgressCount(cursor);

      // Mostrar hasta 4 líneas representativas por tick para mantener legibilidad a 60fps
      const sampleLogs = slice
        .slice(0, 4)
        .map((ag, idx) => formatAgentLogLine(ag, existingCount + cursor - slice.length + idx + 1));

      if (slice.length > 4) {
        sampleLogs.push(
          `  ↳ +${slice.length - 4} encuestas analizadas procesadas y validadas en este ciclo...`
        );
      }

      setTerminalLogs((prev) => [...prev.slice(-140), ...sampleLogs]);

      if (cursor >= allGenerated.length) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        timerRef.current = null;
        setIsRunning(false);

        const somosYes = allGenerated.filter((r) => r.p34_conoce_somos === 'Sí').length;
        const somosYesPct = Math.round((somosYes / allGenerated.length) * 1000) / 10;

        const stateCounts = new Map<string, number>();
        for (const r of allGenerated) {
          stateCounts.set(r.p2_entidad, (stateCounts.get(r.p2_entidad) ?? 0) + 1);
        }
        const topState =
          Array.from(stateCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Nacional';

        setLastBatchSummary({
          generated: allGenerated.length,
          somosYesPct,
          topState,
        });

        setTerminalLogs((prev) => [
          ...prev,
          `[CONVERGENCE_OK] :: Lote N=${allGenerated.length} inyectado al estado global | Reconocimiento Somos=${somosYesPct}% | Nodo líder=${topState}.`,
        ]);

        onInjectBatch(allGenerated);
      }
    }, 85);
  };

  const progressPct = batchSize > 0 ? Math.min(100, Math.round((progressCount / batchSize) * 100)) : 0;

  return (
    <div className="space-y-6">
      <section className="ocean-surface rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="text-[#00FF9D]">[OCEAN_ANALYTICS_ONLINE]</span>
              <span aria-hidden="true">·</span>
              <span>CALIBRACIÓN DEMOGRÁFICA MULTIVARIABLE</span>
            </div>
            <h1 className="mt-1 text-2xl font-semibold text-slate-50">
              Analizador de Encuestas y Perfiles Demográficos OCEAN
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Genera cohortes de encuestas analizadas coherentes en los 43 ítems OCEAN para modelar escenarios territoriales y de posicionamiento.
            </p>
          </div>

          <button
            type="button"
            disabled={isRunning}
            onClick={handleStartSimulation}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
              isRunning
                ? 'bg-slate-800 text-slate-400 cursor-wait'
                : 'bg-[#00FF9D] text-slate-950 hover:bg-[#34FFB2] cursor-pointer'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            {isRunning
              ? `Analizando ${progressCount}/${batchSize}...`
              : `Generar Muestra Analizada (N = ${batchSize})`}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Panel izquierdo: Parámetros Configurables */}
        <section className="xl:col-span-6 ocean-surface rounded-xl p-6 space-y-6">
          {/* Tamaño del Lote */}
          <div className="space-y-2.5">
            <span className="block text-xs font-mono text-[#00F0FF]">
              01. TAMAÑO DE LOTE ANALIZADO (N)
            </span>
            <div className="grid grid-cols-4 gap-2.5">
              {([10, 50, 250, 1000] as const).map((nVal) => (
                <button
                  key={nVal}
                  type="button"
                  disabled={isRunning}
                  onClick={() => setBatchSize(nVal)}
                  className={`py-2.5 px-3 rounded-lg border font-mono tabular-nums text-sm font-semibold transition-colors cursor-pointer ${
                    batchSize === nVal
                      ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]'
                      : 'bg-[#05070A] border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  N = {nVal}
                </button>
              ))}
            </div>
          </div>

          {/* Sesgo Geográfico */}
          <div className="space-y-2.5 pt-4 border-t border-slate-800/70">
            <span className="block text-xs font-mono text-[#00F0FF]">
              02. SESGO GEOGRÁFICO TERRITORIAL
            </span>
            <div className="space-y-2">
              {GEO_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isRunning}
                  onClick={() => setGeoBias(opt.id)}
                  className={`w-full p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                    geoBias === opt.id
                      ? 'bg-[#00F0FF]/14 border-[#00F0FF] text-slate-50'
                      : 'bg-[#05070A]/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Perfil Socioeconómico y de Cuidados */}
          <div className="space-y-2.5 pt-4 border-t border-slate-800/70">
            <span className="block text-xs font-mono text-[#E879F9]">
              03. ARQUETIPO SOCIOECONÓMICO Y DE CUIDADOS
            </span>
            <div className="space-y-2">
              {SOCIO_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isRunning}
                  onClick={() => setSocioProfile(opt.id)}
                  className={`w-full p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                    socioProfile === opt.id
                      ? 'bg-[#BD00FF]/18 border-[#BD00FF] text-slate-50'
                      : 'bg-[#05070A]/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Posicionamiento de Somos */}
          <div className="space-y-2.5 pt-4 border-t border-slate-800/70">
            <span className="block text-xs font-mono text-[#00FF9D]">
              04. ESCENARIO DE POSICIONAMIENTO DE &ldquo;SOMOS&rdquo; (P34 – P39)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SOMOS_SCENARIOS.map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  disabled={isRunning}
                  onClick={() => setSomosScenario(sc.id)}
                  className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                    somosScenario === sc.id
                      ? 'bg-[#00FF9D]/16 border-[#00FF9D] text-slate-50'
                      : 'bg-[#05070A]/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-semibold">{sc.label}</span>
                    <span className="font-mono text-sm font-bold text-[#00FF9D]">{sc.rate}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{sc.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Panel derecho: Consola Visual en Vivo */}
        <section className="xl:col-span-6 ocean-surface rounded-xl p-6 flex flex-col space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-sm font-mono text-slate-200">
              <Terminal className="w-4 h-4 text-[#00F0FF]" />
              <span>Consola de Procesamiento de Encuestas Analizadas</span>
            </div>
            <button
              type="button"
              onClick={() =>
                setTerminalLogs(['[CONSOLE_CLEARED] :: Registro visual reiniciado.'])
              }
              className="inline-flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpiar consola
            </button>
          </div>

          {/* Barra de progreso segmentada */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono tabular-nums">
              <span className="text-slate-400">
                Estado: {isRunning ? 'EJECUTANDO ANÁLISIS DEMOGRÁFICO' : 'LISTO / CONVERGENTE'}
              </span>
              <span className="text-[#00FF9D]">
                {isRunning ? `${progressPct}% (${progressCount}/${batchSize})` : '100%'}
              </span>
            </div>
            <div className="w-full h-2 bg-[#05070A] rounded overflow-hidden border border-slate-800">
              <div
                className="h-full bg-[#00FF9D] transition-all duration-100"
                style={{ width: `${isRunning ? progressPct : lastBatchSummary ? 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Flujo monoespaciado */}
          <div
            ref={consoleEndRef}
            className="h-[430px] overflow-y-auto rounded-lg bg-[#05070A] border border-slate-800/90 p-4 font-mono text-xs space-y-1.5 leading-relaxed"
          >
            {terminalLogs.map((line, i) => {
              const isSuccess = line.startsWith('[CONVERGENCE_OK]');
              const isHeader = line.startsWith('[OCEAN_START]') || line.startsWith('[SYS_INIT]');
              return (
                <div
                  key={`${i}-${line.slice(0, 18)}`}
                  className={
                    isSuccess
                      ? 'text-[#00FF9D] font-semibold pt-1'
                      : isHeader
                      ? 'text-[#00F0FF]'
                      : 'text-slate-300'
                  }
                >
                  {line}
                </div>
              );
            })}
          </div>

          {/* Tarjeta de confirmación post-lote */}
          {lastBatchSummary && (
            <div className="p-4 rounded-lg bg-[#00FF9D]/10 border border-[#00FF9D]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[#00FF9D]">
                  <CheckCircle2 className="w-4 h-4" />
                  +{lastBatchSummary.generated} ENCUESTAS ANALIZADAS INTEGRADAS AL DATASET GLOBAL
                </div>
                <p className="text-xs text-slate-300 font-mono tabular-nums">
                  Reconocimiento Somos: {lastBatchSummary.somosYesPct}% · Entidad principal:{' '}
                  {lastBatchSummary.topState}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigateModule('DASHBOARD')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[#00F0FF] text-slate-950 text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  Ver impacto en Dashboard
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateModule('EXPLORER')}
                  className="px-3 py-1.5 rounded bg-slate-800 text-slate-200 text-xs font-medium hover:bg-slate-700 cursor-pointer whitespace-nowrap"
                >
                  Auditar registros
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
