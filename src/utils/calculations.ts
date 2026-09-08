import { RawMaterial, ShortageMetrics, ShortageStatus } from '../types/inventory';

export function calculateDaysOfInventory(stock: number, dailyReq: number): number {
  if (dailyReq <= 0) return stock > 0 ? 999 : 0;
  return Number((stock / dailyReq).toFixed(1));
}

export function calculateDeficit(material: RawMaterial): number {
  // Defisit = Kebutuhan produksi terencana + safety stock - stok aktual
  const targetRequirement = Math.max(material.allocatedProduction, material.safetyStock);
  const deficit = targetRequirement - material.currentStock;
  return deficit > 0 ? deficit : 0;
}

export function calculateStatus(material: RawMaterial): ShortageStatus {
  // 1. Kritis: Stok 0 atau stok di bawah kebutuhan allocated, atau sisa hari < 1 hari
  const daysOfInventory = calculateDaysOfInventory(material.currentStock, material.dailyRequirement);
  
  if (
    material.currentStock === 0 ||
    material.currentStock < material.allocatedProduction ||
    (material.dailyRequirement > 0 && daysOfInventory < 1)
  ) {
    // Kalau ada PO sedang dikirim tapi stok 0, tetap Kritis dengan info pengiriman
    return 'KRITIS';
  }

  // 2. Warning: Stok di bawah safety stock atau stok hanya cukup < 3 hari
  if (material.currentStock < material.safetyStock || daysOfInventory < 3) {
    if (material.poStatus === 'IN_TRANSIT' || material.poStatus === 'PO_SENT') {
      return 'IN_TRANSIT';
    }
    return 'WARNING';
  }

  // 3. In Transit (bila ada PO sedang dikirim dan stok belum kritis)
  if (material.poStatus === 'IN_TRANSIT') {
    return 'IN_TRANSIT';
  }

  // 4. Aman
  return 'AMAN';
}

export function calculateMetrics(materials: RawMaterial[]): ShortageMetrics {
  let criticalCount = 0;
  let warningCount = 0;
  let inTransitCount = 0;
  let safeCount = 0;
  let estimatedReorderCost = 0;
  const affectedLinesSet = new Set<string>();

  materials.forEach((m) => {
    const status = calculateStatus(m);
    if (status === 'KRITIS') {
      criticalCount++;
      m.affectedLines.forEach((line) => affectedLinesSet.add(line));
    } else if (status === 'WARNING') {
      warningCount++;
      m.affectedLines.forEach((line) => affectedLinesSet.add(line));
    } else if (status === 'IN_TRANSIT') {
      inTransitCount++;
    } else {
      safeCount++;
    }

    const deficit = calculateDeficit(m);
    if (deficit > 0) {
      estimatedReorderCost += deficit * m.unitCost;
    }
  });

  return {
    totalItems: materials.length,
    criticalCount,
    warningCount,
    inTransitCount,
    safeCount,
    totalShortageVolumeKgEq: 0,
    estimatedReorderCost,
    affectedLinesCount: affectedLinesSet.size,
  };
}

export function formatCurrencyIDR(val: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);
}

export function formatNumber(val: number): string {
  return new Intl.NumberFormat('id-ID').format(val);
}

export function getStatusBadgeConfig(status: ShortageStatus) {
  switch (status) {
    case 'KRITIS':
      return {
        label: 'Kritis / Habis',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dotBg: 'bg-rose-600',
        iconColor: 'text-rose-600',
        glow: 'ring-1 ring-rose-300',
      };
    case 'WARNING':
      return {
        label: 'Peringatan (Low Stock)',
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        dotBg: 'bg-amber-500',
        iconColor: 'text-amber-600',
        glow: 'ring-1 ring-amber-200',
      };
    case 'IN_TRANSIT':
      return {
        label: 'PO Dalam Pengiriman',
        bg: 'bg-sky-50 text-sky-700 border-sky-200',
        dotBg: 'bg-sky-500',
        iconColor: 'text-sky-600',
        glow: 'ring-1 ring-sky-200',
      };
    case 'AMAN':
      return {
        label: 'Stok Aman',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotBg: 'bg-emerald-500',
        iconColor: 'text-emerald-600',
        glow: '',
      };
  }
}

export function getPOStatusBadge(status: string) {
  switch (status) {
    case 'NONE':
      return { label: 'Belum Ada PO', color: 'bg-slate-100 text-slate-600' };
    case 'DRAFT':
      return { label: 'Draft PO', color: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'PO_SENT':
      return { label: 'PO Terbit / Terkirim', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'IN_TRANSIT':
      return { label: 'Sedang Dikirim', color: 'bg-sky-100 text-sky-800 font-medium' };
    case 'PARTIAL_RECEIVED':
      return { label: 'Tiba Sebagian', color: 'bg-amber-100 text-amber-800' };
    case 'DELAYED':
      return { label: 'Terlambat (Delayed)', color: 'bg-rose-100 text-rose-800 font-medium' };
    case 'RECEIVED':
      return { label: 'Selesai Tiba', color: 'bg-emerald-100 text-emerald-800' };
    default:
      return { label: status, color: 'bg-slate-100 text-slate-600' };
  }
}
