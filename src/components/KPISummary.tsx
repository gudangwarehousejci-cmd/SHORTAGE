import React from 'react';
import { ShortageMetrics } from '../types/inventory';
import { formatCurrencyIDR, formatNumber } from '../utils/calculations';
import { AlertOctagon, AlertTriangle, Truck, CheckCircle2, Factory, Banknote } from 'lucide-react';

interface KPISummaryProps {
  metrics: ShortageMetrics;
  onFilterStatus?: (status: 'ALL' | 'KRITIS' | 'WARNING' | 'IN_TRANSIT' | 'AMAN') => void;
  activeFilter?: string;
}

export const KPISummary: React.FC<KPISummaryProps> = ({
  metrics,
  onFilterStatus,
  activeFilter = 'ALL',
}) => {
  const serviceLevel =
    metrics.totalItems > 0
      ? Math.round(((metrics.safeCount + metrics.inTransitCount) / metrics.totalItems) * 100)
      : 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Kritis */}
      <div
        id="kpi-card-critical"
        onClick={() => onFilterStatus?.('KRITIS')}
        className={`bg-white rounded-xl p-4 border transition-all cursor-pointer ${
          activeFilter === 'KRITIS'
            ? 'border-rose-500 ring-2 ring-rose-200 shadow-sm'
            : 'border-slate-200 hover:border-rose-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
            Kritis / Stop Line
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertOctagon className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900">
            {metrics.criticalCount}
          </span>
          <span className="text-xs text-slate-500 font-medium">Bahan Baku</span>
        </div>
        <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
          <span>Stok habis / sisa waktu &lt; 24 jam</span>
        </p>
      </div>

      {/* 2. Warning */}
      <div
        id="kpi-card-warning"
        onClick={() => onFilterStatus?.('WARNING')}
        className={`bg-white rounded-xl p-4 border transition-all cursor-pointer ${
          activeFilter === 'WARNING'
            ? 'border-amber-500 ring-2 ring-amber-200 shadow-sm'
            : 'border-slate-200 hover:border-amber-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
            Di Bawah Safety Stock
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900">
            {metrics.warningCount}
          </span>
          <span className="text-xs text-slate-500 font-medium">Item Perlu Reorder</span>
        </div>
        <p className="text-xs text-amber-600 mt-1 font-medium">
          Stok menipis, cukup &lt; 3 hari produksi
        </p>
      </div>

      {/* 3. In Transit PO */}
      <div
        id="kpi-card-intransit"
        onClick={() => onFilterStatus?.('IN_TRANSIT')}
        className={`bg-white rounded-xl p-4 border transition-all cursor-pointer ${
          activeFilter === 'IN_TRANSIT'
            ? 'border-sky-500 ring-2 ring-sky-200 shadow-sm'
            : 'border-slate-200 hover:border-sky-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-sky-700 uppercase tracking-wider">
            PO Dalam Pengiriman
          </span>
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900">
            {metrics.inTransitCount}
          </span>
          <span className="text-xs text-slate-500 font-medium">Item On-The-Way</span>
        </div>
        <p className="text-xs text-sky-600 mt-1 font-medium">
          Menunggu kedatangan armada supplier
        </p>
      </div>

      {/* 4. Safe / Service Level */}
      <div
        id="kpi-card-safe"
        onClick={() => onFilterStatus?.('AMAN')}
        className={`bg-white rounded-xl p-4 border transition-all cursor-pointer ${
          activeFilter === 'AMAN'
            ? 'border-emerald-500 ring-2 ring-emerald-200 shadow-sm'
            : 'border-slate-200 hover:border-emerald-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            Kesiapan Stok Gudang
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900">
            {serviceLevel}%
          </span>
          <span className="text-xs text-slate-500 font-medium">
            ({metrics.safeCount} / {metrics.totalItems} Aman)
          </span>
        </div>
        <p className="text-xs text-emerald-600 mt-1 font-medium">
          Stok memenuhi safety stock & target SPK
        </p>
      </div>

      {/* Operational impact summary bar */}
      <div className="sm:col-span-2 lg:col-span-4 bg-slate-900 text-slate-100 rounded-xl px-4 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-800 text-amber-400">
            <Factory className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-white">Dampak Jalur Pabrik: </span>
            <span className="text-slate-300">
              Ada <strong>{metrics.affectedLinesCount} Line Produksi</strong> yang berpotensi terhambat jika material kritis tidak segera tiba.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
          <Banknote className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Estimasi Nilai Reorder Defisit: </span>
          <strong className="text-emerald-400 font-mono text-sm">
            {formatCurrencyIDR(metrics.estimatedReorderCost)}
          </strong>
        </div>
      </div>
    </div>
  );
};
