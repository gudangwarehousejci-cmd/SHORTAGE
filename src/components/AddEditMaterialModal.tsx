import React, { useState } from 'react';
import { RawMaterial, MaterialCategory, MaterialUnit, POStatus } from '../types/inventory';
import { X, PackagePlus, AlertCircle, Trash2, Check } from 'lucide-react';

interface AddEditMaterialModalProps {
  material: RawMaterial | null; // null for Add, RawMaterial for Edit
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<RawMaterial, 'id' | 'lastUpdated'>, editingId?: string) => void;
  onDelete?: (materialId: string) => void;
}

export const AddEditMaterialModal: React.FC<AddEditMaterialModalProps> = ({
  material,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!isOpen) return null;

  const isEditing = !!material;

  const [name, setName] = useState(material?.name || '');
  const [category, setCategory] = useState<MaterialCategory>(
    material?.category || 'Logam & Plat'
  );
  const [unit, setUnit] = useState<MaterialUnit>(material?.unit || 'Kg');
  const [currentStock, setCurrentStock] = useState<number>(material?.currentStock ?? 0);
  const [safetyStock, setSafetyStock] = useState<number>(material?.safetyStock ?? 100);
  const [dailyRequirement, setDailyRequirement] = useState<number>(
    material?.dailyRequirement ?? 10
  );
  const [allocatedProduction, setAllocatedProduction] = useState<number>(
    material?.allocatedProduction ?? 0
  );
  const [unitCost, setUnitCost] = useState<number>(material?.unitCost ?? 10000);
  const [supplier, setSupplier] = useState(material?.supplier || '');
  const [supplierContact, setSupplierContact] = useState(material?.supplierContact || '');
  const [leadTimeDays, setLeadTimeDays] = useState<number>(material?.leadTimeDays ?? 3);
  const [storageLocation, setStorageLocation] = useState(
    material?.storageLocation || 'Gudang Utama - Rak A'
  );
  const [affectedLinesStr, setAffectedLinesStr] = useState(
    material?.affectedLines.join(', ') || 'Line 1, Line 2'
  );
  const [poStatus, setPoStatus] = useState<POStatus>(material?.poStatus || 'NONE');
  const [poNumber, setPoNumber] = useState(material?.poNumber || '');
  const [poQuantity, setPoQuantity] = useState<number>(material?.poQuantity || 0);
  const [etaDate, setEtaDate] = useState(material?.etaDate || '');
  const [notes, setNotes] = useState(material?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !supplier.trim()) {
      alert('Mohon isi Nama Bahan Baku dan Supplier!');
      return;
    }

    const affectedLines = affectedLinesStr
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    onSave(
      {
        sku: material?.sku || '',
        name: name.trim(),
        category,
        unit,
        currentStock: Number(currentStock) || 0,
        safetyStock: Number(safetyStock) || 0,
        dailyRequirement: Number(dailyRequirement) || 0,
        allocatedProduction: Number(allocatedProduction) || 0,
        unitCost: Number(unitCost) || 0,
        supplier: supplier.trim(),
        supplierContact: supplierContact.trim(),
        leadTimeDays: Number(leadTimeDays) || 0,
        storageLocation: storageLocation.trim(),
        affectedLines: affectedLines.length > 0 ? affectedLines : ['Line Umum'],
        poStatus,
        poNumber: poNumber.trim() || undefined,
        poQuantity: poQuantity > 0 ? poQuantity : undefined,
        etaDate: etaDate || undefined,
        notes: notes.trim() || undefined,
      },
      material?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8 overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-900 text-amber-400">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? `Edit Bahan Baku: ${material?.name || ''}` : 'Tambah Bahan Baku Baru'}
              </h3>
              <p className="text-xs text-slate-500">
                Parameter material, stok riil, safety stock, konsumsi harian, dan purchase order
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Baris 1: Nama Bahan */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Nama Bahan Baku / Deskripsi Material *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Plat Baja SPCC 1.2mm / Baut M6x20 / Resin Epoxy"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm font-medium"
            />
          </div>

          {/* Baris 2: Kategori & Satuan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Kategori Bahan:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MaterialCategory)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="Logam & Plat">Logam & Plat</option>
                <option value="Plastik & Polimer">Plastik & Polimer</option>
                <option value="Komponen Mekanikal">Komponen Mekanikal</option>
                <option value="Kimia & Cairan">Kimia & Cairan</option>
                <option value="Elektrik & Kabel">Elektrik & Kabel</option>
                <option value="Packaging & Box">Packaging & Box</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Satuan Ukuran (Unit):
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as MaterialUnit)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="Kg">Kg (Kilogram)</option>
                <option value="Pcs">Pcs (Pieces)</option>
                <option value="Roll">Roll</option>
                <option value="Drum">Drum</option>
                <option value="Liter">Liter</option>
                <option value="Sak">Sak / Bag</option>
                <option value="Meter">Meter</option>
                <option value="Lembar">Lembar</option>
                <option value="Set">Set</option>
              </select>
            </div>
          </div>

          {/* Section: Stock Parameters */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-900"></span>
              Parameter Kuantitas & Batas Aman Gudang
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Stok Fisik Saat Ini:
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Safety Stock (Min):
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={safetyStock}
                  onChange={(e) => setSafetyStock(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-amber-700 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Konsumsi / Hari:
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={dailyRequirement}
                  onChange={(e) => setDailyRequirement(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Kebutuhan SPK:
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={allocatedProduction}
                  onChange={(e) => setAllocatedProduction(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Baris 3: Supplier & Kontak & Lead Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Nama Supplier / Vendor *
              </label>
              <input
                type="text"
                required
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Contoh: PT Krakatau Posco"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Kontak PIC Supplier
              </label>
              <input
                type="text"
                value={supplierContact}
                onChange={(e) => setSupplierContact(e.target.value)}
                placeholder="+62 812-xxx (Bpk. Rudi)"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Lead Time (Hari):
              </label>
              <input
                type="number"
                min="1"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Baris 4: Lokasi Rak Gudang & Line Produksi Terdampak */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Lokasi Rak Gudang:
              </label>
              <input
                type="text"
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                placeholder="Contoh: Gudang RM - Bay 04"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Estimasi Harga Satuan (Rp):
              </label>
              <input
                type="number"
                min="0"
                value={unitCost}
                onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Line Produksi Terdampak (Pisahkan koma):
              </label>
              <input
                type="text"
                value={affectedLinesStr}
                onChange={(e) => setAffectedLinesStr(e.target.value)}
                placeholder="Line 1, Line Stamping, Assembly"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Catatan / Instruksi Khusus:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Perlu inspeksi QC sebelum masuk ke Line Assembly"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
            {isEditing && onDelete ? (
              <button
                type="button"
                id="btn-modal-delete"
                onClick={() => {
                  if (material && window.confirm(`Apakah Anda yakin ingin menghapus bahan baku "${material.name}"?`)) {
                    onDelete(material.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Bahan Baku</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-modal-cancel"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                id="btn-modal-save"
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Simpan Bahan Baku' : 'Simpan & Tambah ke Matriks'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
