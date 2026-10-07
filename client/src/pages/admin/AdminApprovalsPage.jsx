import { useState } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Store,
  MapPin,
  Mail,
  Phone,
  FileText,
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import toast from 'react-hot-toast';

const PENDING_APPLICATIONS = [
  {
    id: 101,
    restaurantName: 'Copper Chimney Grand',
    ownerName: 'Sunil Rao',
    email: 'sunil@copperchimney.in',
    phone: '+91 98401 23456',
    city: 'Chennai',
    area: 'Nungambakkam',
    cuisine: 'North Indian, Tandoori',
    tablesRequested: 16,
    appliedAt: 'Yesterday at 3:45 PM',
    fssaiLicense: 'FSSAI-11223344556677',
  },
  {
    id: 102,
    restaurantName: 'Bonsai Sushi & Robata',
    ownerName: 'Aishwarya Raman',
    email: 'aishwarya@bonsaidining.com',
    phone: '+91 99622 34567',
    city: 'Bengaluru',
    area: 'Indiranagar',
    cuisine: 'Japanese, Asian Sushi Bar',
    tablesRequested: 12,
    appliedAt: '2 days ago',
    fssaiLicense: 'FSSAI-99887766554433',
  },
];

export default function AdminApprovalsPage() {
  const [applications, setApplications] = useState(PENDING_APPLICATIONS);

  const handleApprove = (app) => {
    setApplications((prev) => prev.filter((a) => a.id !== app.id));
    toast.success(`Approved ${app.restaurantName}! Owner credential notice dispatched.`);
  };

  const handleReject = (app) => {
    if (!window.confirm(`Are you sure you want to reject the application for ${app.restaurantName}?`)) return;
    setApplications((prev) => prev.filter((a) => a.id !== app.id));
    toast.error(`Rejected application for ${app.restaurantName}.`);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Merchant Partner Approvals"
        subtitle="Review new restaurant onboarding applications, food safety compliance, and seating capacity."
      />

      {applications.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="All applications reviewed"
          description="There are currently no pending merchant verification requests awaiting admin approval."
        />
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="card p-5 border border-surface-border space-y-4 hover:border-accent/40 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-surface-border">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Store size={18} className="text-accent" />
                    <h3 className="font-bold text-base text-text-primary">
                      {app.restaurantName}
                    </h3>
                  </div>
                  <p className="text-xs text-text-secondary flex items-center gap-1.5">
                    <MapPin size={12} className="text-brand shrink-0" />
                    <span>{app.area}, {app.city} • {app.cuisine}</span>
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="badge bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[11px] font-bold">
                    PENDING REVIEW
                  </span>
                  <span className="text-[10px] text-text-muted block mt-1">
                    Applied: {app.appliedAt}
                  </span>
                </div>
              </div>

              {/* Grid details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-surface-elevated/30 p-3 rounded-xl border border-surface-border/50">
                <div className="space-y-1">
                  <span className="text-text-muted text-[10px] uppercase font-bold">Applicant / Owner</span>
                  <p className="font-semibold text-text-primary">{app.ownerName}</p>
                  <p className="text-[11px] text-text-secondary">{app.email}</p>
                  <p className="text-[11px] text-text-secondary">{app.phone}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-text-muted text-[10px] uppercase font-bold">Seating Scale</span>
                  <p className="font-semibold text-text-primary">{app.tablesRequested} Tables Requested</p>
                  <p className="text-[11px] text-text-secondary">QR token batch required</p>
                </div>

                <div className="space-y-1">
                  <span className="text-text-muted text-[10px] uppercase font-bold">Compliance Verification</span>
                  <p className="font-mono text-xs text-accent flex items-center gap-1">
                    <FileText size={12} />
                    <span>{app.fssaiLicense}</span>
                  </p>
                  <p className="text-[11px] text-emerald-400">Valid GST / FSSAI verification</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleReject(app)}
                  className="btn-outline text-xs py-2 px-4 border-red-500/40 text-red-400 hover:bg-red-500/10 inline-flex items-center gap-1.5"
                >
                  <XCircle size={14} />
                  <span>Reject</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApprove(app)}
                  className="btn-primary text-xs py-2 px-5 inline-flex items-center gap-1.5 font-bold shadow-md shadow-brand/10"
                >
                  <CheckCircle2 size={14} />
                  <span>Approve & Provision</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
