import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  QrCode,
  ArrowRight,
  Utensils,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { tableService } from '../../services/tableService';
import DigitalMenuModal from '../../components/customer/DigitalMenuModal';
import toast from 'react-hot-toast';

export default function QRScanPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tokenFromUrl = searchParams.get('token') || searchParams.get('table') || '';
  const [qrInput, setQrInput] = useState(tokenFromUrl || '11111111-0001-4000-8000-000000000001');
  const [resolving, setResolving] = useState(false);
  const [tableData, setTableData] = useState(null);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const resolveQr = async (tokenToResolve) => {
    const token = (tokenToResolve || qrInput).trim();
    if (!token) {
      toast.error('Please enter a valid table QR code');
      return;
    }

    try {
      setResolving(true);
      setError(null);
      const res = await tableService.getTableByQrToken(token);
      setTableData(res.data);
      toast.success(`Recognized Table ${res.data.table.tableNumber} at ${res.data.restaurant.name}!`);
    } catch (err) {
      console.error('Failed to resolve QR token', err);
      setError(err.response?.data?.error?.message || 'Invalid or unrecognized QR code');
      setTableData(null);
    } finally {
      setResolving(false);
    }
  };

  useEffect(() => {
    if (tokenFromUrl) {
      resolveQr(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  return (
    <div className="page-container py-6 space-y-6 max-w-xl mx-auto animate-fade-in">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mx-auto border border-brand/20 shadow-md">
          <QrCode size={30} />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Scan Table QR</h1>
        <p className="text-xs text-text-secondary max-w-sm mx-auto">
          Scan the QR token on your dining table to immediately unlock the digital menu and place kitchen orders.
        </p>
      </div>

      {/* QR Input Card */}
      <div className="card p-5 border border-surface-border space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-text-secondary block">
            Table QR Token Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="e.g. 11111111-0001-4000-8000-000000000001"
              className="input flex-1 text-xs font-mono"
            />
            <button
              onClick={() => resolveQr()}
              disabled={resolving || !qrInput.trim()}
              className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
            >
              <span>{resolving ? 'Scanning...' : 'Scan / Check'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Quick Test Seeds */}
        <div className="pt-2 border-t border-surface-border space-y-2">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
            Quick Select Table Seed (Demo)
          </span>
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                const tok = '11111111-0001-4000-8000-000000000001';
                setQrInput(tok);
                resolveQr(tok);
              }}
              className="px-2.5 py-1 rounded bg-surface-elevated text-text-secondary hover:text-brand hover:border-brand/40 border border-surface-border font-mono text-[11px]"
            >
              Spice Pavilion: Table T-01
            </button>
            <button
              type="button"
              onClick={() => {
                const tok = '11111111-0002-4000-8000-000000000002';
                setQrInput(tok);
                resolveQr(tok);
              }}
              className="px-2.5 py-1 rounded bg-surface-elevated text-text-secondary hover:text-brand hover:border-brand/40 border border-surface-border font-mono text-[11px]"
            >
              Spice Pavilion: Table T-02
            </button>
            <button
              type="button"
              onClick={() => {
                const tok = '22222222-0001-4000-8000-000000000001';
                setQrInput(tok);
                resolveQr(tok);
              }}
              className="px-2.5 py-1 rounded bg-surface-elevated text-text-secondary hover:text-brand hover:border-brand/40 border border-surface-border font-mono text-[11px]"
            >
              Ocean Pearl: Table T-01
            </button>
          </div>
        </div>
      </div>

      {/* Error Card */}
      {error && (
        <div className="card p-4 bg-red-950/20 border border-red-500/30 text-center space-y-1">
          <AlertCircle size={20} className="text-red-400 mx-auto" />
          <p className="text-xs text-red-200">{error}</p>
        </div>
      )}

      {/* Resolved Table Card */}
      {tableData && (
        <div className="card p-5 border-2 border-brand/50 bg-gradient-to-br from-surface-card to-surface-elevated space-y-4 animate-scale-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand text-surface-bg flex items-center justify-center font-bold text-lg shadow-lg">
              {tableData.table.tableNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-text-primary">
                  {tableData.restaurant.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-available/20 text-status-available border border-status-available/30">
                  Ready to Order
                </span>
              </div>
              <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                <MapPin size={12} className="text-brand shrink-0" />
                <span>{tableData.restaurant.address}</span>
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-card border border-surface-border grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-text-muted uppercase block">Table Capacity</span>
              <span className="font-bold text-text-primary">{tableData.table.capacity} Persons</span>
            </div>
            <div>
              <span className="text-[10px] text-text-muted uppercase block">Live Table Status</span>
              <span className="font-bold text-brand uppercase">{tableData.table.status}</span>
            </div>
          </div>

          <button
            onClick={() => setMenuOpen(true)}
            className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand/20"
          >
            <Utensils size={18} />
            <span>Open Digital Menu & Order Food</span>
          </button>
        </div>
      )}

      {/* Digital Menu Modal pre-bound to this restaurant and table */}
      {tableData && menuOpen && (
        <DigitalMenuModal
          restaurant={tableData.restaurant}
          table={tableData.table}
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}
