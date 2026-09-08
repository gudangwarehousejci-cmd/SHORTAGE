import React, { useState, useMemo } from 'react';
import {
  RawMaterial,
  MaterialCategory,
  MaterialUnit,
  POStatus,
  ShortageStatus,
} from '../types/inventory';
import {
  calculateStatus,
  calculateDaysOfInventory,
  calculateDeficit,
  getStatusBadgeConfig,
  getPOStatusBadge,
  formatNumber,
} from '../utils/calculations';
import {
  Search,
  SlidersHorizontal,
  PlusCircle,
  Truck,
  Edit2,
  Trash2,
  AlertCircle,
  Clock,
  ArrowUpDown,
  PhoneCall,
  MapPin,
  CheckCircle,
  Check,
  X,
  Save,
  Plus,
} from 'lucide-react';

interface ShortageTableProps {
  materials: RawMaterial[];
  onOpenQuickStock: (material: RawMaterial) => void;
  onOpenPOTracking: (material: RawMaterial) => void;
  onEditMaterial: (material: RawMaterial) => void;
  onDeleteMaterial: (materialId: string) => void;
  onSaveInlineMaterial?: (material: RawMaterial) => void;
  onOpenAddModal?: () => void;
  filterStatus: 'ALL' | 'KRITIS' | 'WARNING' | 'IN_TRANSIT' | 'AMAN';
  setFilterStatus: (status: 'ALL' | 'KRITIS' | 'WARNING' | 'IN_TRANSIT' | 'AMAN') => void;
}

export const ShortageTable: React.FC<ShortageTableProps> = ({
  materials,
  onOpenQuickStock,
  onOpenPOTracking,
  onEditMaterial,
  onDeleteMaterial,
  onSaveInlineMaterial,
  onOpenAddModal,
  filterStatus,
  setFilterStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'deficit' | 'doi' | 'stock' | 'name'>('deficit');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Inline Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftRow, setDraftRow] = useState<RawMaterial | null>(null);

  // Categories list
  const categories: ('ALL' | MaterialCategory)[] = [
    'ALL',
    'Logam & Plat',
    'Plastik & Polimer',
    'Komponen Mekanikal',
    'Kimia & Cairan',
    'Elektrik & Kabel',
    'Packaging & Box',
    'Lainnya',
  ];

  // Units list
  const units: MaterialUnit[] = ['Kg', 'Pcs', 'Roll', 'Drum', 'Liter', 'Sak', 'Meter', 'Lembar', 'Set'];

  // PO Statuses
  const poStatuses: { value: POStatus; label: string }[] = [
    { value: 'NONE', label: 'Belum PO' },
    { value: 'DRAFT', label: 'Draft PO' },
    { value: 'PO_SENT', label: 'PO Terkirim' },
    { value: 'IN_TRANSIT', label: 'In Transit' },
    { value: 'PARTIAL_RECEIVED', label: 'Parsial' },
    { value: 'DELAYED', label: 'Tertunda / Delay' },
    { value: 'RECEIVED', label: 'Diterima' },
  ];

  // Handlers for Inline Edit
  const handleStartEdit = (mat: RawMaterial) => {
    setEditingId(mat.id);
    setDraftRow({ ...mat });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDraftRow(null);
  };

  const handleSaveEdit = () => {
    if (!draftRow) return;
    if (!draftRow.name.trim()) {
      alert('Nama bahan baku tidak boleh kosong!');
      return;
    }

    if (onSaveInlineMaterial) {
      onSaveInlineMaterial(draftRow);
    }
    setEditingId(null);
    setDraftRow(null);
  };

  const handleDelete = (mat: RawMaterial) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus bahan baku "${mat.name}" dari matriks shortage?`)) {
      if (editingId === mat.id) {
        handleCancelEdit();
      }
      onDeleteMaterial(mat.id);
    }
  };

  // Filtering & Sorting
  const filteredMaterials = useMemo(() => {
    return materials
      .filter((m) => {
        // Status Filter
        const status = calculateStatus(m);
        if (filterStatus !== 'ALL' && status !== filterStatus) {
          return false;
        }
        // Category Filter
        if (selectedCategory !== 'ALL' && m.category !== selectedCategory) {
          return false;
        }
        // Search
        if (searchTerm.trim() !== '') {
          const q = searchTerm.toLowerCase();
          const matchName = m.name.toLowerCase().includes(q);
          const matchSupplier = m.supplier.toLowerCase().includes(q);
          const matchLocation = m.storageLocation.toLowerCase().includes(q);
          const matchLine = m.affectedLines.some((l) => l.toLowerCase().includes(q));
          return matchName || matchSupplier || matchLocation || matchLine;
        }
        return true;
      })
      .sort((a, b) => {
        const defA = calculateDeficit(a);
        const defB = calculateDeficit(b);
        const doiA = calculateDaysOfInventory(a.currentStock, a.dailyRequirement);
        const doiB = calculateDaysOfInventory(b.currentStock, b.dailyRequirement);

        if (sortBy === 'deficit') {
          return sortOrder === 'desc' ? defB - defA : defA - defB;
        }
        if (sortBy === 'doi') {
          return sortOrder === 'desc' ? doiB - doiA : doiA - doiB;
        }
        if (sortBy === 'stock') {
          return sortOrder === 'desc' ? b.currentStock - a.currentStock : a.currentStock - b.currentStock;
        }
        if (sortBy === 'name') {
          return sortOrder === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [materials, filterStatus, selectedCategory, searchTerm, sortBy, sortOrder]);

  const toggleSort = (type: 'deficit' | 'doi' | 'stock' | 'name') => {
    if (sortBy === type) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(type);
      setSortOrder(type === 'name' ? 'asc' : 'desc');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Active Edit Alert Banner */}
      {editingId && draftRow && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-amber-200 text-amber-900 rounded font-bold text-[10px]">MODE EDIT AKTIF</span>
            <span>
              Anda sedang mengedit <strong>{draftRow.name}</strong>. Klik <strong>Simpan</strong> di baris tabel untuk menyimpan atau <strong>Batal</strong>.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveEdit}
              className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs shadow-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" /> Simpan Sekarang
            </button>
            <button
              onClick={handleCancelEdit}
              className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded font-medium text-xs cursor-pointer"
            >
              <X className="w-3 h-3" /> Batal
            </button>
          </div>
        </div>
      )}

      {/* Controls & Filter Toolbar */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-bahan"
              type="text"
              placeholder="Cari nama bahan baku, supplier, rak gudang, line..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Right Toolbar Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenAddModal && (
              <button
                onClick={onOpenAddModal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                title="Tambah Bahan Baku Baru"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Bahan</span>
              </button>
            )}

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {(
                [
                  { key: 'ALL', label: 'Semua' },
                  { key: 'KRITIS', label: 'Kritis' },
                  { key: 'WARNING', label: 'Peringatan' },
                  { key: 'IN_TRANSIT', label: 'In Transit' },
                  { key: 'AMAN', label: 'Aman' },
                ] as const
              ).map((statusOption) => (
                <button
                  key={statusOption.key}
                  id={`filter-status-${statusOption.key.toLowerCase()}`}
                  onClick={() => setFilterStatus(statusOption.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    filterStatus === statusOption.key
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {statusOption.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Second row: Category pills & Sort options */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-200/50">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" /> Kategori:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-[11px] px-2.5 py-1 rounded-md transition font-medium whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat === 'ALL' ? 'Semua Kategori' : cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
            <span>Ditemukan: <strong className="text-slate-800">{filteredMaterials.length}</strong> bahan baku</span>
          </div>
        </div>
      </div>

      {/* Table Main View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold">
              <th className="py-3 px-4 min-w-[240px]">
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <button
                    onClick={() => toggleSort('name')}
                    className="flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                  >
                    <span>Bahan Baku</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                  <span className="text-[10px] font-normal text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                    Edit &bull; Hapus &bull; Simpan
                  </span>
                </div>
              </th>
              <th className="py-3 px-3 min-w-[130px]">Status Shortage</th>
              <th className="py-3 px-3 min-w-[180px]">
                <button
                  onClick={() => toggleSort('stock')}
                  className="flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                >
                  <span>Stok vs Safety Stock</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-3 px-3 min-w-[130px]">
                <button
                  onClick={() => toggleSort('doi')}
                  className="flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                >
                  <span>Run-Out (Sisa Waktu)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-3 px-3 min-w-[120px]">
                <button
                  onClick={() => toggleSort('deficit')}
                  className="flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                >
                  <span>Defisit Kebutuhan</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </button>
              </th>
              <th className="py-3 px-3 min-w-[150px]">Line Terdampak</th>
              <th className="py-3 px-3 min-w-[180px]">PO & Kedatangan (ETA)</th>
              <th className="py-3 px-4 text-right min-w-[220px]">Aksi (Edit / Hapus / Simpan)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/75">
            {filteredMaterials.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="w-8 h-8 text-slate-300" />
                    <p className="font-semibold text-slate-600 text-sm">
                      Tidak ada bahan baku yang cocok dengan filter.
                    </p>
                    <p className="text-xs text-slate-400">
                      Coba ganti filter status atau ubah kata kunci pencarian.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredMaterials.map((mat) => {
                const isEditing = editingId === mat.id && draftRow !== null;

                if (isEditing && draftRow) {
                  // --- INLINE EDITING ROW ---
                  const liveStatus = calculateStatus(draftRow);
                  const liveStatusConfig = getStatusBadgeConfig(liveStatus);
                  const liveDaysOfInv = calculateDaysOfInventory(draftRow.currentStock, draftRow.dailyRequirement);
                  const liveDeficit = calculateDeficit(draftRow);

                  return (
                    <tr
                      key={mat.id}
                      id={`row-material-editing-${mat.id}`}
                      className="bg-amber-50/40 border-y-2 border-amber-400 transition-colors"
                    >
                      {/* Material Info Edit */}
                      <td className="py-3 px-4 align-top">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold text-amber-900 bg-amber-200/80 px-1.5 py-0.5 rounded uppercase tracking-wider">
                              Edit Bahan Baku
                            </span>
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Nama Bahan Baku:</label>
                            <input
                              type="text"
                              value={draftRow.name}
                              onChange={(e) => setDraftRow({ ...draftRow, name: e.target.value })}
                              placeholder="Nama Bahan Baku"
                              className="w-full text-xs font-semibold px-2 py-1 bg-white border border-amber-300 rounded focus:ring-2 focus:ring-amber-500"
                              title="Nama Bahan Baku"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Kategori Material:</label>
                            <select
                              value={draftRow.category}
                              onChange={(e) =>
                                setDraftRow({ ...draftRow, category: e.target.value as MaterialCategory })
                              }
                              className="text-[11px] px-2 py-1 bg-white border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 w-full"
                              title="Kategori Material"
                            >
                              {categories
                                .filter((c) => c !== 'ALL')
                                .map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                            <div>
                              <label className="text-[10px] text-slate-500 block">Lokasi Rak:</label>
                              <input
                                type="text"
                                value={draftRow.storageLocation}
                                onChange={(e) =>
                                  setDraftRow({ ...draftRow, storageLocation: e.target.value })
                                }
                                placeholder="Lokasi Rak"
                                className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded text-[11px]"
                                title="Lokasi Penyimpanan"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 block">Supplier:</label>
                              <input
                                type="text"
                                value={draftRow.supplier}
                                onChange={(e) => setDraftRow({ ...draftRow, supplier: e.target.value })}
                                placeholder="Nama Supplier"
                                className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded text-[11px]"
                                title="Nama Supplier"
                              />
                            </div>
                          </div>

                          {/* Tombol Langsung: SIMPAN, BATAL, HAPUS pada kolom Bahan Baku */}
                          <div className="pt-1.5 border-t border-amber-200/90 flex items-center gap-1.5">
                            <button
                              id={`btn-save-mat-col-${mat.id}`}
                              onClick={handleSaveEdit}
                              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-xs shadow-xs transition-colors cursor-pointer"
                              title="Simpan perubahan Bahan Baku"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Simpan</span>
                            </button>
                            <button
                              id={`btn-cancel-mat-col-${mat.id}`}
                              onClick={handleCancelEdit}
                              className="flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md font-medium text-xs transition-colors cursor-pointer"
                              title="Batal edit"
                            >
                              <X className="w-3 h-3" />
                              <span>Batal</span>
                            </button>
                            <button
                              id={`btn-delete-mat-col-${mat.id}`}
                              onClick={() => handleDelete(mat)}
                              className="flex items-center justify-center gap-1 px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-md font-medium text-xs transition-colors cursor-pointer"
                              title="Hapus Bahan Baku ini"
                            >
                              <Trash2 className="w-3 h-3 text-rose-500" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Status Shortage (Live Preview) */}
                      <td className="py-3 px-3 align-top">
                        <div className="space-y-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${liveStatusConfig.bg} ${liveStatusConfig.glow}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${liveStatusConfig.dotBg}`} />
                            {liveStatusConfig.label} (Live)
                          </span>
                          <input
                            type="text"
                            value={draftRow.notes || ''}
                            onChange={(e) => setDraftRow({ ...draftRow, notes: e.target.value })}
                            placeholder="Catatan kendala..."
                            className="w-full text-[11px] px-1.5 py-1 bg-white border border-slate-300 rounded"
                            title="Catatan Tambahan"
                          />
                        </div>
                      </td>

                      {/* Stock vs Safety Edit */}
                      <td className="py-3 px-3 align-top">
                        <div className="space-y-1 text-[11px] bg-white p-2 rounded border border-amber-200 shadow-2xs">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-slate-700">Stok:</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={draftRow.currentStock}
                                onChange={(e) =>
                                  setDraftRow({
                                    ...draftRow,
                                    currentStock: Math.max(0, parseFloat(e.target.value) || 0),
                                  })
                                }
                                className="w-20 px-1.5 py-0.5 font-bold text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white text-right"
                              />
                              <select
                                value={draftRow.unit}
                                onChange={(e) =>
                                  setDraftRow({ ...draftRow, unit: e.target.value as MaterialUnit })
                                }
                                className="text-[10px] px-1 py-0.5 bg-slate-50 border border-slate-300 rounded"
                              >
                                {units.map((u) => (
                                  <option key={u} value={u}>
                                    {u}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-1">
                            <span className="text-slate-500">Min/SS:</span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={draftRow.safetyStock}
                              onChange={(e) =>
                                setDraftRow({
                                  ...draftRow,
                                  safetyStock: Math.max(0, parseFloat(e.target.value) || 0),
                                })
                              }
                              className="w-20 px-1.5 py-0.5 text-[11px] bg-slate-50 border border-slate-300 rounded focus:bg-white text-right"
                            />
                          </div>

                          <div className="flex items-center justify-between gap-1">
                            <span className="text-slate-500">Pakai/hr:</span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={draftRow.dailyRequirement}
                              onChange={(e) =>
                                setDraftRow({
                                  ...draftRow,
                                  dailyRequirement: Math.max(0, parseFloat(e.target.value) || 0),
                                })
                              }
                              className="w-20 px-1.5 py-0.5 text-[11px] bg-slate-50 border border-slate-300 rounded focus:bg-white text-right"
                            />
                          </div>

                          <div className="flex items-center justify-between gap-1">
                            <span className="text-slate-500">SPK/WIP:</span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={draftRow.allocatedProduction}
                              onChange={(e) =>
                                setDraftRow({
                                  ...draftRow,
                                  allocatedProduction: Math.max(0, parseFloat(e.target.value) || 0),
                                })
                              }
                              className="w-20 px-1.5 py-0.5 text-[11px] bg-slate-50 border border-slate-300 rounded focus:bg-white text-right"
                            />
                          </div>
                        </div>
                      </td>

                      {/* Run-Out Live */}
                      <td className="py-3 px-3 align-top">
                        <div className="space-y-1.5">
                          <div>
                            <span
                              className={`inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded border ${
                                liveDaysOfInv < 1
                                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                                  : liveDaysOfInv < 3
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              <Clock className="w-3 h-3" /> {liveDaysOfInv} Hari
                            </span>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 block">Lead Time:</label>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="1"
                                value={draftRow.leadTimeDays}
                                onChange={(e) =>
                                  setDraftRow({
                                    ...draftRow,
                                    leadTimeDays: Math.max(1, parseInt(e.target.value) || 1),
                                  })
                                }
                                className="w-14 px-1.5 py-0.5 text-xs bg-white border border-slate-300 rounded"
                              />
                              <span className="text-[10px] text-slate-400">hari</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Defisit Kebutuhan Live */}
                      <td className="py-3 px-3 align-top">
                        <div className="space-y-1">
                          {liveDeficit > 0 ? (
                            <div>
                              <span className="font-bold text-rose-600 text-xs font-mono">
                                -{formatNumber(liveDeficit)} {draftRow.unit}
                              </span>
                              <p className="text-[10px] text-slate-500">Perlu reorder</p>
                            </div>
                          ) : (
                            <span className="text-emerald-600 font-medium text-xs">Tercukupi (0)</span>
                          )}
                        </div>
                      </td>

                      {/* Line Terdampak Edit */}
                      <td className="py-3 px-3 align-top">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 block">Line (koma):</label>
                          <input
                            type="text"
                            value={draftRow.affectedLines.join(', ')}
                            onChange={(e) =>
                              setDraftRow({
                                ...draftRow,
                                affectedLines: e.target.value
                                  .split(',')
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              })
                            }
                            placeholder="Line 1, Line 2..."
                            className="w-full text-xs px-2 py-1 bg-white border border-slate-300 rounded"
                          />
                        </div>
                      </td>

                      {/* PO & Inbound Edit */}
                      <td className="py-3 px-3 align-top">
                        <div className="space-y-1 text-[11px] bg-white p-2 rounded border border-slate-200">
                          <select
                            value={draftRow.poStatus}
                            onChange={(e) =>
                              setDraftRow({ ...draftRow, poStatus: e.target.value as POStatus })
                            }
                            className="w-full text-[10px] px-1.5 py-1 bg-slate-50 border border-slate-300 rounded"
                          >
                            {poStatuses.map((pos) => (
                              <option key={pos.value} value={pos.value}>
                                {pos.label}
                              </option>
                            ))}
                          </select>

                          <input
                            type="text"
                            value={draftRow.poNumber || ''}
                            onChange={(e) => setDraftRow({ ...draftRow, poNumber: e.target.value })}
                            placeholder="No. PO (e.g. PO-2026-001)"
                            className="w-full text-[10px] px-1.5 py-0.5 bg-slate-50 border border-slate-300 rounded"
                          />

                          <div className="grid grid-cols-2 gap-1">
                            <input
                              type="number"
                              min="0"
                              value={draftRow.poQuantity || 0}
                              onChange={(e) =>
                                setDraftRow({
                                  ...draftRow,
                                  poQuantity: parseFloat(e.target.value) || 0,
                                })
                              }
                              placeholder="Qty PO"
                              className="text-[10px] px-1.5 py-0.5 bg-slate-50 border border-slate-300 rounded"
                            />
                            <input
                              type="date"
                              value={draftRow.etaDate || ''}
                              onChange={(e) => setDraftRow({ ...draftRow, etaDate: e.target.value })}
                              className="text-[10px] px-1 py-0.5 bg-slate-50 border border-slate-300 rounded"
                            />
                          </div>
                        </div>
                      </td>

                      {/* Actions: SIMPAN, BATAL, HAPUS */}
                      <td className="py-3 px-4 text-right align-top">
                        <div className="flex flex-col gap-1.5 w-full max-w-[150px] ml-auto">
                          {/* Tombol Simpan */}
                          <button
                            id={`btn-save-${mat.id}`}
                            onClick={handleSaveEdit}
                            className="flex items-center justify-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer"
                            title="Simpan Perubahan Bahan Baku"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Simpan</span>
                          </button>

                          {/* Tombol Batal */}
                          <button
                            id={`btn-cancel-${mat.id}`}
                            onClick={handleCancelEdit}
                            className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                            title="Batal Edit"
                          >
                            <X className="w-3 h-3" />
                            <span>Batal</span>
                          </button>

                          {/* Tombol Hapus */}
                          <button
                            id={`btn-delete-row-${mat.id}`}
                            onClick={() => handleDelete(mat)}
                            className="flex items-center justify-center gap-1 px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-50 border border-rose-200 rounded transition-colors cursor-pointer"
                            title="Hapus Bahan Baku Ini"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                // --- NORMAL READ-ONLY ROW ---
                const status = calculateStatus(mat);
                const statusConfig = getStatusBadgeConfig(status);
                const daysOfInv = calculateDaysOfInventory(mat.currentStock, mat.dailyRequirement);
                const deficit = calculateDeficit(mat);
                const poConfig = getPOStatusBadge(mat.poStatus);

                // Stock progress ratio relative to Safety Stock
                const stockRatio =
                  mat.safetyStock > 0 ? (mat.currentStock / mat.safetyStock) * 100 : 100;
                const cappedRatio = Math.min(100, Math.max(0, stockRatio));

                return (
                  <tr
                    key={mat.id}
                    id={`row-material-${mat.id}`}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      status === 'KRITIS' ? 'bg-rose-50/20' : ''
                    }`}
                  >
                    {/* Material Info */}
                    <td className="py-3 px-4 align-top">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                            {mat.category}
                          </span>

                          {/* Tombol Langsung: Edit & Hapus pada Bahan Baku */}
                          <div className="flex items-center gap-1">
                            <button
                              id={`btn-edit-mat-${mat.id}`}
                              onClick={() => handleStartEdit(mat)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 border border-slate-300 rounded transition-colors cursor-pointer"
                              title="Edit Bahan Baku"
                            >
                              <Edit2 className="w-2.5 h-2.5 text-slate-600" />
                              <span>Edit</span>
                            </button>
                            <button
                              id={`btn-delete-mat-${mat.id}`}
                              onClick={() => handleDelete(mat)}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded transition-colors cursor-pointer"
                              title="Hapus Bahan Baku"
                            >
                              <Trash2 className="w-2.5 h-2.5 text-rose-500" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>

                        <p className="font-semibold text-slate-900 text-xs leading-snug">
                          {mat.name}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                          <span className="flex items-center gap-0.5 text-slate-500">
                            <MapPin className="w-3 h-3 text-slate-400" /> {mat.storageLocation}
                          </span>
                          <span>&bull;</span>
                          <span className="truncate max-w-[160px]" title={mat.supplier}>
                            {mat.supplier}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${statusConfig.bg} ${statusConfig.glow}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotBg} ${status === 'KRITIS' ? 'animate-ping' : ''}`} />
                          {statusConfig.label}
                        </span>
                        {mat.notes && (
                          <p className="text-[10px] text-slate-500 line-clamp-1 max-w-[140px]" title={mat.notes}>
                            {mat.notes}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Stock vs Safety */}
                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        <div className="flex items-baseline justify-between text-[11px]">
                          <span className={`font-bold text-xs ${mat.currentStock === 0 ? 'text-rose-600 font-extrabold' : 'text-slate-900'}`}>
                            {formatNumber(mat.currentStock)} {mat.unit}
                          </span>
                          <span className="text-slate-400">
                            Min: {formatNumber(mat.safetyStock)}
                          </span>
                        </div>
                        {/* Visual Progress Bar */}
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              mat.currentStock === 0
                                ? 'bg-rose-500 w-1'
                                : cappedRatio < 50
                                ? 'bg-rose-500'
                                : cappedRatio < 100
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(4, cappedRatio)}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-400 flex justify-between">
                          <span>Konsumsi/hari: {formatNumber(mat.dailyRequirement)}</span>
                          <span>SPK: {formatNumber(mat.allocatedProduction)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Run-Out (Sisa Waktu) */}
                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        {mat.currentStock === 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-[11px] border border-rose-200">
                            <Clock className="w-3 h-3 animate-bounce" /> 0 Jam (HABIS!)
                          </span>
                        ) : daysOfInv < 1 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-[11px] border border-rose-200">
                            <Clock className="w-3 h-3" /> {daysOfInv} Hari (&lt; 24 Jam)
                          </span>
                        ) : daysOfInv < 3 ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-200">
                            <Clock className="w-3 h-3" /> {daysOfInv} Hari
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
                            <CheckCircle className="w-3 h-3" /> {daysOfInv} Hari
                          </span>
                        )}
                        <p className="text-[10px] text-slate-400">
                          Lead Time: {mat.leadTimeDays} hari
                        </p>
                      </div>
                    </td>

                    {/* Deficit */}
                    <td className="py-3 px-3">
                      {deficit > 0 ? (
                        <div>
                          <span className="font-bold text-rose-600 text-xs font-mono">
                            -{formatNumber(deficit)} {mat.unit}
                          </span>
                          <p className="text-[10px] text-slate-500">
                            Target reorder segera
                          </p>
                        </div>
                      ) : (
                        <span className="text-emerald-600 font-medium text-xs">
                          Tercukupi (0)
                        </span>
                      )}
                    </td>

                    {/* Affected Lines */}
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {mat.affectedLines.map((line, idx) => (
                          <span
                            key={idx}
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                              status === 'KRITIS'
                                ? 'bg-rose-100/80 text-rose-800 border-rose-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {line}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* PO & Inbound Status */}
                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        <span
                          className={`inline-block text-[10px] px-1.5 py-0.5 rounded border ${poConfig.color}`}
                        >
                          {poConfig.label}
                        </span>
                        {mat.poNumber && (
                          <p className="font-mono text-[10px] text-slate-700 font-semibold">
                            {mat.poNumber} ({formatNumber(mat.poQuantity || 0)} {mat.unit})
                          </p>
                        )}
                        {mat.etaDate && (
                          <p className="text-[10px] text-sky-700 flex items-center gap-1 font-medium">
                            <Truck className="w-3 h-3 shrink-0" />
                            <span>ETA: {mat.etaDate}</span>
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Quick Actions: EDIT, HAPUS, SIMPAN, QUICK-STOCK, PO */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Tombol Edit */}
                        <button
                          id={`btn-edit-${mat.id}`}
                          onClick={() => handleStartEdit(mat)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                          title="Edit Langsung di Tabel"
                        >
                          <Edit2 className="w-3 h-3 text-slate-600" />
                          <span>Edit</span>
                        </button>

                        {/* Tombol Hapus */}
                        <button
                          id={`btn-delete-${mat.id}`}
                          onClick={() => handleDelete(mat)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Bahan Baku dari Matriks"
                        >
                          <Trash2 className="w-3 h-3 text-rose-500" />
                          <span>Hapus</span>
                        </button>

                        {/* Quick Stock In/Out */}
                        <button
                          id={`btn-stock-${mat.id}`}
                          onClick={() => onOpenQuickStock(mat)}
                          className="p-1.5 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                          title="Update Stok Fisik Cepat (+ / - Masuk / Keluar)"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                        </button>

                        {/* PO Tracking / Update Delivery */}
                        <button
                          id={`btn-po-${mat.id}`}
                          onClick={() => onOpenPOTracking(mat)}
                          className="p-1.5 text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors cursor-pointer"
                          title="Update Status PO & Jadwal Pengiriman Supplier"
                        >
                          <Truck className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Modal Edit Detail Link */}
                      <button
                        onClick={() => onEditMaterial(mat)}
                        className="text-[10px] text-slate-400 hover:text-slate-600 underline block text-right mt-1 w-full"
                        title="Buka form modal lengkap untuk rincian lebih detail"
                      >
                        Form Modal Lengkap
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer / Summary Note */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-slate-500 text-xs flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-block w-2 h-2 rounded-full bg-rose-500"></span>
          <span>Kritis: Run-out &lt; 24 jam / Stok 0</span>
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 ml-2"></span>
          <span>Peringatan: &lt; Safety Stock / &lt; 3 hari</span>
          <span className="inline-block w-2 h-2 rounded-full bg-sky-500 ml-2"></span>
          <span>PO In-Transit</span>
        </div>
        <div>
          <span>Klik <strong>Edit</strong> pada baris untuk mengubah data dan klik <strong>Simpan</strong> untuk menerapkan.</span>
        </div>
      </div>
    </div>
  );
};
