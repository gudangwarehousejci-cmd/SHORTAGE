import React from 'react';
import {
  AlertTriangle,
  Plus,
  Share2,
  Download,
  RotateCcw,
  Clock,
  Layers,
  Calendar,
  BarChart3,
  ListFilter
} from 'lucide-react';

interface HeaderProps {
  currentTab: 'matrix' | 'runout' | 'inbound' | 'analytics';
  onTabChange: (tab: 'matrix' | 'runout' | 'inbound' | 'analytics') => void;
  onOpenAddModal: () => void;
  onOpenBroadcast: () => void;
  onExportCSV: () => void;
  onResetData: () => void;
  criticalCount: number;
  totalItems: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenAddModal,
  onOpenBroadcast,
  onExportCSV,
  onResetData,
  criticalCount,
}) => {
  const [currentDateStr, setCurrentDateStr] = React.useState('');

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      };
      setCurrentDateStr(now.toLocaleDateString('id-ID', options));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      {/* Top Warning Banner if Critical Shortage Exists */}
      {criticalCount > 0 && (
        <div className="bg-rose-600 text-white px-4 py-1.5 text-xs sm:text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-4xl truncate">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 font-bold shrink-0 animate-pulse">
              !
            </span>
            <span>
              <strong>PERINGATAN GUDANG & PPIC:</strong> Terdeteksi{' '}
              <strong>{criticalCount} bahan baku</strong> berstatus <strong>KRITIS</strong> (stok 0 atau sisa waktu &lt; 24 jam). Resiko line produksi terhenti!
            </span>
          </div>
          <button
            onClick={() => onTabChange('matrix')}
            className="text-xs bg-white text-rose-700 font-semibold px-2.5 py-0.5 rounded shadow-xs hover:bg-rose-50 transition shrink-0 ml-2"
          >
            Lihat Bahan Kritis
          </button>
        </div>
      )}

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Brand & Factory Info */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-black text-xl shadow-xs shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans">
                  Sistem Shortage Bahan Baku
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Gudang & PPIC Aktif
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span>Warehouse Control Tower &bull; Monitoring Raw Material Defisit</span>
                <span className="hidden sm:inline text-slate-300">|</span>
                <span className="hidden sm:flex items-center gap-1 text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  {currentDateStr || 'Memuat waktu...'}
                </span>
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              id="btn-broadcast-wa"
              onClick={onOpenBroadcast}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
              title="Salin ringkasan pesan untuk broadcast ke WhatsApp Grup Tim/Manager"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Broadcast WA</span>
            </button>

            <button
              id="btn-export-csv"
              onClick={onExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Ekspor daftar shortage ke format CSV/Excel"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Ekspor CSV</span>
            </button>

            <button
              id="btn-reset-data"
              onClick={onResetData}
              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Reset ke data awal pabrik"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Reset</span>
            </button>

            <button
              id="btn-tambah-bahan"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer ml-auto sm:ml-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Bahan Baku</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-t border-slate-100 mt-3 pt-2 overflow-x-auto no-scrollbar">
          <button
            id="tab-matrix"
            onClick={() => onTabChange('matrix')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'matrix'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Matriks Shortage Bahan</span>
            {criticalCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                currentTab === 'matrix' ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'
              }`}>
                {criticalCount}
              </span>
            )}
          </button>

          <button
            id="tab-runout"
            onClick={() => onTabChange('runout')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'runout'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Kalkulator Run-Out (Sisa Hari)</span>
          </button>

          <button
            id="tab-inbound"
            onClick={() => onTabChange('inbound')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'inbound'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Tracking PO & Jadwal Vendor</span>
          </button>

          <button
            id="tab-analytics"
            onClick={() => onTabChange('analytics')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'analytics'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analisis & Dampak Line Produksi</span>
          </button>
        </div>
      </div>
    </header>
  );
};
