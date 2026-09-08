import React, { useState } from 'react';
import { RawMaterial } from '../types/inventory';
import {
  calculateStatus,
  calculateDaysOfInventory,
  calculateDeficit,
  calculateMetrics,
  formatNumber,
} from '../utils/calculations';
import { X, Copy, Check, MessageSquare, ExternalLink } from 'lucide-react';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: RawMaterial[];
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({
  isOpen,
  onClose,
  materials,
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const metrics = calculateMetrics(materials);

  const dateNow = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeNow = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Generate the formatted WhatsApp message
  const criticalItems = materials.filter((m) => calculateStatus(m) === 'KRITIS');
  const warningItems = materials.filter((m) => calculateStatus(m) === 'WARNING');
  const inTransitItems = materials.filter((m) => calculateStatus(m) === 'IN_TRANSIT');

  let broadcastMessage = `*📢 LAPORAN MONITORING SHORTAGE BAHAN BAKU GUDANG & PPIC*\n`;
  broadcastMessage += `📅 Tanggal: ${dateNow} | Pukul: ${timeNow} WIB\n\n`;

  broadcastMessage += `*📊 RINGKASAN STATUS INVENTORI:*\n`;
  broadcastMessage += `🔴 *Kritis (Habis / Stop Line Risk):* ${metrics.criticalCount} item\n`;
  broadcastMessage += `🟡 *Peringatan (Low Safety Stock):* ${metrics.warningCount} item\n`;
  broadcastMessage += `🔵 *PO Dalam Pengiriman (In-Transit):* ${metrics.inTransitCount} item\n`;
  broadcastMessage += `🏭 *Line Produksi Terancam:* ${metrics.affectedLinesCount} line\n\n`;

  if (criticalItems.length > 0) {
    broadcastMessage += `*🚨 DAFTAR BAHAN BAKU KRITIS (ACTION IMMEDIATE):*\n`;
    criticalItems.forEach((m, idx) => {
      const doi = calculateDaysOfInventory(m.currentStock, m.dailyRequirement);
      const def = calculateDeficit(m);
      broadcastMessage += `${idx + 1}. *${m.name}* (${m.category})\n`;
      broadcastMessage += `   • Stok Fisik: ${formatNumber(m.currentStock)} ${m.unit} (Min: ${formatNumber(m.safetyStock)})\n`;
      broadcastMessage += `   • Sisa Ketahanan: ${doi <= 0 ? 'HABIS TOTAL (0 JAM)' : `${doi} Hari (< 24 Jam)`}\n`;
      broadcastMessage += `   • Defisit: -${formatNumber(def)} ${m.unit}\n`;
      broadcastMessage += `   • Line Terdampak: ${m.affectedLines.join(', ')}\n`;
      broadcastMessage += `   • Supplier: ${m.supplier} (${m.supplierContact})\n`;
      if (m.poNumber) {
        broadcastMessage += `   • Info PO: ${m.poNumber} (${formatNumber(m.poQuantity || 0)} ${m.unit}) ETA: ${m.etaDate || '-'}\n`;
      }
      if (m.notes) {
        broadcastMessage += `   • Catatan: ${m.notes}\n`;
      }
      broadcastMessage += `\n`;
    });
  }

  if (inTransitItems.length > 0) {
    broadcastMessage += `*🚚 PO ON-THE-WAY / IN-TRANSIT HARI INI:*\n`;
    inTransitItems.forEach((m, idx) => {
      broadcastMessage += `${idx + 1}. *${m.name}* | No PO: ${m.poNumber || '-'} (${formatNumber(m.poQuantity || 0)} ${m.unit}) | ETA: ${m.etaDate || '-'}\n`;
    });
    broadcastMessage += `\n`;
  }

  broadcastMessage += `_Mohon tim Purchasing & PPIC segera follow up vendor terkait jadwal bongkar muat. Terima kasih._\n`;
  broadcastMessage += `_Disiapkan oleh Warehouse Inventory Control Tower._`;

  const handleCopy = () => {
    navigator.clipboard.writeText(broadcastMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(broadcastMessage);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-emerald-50/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-600 text-white">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Format Broadcast WhatsApp Laporan Shortage
              </h3>
              <p className="text-xs text-slate-500">
                Salin atau kirim langsung ke grup WhatsApp tim pabrik / management
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Text Preview Body */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Pratinjau Pesan yang Dibuat Otomatis:</span>
            <span className="font-semibold text-emerald-700">
              {criticalItems.length} Bahan Kritis Siap Dilaporkan
            </span>
          </div>

          <textarea
            readOnly
            rows={12}
            value={broadcastMessage}
            className="w-full p-3 font-mono text-[11px] bg-slate-50 text-slate-800 border border-slate-200 rounded-lg focus:outline-none select-all leading-relaxed whitespace-pre-wrap"
          />

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={handleOpenWhatsApp}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka di Web WhatsApp</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tersalin ke Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Seluruh Teks</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
