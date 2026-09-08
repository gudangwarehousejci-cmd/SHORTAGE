export type MaterialCategory =
  | 'Logam & Plat'
  | 'Plastik & Polimer'
  | 'Komponen Mekanikal'
  | 'Kimia & Cairan'
  | 'Elektrik & Kabel'
  | 'Packaging & Box'
  | 'Lainnya';

export type MaterialUnit =
  | 'Kg'
  | 'Pcs'
  | 'Roll'
  | 'Drum'
  | 'Liter'
  | 'Sak'
  | 'Meter'
  | 'Lembar'
  | 'Set';

export type ShortageStatus = 'KRITIS' | 'WARNING' | 'IN_TRANSIT' | 'AMAN';

export type POStatus =
  | 'NONE'
  | 'DRAFT'
  | 'PO_SENT'
  | 'IN_TRANSIT'
  | 'PARTIAL_RECEIVED'
  | 'DELAYED'
  | 'RECEIVED';

export interface RawMaterial {
  id: string;
  sku?: string; // Optional legacy code
  name: string; // e.g. Plat Baja SPCC 1.2mm
  category: MaterialCategory;
  unit: MaterialUnit;
  currentStock: number; // Stok fisik riil di gudang
  safetyStock: number; // Ambang batas minimum aman
  dailyRequirement: number; // Kebutuhan konsumsi per hari
  allocatedProduction: number; // Kebutuhan produksi terencana (SPK/WIP)
  unitCost: number; // Harga satuan (Rp)
  supplier: string;
  supplierContact: string;
  leadTimeDays: number; // Hari waktu tunggu pemesanan
  storageLocation: string; // Lokasi rak/gudang (e.g. "Gudang Utama - Rak B2")
  affectedLines: string[]; // e.g. ["Line 1 Stamping", "Line 2 Assembly"]
  poStatus: POStatus;
  poNumber?: string;
  poQuantity?: number;
  etaDate?: string; // YYYY-MM-DD
  notes?: string;
  lastUpdated: string;
}

export interface ShortageMetrics {
  totalItems: number;
  criticalCount: number;
  warningCount: number;
  inTransitCount: number;
  safeCount: number;
  totalShortageVolumeKgEq: number;
  estimatedReorderCost: number;
  affectedLinesCount: number;
}

export interface ActionLog {
  id: string;
  timestamp: string;
  sku?: string;
  materialName: string;
  actionType: 'STOCK_UPDATE' | 'PO_UPDATE' | 'STATUS_CHANGE' | 'NOTE_ADDED';
  description: string;
  performedBy: string;
}
