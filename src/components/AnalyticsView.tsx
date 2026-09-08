import React from 'react';
import { RawMaterial } from '../types/inventory';
import {
  calculateStatus,
  calculateDeficit,
  formatCurrencyIDR,
  formatNumber,
} from '../utils/calculations';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  AlertOctagon,
  Factory,
  ShieldAlert,
  Coins,
  CheckCircle2,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';

interface AnalyticsViewProps {
  materials: RawMaterial[];
  onSelectLineFilter?: (line: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ materials }) => {
  // 1. Group by Category
  const categoryStats: { [cat: string]: { total: number; critical: number; warning: number; safe: number } } = {};
  materials.forEach((m) => {
    if (!categoryStats[m.category]) {
      categoryStats[m.category] = { total: 0, critical: 0, warning: 0, safe: 0 };
    }
    categoryStats[m.category].total++;
    const status = calculateStatus(m);
    if (status === 'KRITIS') categoryStats[m.category].critical++;
    else if (status === 'WARNING') categoryStats[m.category].warning++;
    else categoryStats[m.category].safe++;
  });

  const categoryChartData = Object.keys(categoryStats).map((cat) => ({
    name: cat,
    Kritis: categoryStats[cat].critical,
    Peringatan: categoryStats[cat].warning,
    Aman: categoryStats[cat].safe,
  }));

  // 2. Status Distribution for Pie Chart
  let criticalCount = 0;
  let warningCount = 0;
  let inTransitCount = 0;
  let safeCount = 0;

  materials.forEach((m) => {
    const s = calculateStatus(m);
    if (s === 'KRITIS') criticalCount++;
    else if (s === 'WARNING') warningCount++;
    else if (s === 'IN_TRANSIT') inTransitCount++;
    else safeCount++;
  });

  const pieData = [
    { name: 'Kritis / Habis', value: criticalCount, color: '#e11d48' },
    { name: 'Peringatan (Low)', value: warningCount, color: '#f59e0b' },
    { name: 'PO In-Transit', value: inTransitCount, color: '#0284c7' },
    { name: 'Stok Aman', value: safeCount, color: '#10b981' },
  ].filter((x) => x.value > 0);

  // 3. Line Impact Ranking
  const lineImpact: { [line: string]: { criticalItems: string[]; warningItems: string[] } } = {};
  materials.forEach((m) => {
    const status = calculateStatus(m);
    m.affectedLines.forEach((line) => {
      if (!lineImpact[line]) {
        lineImpact[line] = { criticalItems: [], warningItems: [] };
      }
      if (status === 'KRITIS') {
        lineImpact[line].criticalItems.push(m.name);
      } else if (status === 'WARNING') {
        lineImpact[line].warningItems.push(m.name);
      }
    });
  });

  const lineRanking = Object.keys(lineImpact)
    .map((line) => ({
      line,
      criticalCount: lineImpact[line].criticalItems.length,
      warningCount: lineImpact[line].warningItems.length,
      materials: [...lineImpact[line].criticalItems, ...lineImpact[line].warningItems],
    }))
    .sort((a, b) => b.criticalCount * 2 + b.warningCount - (a.criticalCount * 2 + a.warningCount));

  // 4. Financial Reorder Deficit Value per Category
  const categoryFinancialDeficit: { [cat: string]: number } = {};
  materials.forEach((m) => {
    const def = calculateDeficit(m);
    if (def > 0) {
      categoryFinancialDeficit[m.category] =
        (categoryFinancialDeficit[m.category] || 0) + def * m.unitCost;
    }
  });

  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase">
            Line Produksi Berisiko
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {lineRanking.filter((x) => x.criticalCount > 0).length} Line
          </div>
          <p className="text-[11px] text-rose-600 mt-0.5">
            Terancam berhenti beroperasi (Stop Line)
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase">
            Tingkat Shortage Pabrik
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {Math.round(((criticalCount + warningCount) / (materials.length || 1)) * 100)}%
          </div>
          <p className="text-[11px] text-amber-600 mt-0.5">
            Bahan baku di bawah batas aman
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase">
            Estimasi Reorder Defisit
          </span>
          <div className="text-xl font-bold text-emerald-700 mt-1 font-mono">
            {formatCurrencyIDR(
              Object.values(categoryFinancialDeficit).reduce((a, b) => a + b, 0)
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Nilai investasi untuk pulihkan safety stock
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase">
            Lead Time Rata-rata
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {materials.length > 0
              ? (
                  materials.reduce((acc, curr) => acc + curr.leadTimeDays, 0) /
                  materials.length
                ).toFixed(1)
              : 0}{' '}
            <span className="text-sm font-normal text-slate-500">Hari</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Waktu rata-rata pemesanan vendor tiba
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart 1: Bar Chart per Kategori */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Distribusi Status Shortage per Kategori Bahan Baku
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Komposisi material Kritis, Peringatan, dan Aman pada masing-masing divisi pabrik
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Kritis" fill="#e11d48" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Peringatan" fill="#f59e0b" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Aman" fill="#10b981" stackId="a" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Pie Chart Status */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Proporsi Status Inventori
            </h3>
            <p className="text-xs text-slate-500 mb-2">
              Kesehatan ketersediaan bahan baku pabrik
            </p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-slate-500 text-center pt-1 border-t border-slate-100">
            Total terpantau: <strong>{materials.length} Bahan Baku</strong>
          </div>
        </div>
      </div>

      {/* Line Produksi Risk Ranking */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Factory className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Peringkat Risiko Stop-Line Produksi (Impact Analysis)
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Diurutkan berdasarkan keparahan defisit material
          </span>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {lineRanking.map((item, idx) => (
            <div
              key={item.line}
              className={`p-3.5 rounded-xl border transition-all ${
                item.criticalCount > 0
                  ? 'border-rose-300 bg-rose-50/30'
                  : item.warningCount > 0
                  ? 'border-amber-200 bg-amber-50/20'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${
                    item.criticalCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'
                  }`} />
                  {item.line}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  item.criticalCount > 0
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {item.criticalCount > 0 ? 'STATUS DARURAT' : 'WASPADA'}
                </span>
              </div>

              <div className="mt-2.5 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Material Kritis (Habis):</span>
                  <strong className="text-rose-600">{item.criticalCount} item</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Material Low-Stock:</span>
                  <strong className="text-amber-600">{item.warningCount} item</strong>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-200/60">
                <span className="text-[10px] text-slate-400 font-semibold block mb-1">
                  Material Penyebab Shortage:
                </span>
                <div className="flex flex-wrap gap-1">
                  {item.materials.slice(0, 3).map((matName, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded truncate max-w-[180px]"
                      title={matName}
                    >
                      {matName}
                    </span>
                  ))}
                  {item.materials.length > 3 && (
                    <span className="text-[10px] text-slate-500 font-medium px-1">
                      +{item.materials.length - 3} lainnya
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
