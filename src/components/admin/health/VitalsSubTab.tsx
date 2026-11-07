'use client';

import React, { useState, useMemo } from 'react';
import {
  Activity,
  Plus,
  Trash2,
  Shield,
  Clock,
  X,
} from 'lucide-react';
import { Vital, VitalType, Vaccination } from '@/types/health';

interface VitalsSubTabProps {
  vitals: Vital[];
  vaccinations: Vaccination[];
  onSaveVital: (vital: Vital) => Promise<void>;
  onDeleteVital: (id: string) => Promise<void>;
  onSaveVaccination: (vac: Vaccination) => Promise<void>;
  onDeleteVaccination: (id: string) => Promise<void>;
  onSyncVaccineReminder: (vac: Vaccination, removed?: boolean) => Promise<void>;
  showToast: (msg: string) => void;
  disabled?: boolean;
}

const METRIC_CONFIG: Record<
  VitalType,
  { label: string; unit: string; color: string; hasSecondValue?: boolean; secondLabel?: string }
> = {
  bp: {
    label: 'Blood Pressure',
    unit: 'mmHg',
    color: '#f43f5e',
    hasSecondValue: true,
    secondLabel: 'Diastolic',
  },
  weight: {
    label: 'Body Weight',
    unit: 'kg',
    color: '#38bdf8',
  },
  sugar: {
    label: 'Blood Glucose',
    unit: 'mg/dL',
    color: '#10b981',
  },
  heartRate: {
    label: 'Heart Rate',
    unit: 'BPM',
    color: '#ec4899',
  },
  temperature: {
    label: 'Body Temperature',
    unit: '°C',
    color: '#f59e0b',
  },
  custom: {
    label: 'Custom Metric',
    unit: '',
    color: '#a855f7',
  },
};

const SVG_DIMENSIONS = { width: 750, height: 260, padding: 40 };

export const VitalsSubTab: React.FC<VitalsSubTabProps> = ({
  vitals,
  vaccinations,
  onSaveVital,
  onDeleteVital,
  onSaveVaccination,
  onDeleteVaccination,
  onSyncVaccineReminder,
  showToast,
  disabled = false,
}) => {
  const [activeMetric, setActiveMetric] = useState<VitalType>('bp');
  const [rangeMode, setRangeMode] = useState<'30d' | '90d' | '1y' | 'all'>('90d');

  // Quick Add Vital Form
  const [isAddVitalOpen, setIsAddVitalOpen] = useState<boolean>(false);
  const [vitalDate, setVitalDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [vitalType, setVitalType] = useState<VitalType>('bp');
  const [vitalValue, setVitalValue] = useState<string>('');
  const [vitalValue2, setVitalValue2] = useState<string>('');
  const [vitalUnit, setVitalUnit] = useState<string>('mmHg');
  const [vitalNote, setVitalNote] = useState<string>('');
  const [vitalLabel, setVitalLabel] = useState<string>('');
  const [isSavingVital, setIsSavingVital] = useState<boolean>(false);

  // Vaccination Form
  const [isAddVaccineOpen, setIsAddVaccineOpen] = useState<boolean>(false);
  const [vaccineName, setVaccineName] = useState<string>('');
  const [vaccineDate, setVaccineDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [vaccineDueDate, setVaccineDueDate] = useState<string>('');
  const [vaccineNotes, setVaccineNotes] = useState<string>('');
  const [isSavingVaccine, setIsSavingVaccine] = useState<boolean>(false);

  // Target range state (user customizable, purely visual shading)
  const [targetMin, setTargetMin] = useState<string>('');
  const [targetMax, setTargetMax] = useState<string>('');

  // Filter vitals by metric & range
  const chartData = useMemo(() => {
    const list = vitals.filter((v) => v.type === activeMetric);

    const now = new Date();
    const cutoff = new Date();

    if (rangeMode === '30d') {
      cutoff.setDate(now.getDate() - 30);
    } else if (rangeMode === '90d') {
      cutoff.setDate(now.getDate() - 90);
    } else if (rangeMode === '1y') {
      cutoff.setFullYear(now.getFullYear() - 1);
    } else {
      cutoff.setTime(0);
    }

    return list
      .filter((v) => new Date(v.date) >= cutoff)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [vitals, activeMetric, rangeMode]);

  const chartCalculations = useMemo(() => {
    if (chartData.length === 0) return null;

    const allValues: number[] = [];
    chartData.forEach((d) => {
      allValues.push(d.value);
      if (d.value2 !== undefined) allValues.push(d.value2);
    });

    if (targetMin && !isNaN(Number(targetMin))) allValues.push(Number(targetMin));
    if (targetMax && !isNaN(Number(targetMax))) allValues.push(Number(targetMax));

    const minVal = Math.floor(Math.min(...allValues) * 0.95);
    const maxVal = Math.ceil(Math.max(...allValues) * 1.05) || 100;
    const valueRange = maxVal - minVal || 1;

    const { width, height, padding } = SVG_DIMENSIONS;
    const innerW = width - padding * 2;
    const innerH = height - padding * 2;

    const getX = (index: number) => {
      if (chartData.length === 1) return padding + innerW / 2;
      return padding + (index / (chartData.length - 1)) * innerW;
    };

    const getY = (val: number) => {
      return height - padding - ((val - minVal) / valueRange) * innerH;
    };

    // Build line paths
    const pts1 = chartData.map((d, i) => ({ x: getX(i), y: getY(d.value), val: d.value, date: d.date }));
    const pts2 = activeMetric === 'bp'
      ? chartData.map((d, i) => ({
          x: getX(i),
          y: getY(d.value2 || 0),
          val: d.value2 || 0,
          date: d.date,
        }))
      : [];

    const linePath1 = pts1.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
    const linePath2 = pts2.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');

    // Area fill for single metric
    const areaPath1 =
      pts1.length > 1
        ? `${linePath1} L ${pts1[pts1.length - 1].x} ${height - padding} L ${pts1[0].x} ${height - padding} Z`
        : '';

    // Target Range Shading
    let targetYTop: number | null = null;
    let targetYBottom: number | null = null;
    if (targetMax && !isNaN(Number(targetMax))) targetYTop = getY(Number(targetMax));
    if (targetMin && !isNaN(Number(targetMin))) targetYBottom = getY(Number(targetMin));

    return {
      minVal,
      maxVal,
      pts1,
      pts2,
      linePath1,
      linePath2,
      areaPath1,
      targetYTop,
      targetYBottom,
    };
  }, [chartData, activeMetric, targetMin, targetMax]);

  // Submit new vital measurement
  const handleSaveVitalSubmit = async () => {
    if (disabled) return;
    const val = parseFloat(vitalValue);
    if (isNaN(val)) {
      showToast('✕ Valid numeric value is required');
      return;
    }

    let val2: number | undefined = undefined;
    if (vitalType === 'bp') {
      const parsedVal2 = parseFloat(vitalValue2);
      if (isNaN(parsedVal2)) {
        showToast('✕ Diastolic value is required for BP');
        return;
      }
      val2 = parsedVal2;
    }

    setIsSavingVital(true);
    try {
      const newVital: Vital = {
        id: crypto.randomUUID(),
        date: vitalDate,
        type: vitalType,
        value: val,
        value2: val2,
        unit: vitalUnit || METRIC_CONFIG[vitalType].unit,
        label: vitalType === 'custom' ? vitalLabel.trim() : undefined,
        note: vitalNote.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      await onSaveVital(newVital);
      showToast('✓ Measurement recorded');
      setIsAddVitalOpen(false);
      setVitalValue('');
      setVitalValue2('');
      setVitalNote('');
    } catch {
      showToast('✕ Save failed, retry');
    } finally {
      setIsSavingVital(false);
    }
  };

  // Submit new vaccination
  const handleSaveVaccineSubmit = async () => {
    if (disabled) return;
    if (!vaccineName.trim()) {
      showToast('✕ Vaccine name is required');
      return;
    }

    setIsSavingVaccine(true);
    try {
      const vacItem: Vaccination = {
        id: crypto.randomUUID(),
        name: vaccineName.trim(),
        date: vaccineDate || undefined,
        nextDueDate: vaccineDueDate || undefined,
        notes: vaccineNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      await onSaveVaccination(vacItem);
      await onSyncVaccineReminder(vacItem, !vacItem.nextDueDate);
      showToast('✓ Vaccination saved');
      setIsAddVaccineOpen(false);
      setVaccineName('');
      setVaccineDueDate('');
      setVaccineNotes('');
    } catch {
      showToast('✕ Save failed, retry');
    } finally {
      setIsSavingVaccine(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Metric Switcher Toolbar & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Metric Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 [scrollbar-width:none]">
          {(['bp', 'weight', 'sugar', 'heartRate', 'temperature'] as VitalType[]).map((type) => {
            const cfg = METRIC_CONFIG[type];
            const isSelected = activeMetric === type;
            const count = vitals.filter((v) => v.type === type).length;

            return (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setActiveMetric(type);
                  setVitalType(type);
                  setVitalUnit(cfg.unit);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-surface text-ink border border-line shadow-xs font-bold'
                    : 'text-ink-3 hover:text-ink hover:bg-surface-2'
                }`}
              >
                <span>{cfg.label}</span>
                {count > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-surface-3 text-ink-4">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Action Button: Add Measurement */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (disabled) return;
              setVitalType(activeMetric);
              setVitalUnit(METRIC_CONFIG[activeMetric].unit);
              setIsAddVitalOpen(true);
            }}
            disabled={disabled}
            className="btn btn-primary h-8.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="size-3.5" />
            <span>Add Measurement</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Inline-SVG Trend Chart */}
      <div className="p-4 sm:p-6 rounded-3xl bg-surface/80 border border-line shadow-xs space-y-4">
        {/* Chart Header: Title, Range Selector, Target Inputs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="size-4" style={{ color: METRIC_CONFIG[activeMetric].color }} />
              <h3 className="text-sm font-bold text-ink">
                {METRIC_CONFIG[activeMetric].label} Trend
              </h3>
              <span className="text-xs text-ink-4 font-mono">
                ({METRIC_CONFIG[activeMetric].unit})
              </span>
            </div>
            {activeMetric === 'bp' ? (
              <div className="flex items-center gap-3 text-xs mt-1">
                <span className="flex items-center gap-1 font-semibold text-rose-500">
                  <span className="size-2 rounded-full bg-rose-500" /> Systolic
                </span>
                <span className="flex items-center gap-1 font-semibold text-sky-400">
                  <span className="size-2 rounded-full bg-sky-400" /> Diastolic
                </span>
              </div>
            ) : (
              <p className="text-xs text-ink-4 mt-0.5">
                {chartData.length} records in selected timeframe
              </p>
            )}
          </div>

          {/* Range Selector & Target Shading */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex p-0.5 bg-surface-2 border border-line rounded-xl text-xs">
              {(['30d', '90d', '1y', 'all'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRangeMode(r)}
                  className={`px-2.5 py-1 rounded-lg font-mono font-semibold transition-all cursor-pointer ${
                    rangeMode === r ? 'bg-surface text-ink shadow-2xs font-bold' : 'text-ink-4 hover:text-ink'
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Optional Personal Target Shading */}
            <div className="flex items-center gap-1 text-xs bg-surface-2/60 px-2 py-1 rounded-xl border border-line">
              <span className="text-ink-4 text-[11px]">Target:</span>
              <input
                type="number"
                placeholder="Min"
                value={targetMin}
                onChange={(e) => setTargetMin(e.target.value)}
                className="w-12 h-6 px-1 text-xs text-center rounded border border-line bg-surface text-ink font-mono"
                title="Personal minimum target threshold"
              />
              <span className="text-ink-4">-</span>
              <input
                type="number"
                placeholder="Max"
                value={targetMax}
                onChange={(e) => setTargetMax(e.target.value)}
                className="w-12 h-6 px-1 text-xs text-center rounded border border-line bg-surface text-ink font-mono"
                title="Personal maximum target threshold"
              />
            </div>
          </div>
        </div>

        {/* Native SVG Chart Area */}
        <div className="w-full overflow-x-auto">
          {chartCalculations && chartData.length > 0 ? (
            <svg
              viewBox={`0 0 ${SVG_DIMENSIONS.width} ${SVG_DIMENSIONS.height}`}
              className="w-full h-auto min-w-[500px]"
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={METRIC_CONFIG[activeMetric].color}
                    stopOpacity="0.25"
                  />
                  <stop
                    offset="100%"
                    stopColor={METRIC_CONFIG[activeMetric].color}
                    stopOpacity="0.0"
                  />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line
                x1={SVG_DIMENSIONS.padding}
                y1={SVG_DIMENSIONS.padding}
                x2={SVG_DIMENSIONS.width - SVG_DIMENSIONS.padding}
                y2={SVG_DIMENSIONS.padding}
                stroke="currentColor"
                className="text-line"
                strokeDasharray="4 4"
              />
              <line
                x1={SVG_DIMENSIONS.padding}
                y1={SVG_DIMENSIONS.height / 2}
                x2={SVG_DIMENSIONS.width - SVG_DIMENSIONS.padding}
                y2={SVG_DIMENSIONS.height / 2}
                stroke="currentColor"
                className="text-line"
                strokeDasharray="4 4"
              />
              <line
                x1={SVG_DIMENSIONS.padding}
                y1={SVG_DIMENSIONS.height - SVG_DIMENSIONS.padding}
                x2={SVG_DIMENSIONS.width - SVG_DIMENSIONS.padding}
                y2={SVG_DIMENSIONS.height - SVG_DIMENSIONS.padding}
                stroke="currentColor"
                className="text-line"
              />

              {/* Min & Max Y-Axis Labels */}
              <text
                x={SVG_DIMENSIONS.padding - 8}
                y={SVG_DIMENSIONS.padding + 4}
                textAnchor="end"
                className="text-[11px] font-mono fill-current text-ink-4"
              >
                {chartCalculations.maxVal}
              </text>
              <text
                x={SVG_DIMENSIONS.padding - 8}
                y={SVG_DIMENSIONS.height - SVG_DIMENSIONS.padding + 4}
                textAnchor="end"
                className="text-[11px] font-mono fill-current text-ink-4"
              >
                {chartCalculations.minVal}
              </text>

              {/* Target Range Shaded Area */}
              {chartCalculations.targetYTop !== null &&
                chartCalculations.targetYBottom !== null && (
                  <rect
                    x={SVG_DIMENSIONS.padding}
                    y={Math.min(chartCalculations.targetYTop, chartCalculations.targetYBottom)}
                    width={SVG_DIMENSIONS.width - SVG_DIMENSIONS.padding * 2}
                    height={Math.abs(
                      chartCalculations.targetYBottom - chartCalculations.targetYTop
                    )}
                    fill="#10b981"
                    fillOpacity="0.08"
                    stroke="#10b981"
                    strokeOpacity="0.2"
                    strokeDasharray="3 3"
                  />
                )}

              {/* Area fill for single metric */}
              {activeMetric !== 'bp' && chartCalculations.areaPath1 && (
                <path d={chartCalculations.areaPath1} fill="url(#areaGradient)" />
              )}

              {/* Line 1 (Main / Systolic) */}
              <path
                d={chartCalculations.linePath1}
                fill="none"
                stroke={METRIC_CONFIG[activeMetric].color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Points for Line 1 */}
              {chartCalculations.pts1.map((p, idx) => (
                <g key={idx}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill={METRIC_CONFIG[activeMetric].color}
                    className="hover:r-6 transition-all"
                  />
                  <text
                    x={p.x}
                    y={p.y - 8}
                    textAnchor="middle"
                    className="text-[10px] font-mono font-bold fill-current text-ink select-none"
                  >
                    {p.val}
                  </text>
                </g>
              ))}

              {/* Line 2 (Diastolic for BP) */}
              {activeMetric === 'bp' && chartCalculations.linePath2 && (
                <>
                  <path
                    d={chartCalculations.linePath2}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {chartCalculations.pts2.map((p, idx) => (
                    <g key={idx}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="4"
                        fill="#38bdf8"
                        className="hover:r-6 transition-all"
                      />
                      <text
                        x={p.x}
                        y={p.y + 16}
                        textAnchor="middle"
                        className="text-[10px] font-mono font-bold fill-current text-sky-400 select-none"
                      >
                        {p.val}
                      </text>
                    </g>
                  ))}
                </>
              )}

              {/* X-Axis Date markers */}
              {chartCalculations.pts1.map((p, idx) => {
                // Show dates periodically if many points
                if (chartCalculations.pts1.length > 8 && idx % 2 !== 0 && idx !== chartCalculations.pts1.length - 1) {
                  return null;
                }
                return (
                  <text
                    key={idx}
                    x={p.x}
                    y={SVG_DIMENSIONS.height - 15}
                    textAnchor="middle"
                    className="text-[10px] font-mono fill-current text-ink-4"
                  >
                    {p.date.split('-').slice(1).join('/')}
                  </text>
                );
              })}
            </svg>
          ) : (
            <div className="py-20 text-center text-xs text-ink-4 italic">
              No measurements logged for this metric yet. Click &ldquo;Add Measurement&rdquo; to begin tracking.
            </div>
          )}
        </div>
      </div>

      {/* 3. Measurement History Table */}
      <div className="border border-line rounded-2xl bg-surface/80 overflow-hidden space-y-0">
        <div className="p-3.5 border-b border-line flex items-center justify-between text-xs font-bold text-ink">
          <span>{METRIC_CONFIG[activeMetric].label} History Log</span>
          <span className="font-mono text-ink-4 text-[11px]">
            {chartData.length} records
          </span>
        </div>

        <div className="divide-y divide-line max-h-64 overflow-y-auto">
          {chartData.slice().reverse().map((vital) => (
            <div
              key={vital.id}
              className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-surface-2/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-ink-3">{vital.date}</span>
                <span className="font-mono font-bold text-ink">
                  {vital.type === 'bp'
                    ? `${vital.value} / ${vital.value2} ${vital.unit}`
                    : `${vital.value} ${vital.unit}`}
                </span>
                {vital.note && (
                  <span className="text-[11px] text-ink-4 italic bg-surface-2 px-2 py-0.5 rounded">
                    {vital.note}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (disabled) return;
                  if (confirm('Delete this measurement entry?')) {
                    await onDeleteVital(vital.id);
                    showToast('✓ Measurement removed');
                  }
                }}
                disabled={disabled}
                className="btn btn-secondary size-7 grid place-items-center rounded-lg text-ink-4 hover:text-rose-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete entry"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}

          {chartData.length === 0 && (
            <div className="py-8 text-center text-xs text-ink-4 italic">
              No records in this period
            </div>
          )}
        </div>
      </div>

      {/* 4. Vaccinations & Immunizations Section */}
      <div className="p-4 sm:p-6 rounded-3xl bg-surface/80 border border-line space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-amber-500" />
            <h3 className="text-sm font-bold text-ink">Vaccinations & Immunizations</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              if (disabled) return;
              setIsAddVaccineOpen(true);
            }}
            disabled={disabled}
            className="btn btn-secondary h-8 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 text-ink cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="size-3.5" />
            <span>Add Vaccine</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {vaccinations.map((vac) => (
            <div
              key={vac.id}
              className="p-3.5 rounded-2xl bg-surface-2/60 border border-line/80 space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-ink">{vac.name}</h4>
                  <button
                    type="button"
                    onClick={async () => {
                      if (disabled) return;
                      if (confirm(`Delete vaccine record "${vac.name}"?`)) {
                        await onDeleteVaccination(vac.id);
                        await onSyncVaccineReminder(vac, true);
                        showToast('✓ Vaccine record deleted');
                      }
                    }}
                    disabled={disabled}
                    className="text-ink-4 hover:text-rose-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
                {vac.date && (
                  <p className="text-[11px] text-ink-3 font-mono mt-0.5">
                    Given: {vac.date}
                  </p>
                )}
                {vac.notes && (
                  <p className="text-[11px] text-ink-4 mt-1 line-clamp-2">{vac.notes}</p>
                )}
              </div>

              {vac.nextDueDate && (
                <div className="pt-2 border-t border-line/60 text-[11px] text-amber-600 dark:text-amber-400 font-mono font-bold flex items-center gap-1">
                  <Clock className="size-3 shrink-0" />
                  <span>Next Booster: {vac.nextDueDate}</span>
                </div>
              )}
            </div>
          ))}

          {vaccinations.length === 0 && (
            <div className="col-span-full py-10 text-center text-xs text-ink-4 italic">
              No vaccination records logged. Record tetanus, COVID-19, or travel booster shots.
            </div>
          )}
        </div>
      </div>

      {/* 5. Add Vital Modal */}
      {isAddVitalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsAddVitalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-surface border border-line p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-rose-500" />
                <h3 className="text-sm font-bold text-ink">Log Health Measurement</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddVitalOpen(false)}
                className="size-7 grid place-items-center rounded-lg text-ink-4 hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-ink">Metric Type</label>
                  <select
                    value={vitalType}
                    onChange={(e) => {
                      const t = e.target.value as VitalType;
                      setVitalType(t);
                      setVitalUnit(METRIC_CONFIG[t].unit);
                    }}
                    className="w-full h-8.5 px-2 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden"
                  >
                    <option value="bp">Blood Pressure</option>
                    <option value="weight">Body Weight</option>
                    <option value="sugar">Blood Sugar</option>
                    <option value="heartRate">Heart Rate</option>
                    <option value="temperature">Temperature</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-ink">Date</label>
                  <input
                    type="date"
                    value={vitalDate}
                    onChange={(e) => setVitalDate(e.target.value)}
                    className="w-full h-8.5 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              {vitalType === 'bp' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-ink">Systolic (Top) *</label>
                    <input
                      type="number"
                      placeholder="e.g. 120"
                      value={vitalValue}
                      onChange={(e) => setVitalValue(e.target.value)}
                      className="w-full h-8.5 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-ink">Diastolic (Bottom) *</label>
                    <input
                      type="number"
                      placeholder="e.g. 80"
                      value={vitalValue2}
                      onChange={(e) => setVitalValue2(e.target.value)}
                      className="w-full h-8.5 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-ink">Value *</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 72.5"
                      value={vitalValue}
                      onChange={(e) => setVitalValue(e.target.value)}
                      className="w-full h-8.5 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-ink">Unit</label>
                    <input
                      type="text"
                      value={vitalUnit}
                      onChange={(e) => setVitalUnit(e.target.value)}
                      className="w-full h-8.5 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden font-mono"
                    />
                  </div>
                </div>
              )}

              {vitalType === 'custom' && (
                <div className="space-y-1">
                  <label className="font-semibold text-ink">Metric Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Peak Flow, Oxygen Saturation"
                    value={vitalLabel}
                    onChange={(e) => setVitalLabel(e.target.value)}
                    className="w-full h-8.5 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-ink">Context / Notes (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Fasting, Morning reading, After workout"
                  value={vitalNote}
                  onChange={(e) => setVitalNote(e.target.value)}
                  className="w-full h-8.5 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-line flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddVitalOpen(false)}
                className="btn btn-secondary h-8.5 px-3 rounded-xl text-xs font-semibold text-ink-3 hover:text-ink cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveVitalSubmit}
                disabled={isSavingVital || disabled}
                className="btn btn-primary h-8.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{isSavingVital ? 'Saving...' : 'Save Measurement'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Add Vaccination Modal */}
      {isAddVaccineOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsAddVaccineOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-surface border border-line p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-amber-500" />
                <h3 className="text-sm font-bold text-ink">Add Vaccination Record</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddVaccineOpen(false)}
                className="size-7 grid place-items-center rounded-lg text-ink-4 hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-ink">Vaccine / Immunization Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Tetanus Toxoid, COVID-19 Booster, Hepatitis B"
                  value={vaccineName}
                  onChange={(e) => setVaccineName(e.target.value)}
                  className="w-full h-8.5 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-ink">Date Administered</label>
                  <input
                    type="date"
                    value={vaccineDate}
                    onChange={(e) => setVaccineDate(e.target.value)}
                    className="w-full h-8.5 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-ink">Next Due Date / Booster</label>
                  <input
                    type="date"
                    value={vaccineDueDate}
                    onChange={(e) => setVaccineDueDate(e.target.value)}
                    className="w-full h-8.5 px-3 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-ink">Notes / Clinic (optional)</label>
                <textarea
                  rows={2}
                  placeholder="Batch number, clinic name..."
                  value={vaccineNotes}
                  onChange={(e) => setVaccineNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-line bg-surface-2 text-xs text-ink placeholder:text-ink-4 focus:outline-hidden resize-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-line flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddVaccineOpen(false)}
                className="btn btn-secondary h-8.5 px-3 rounded-xl text-xs font-semibold text-ink-3 hover:text-ink cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveVaccineSubmit}
                disabled={isSavingVaccine || disabled}
                className="btn btn-primary h-8.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{isSavingVaccine ? 'Saving...' : 'Save Vaccine'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
