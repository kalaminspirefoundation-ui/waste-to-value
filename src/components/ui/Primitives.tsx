import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Info,
  Leaf,
  Package,
  Truck,
  X,
  XCircle,
} from 'lucide-react';
import { ToastMessage } from '../../context/PunarchakraContext';

import { BRAND_LOGO } from '../../data/seedData';
import { LanguageCode } from '../../i18n/translations';

export const AppLogo: React.FC<{ inverted?: boolean; onClick?: () => void }> = ({
  inverted = false,
  onClick,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28A66A] rounded-lg ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      <span
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border ${
          inverted
            ? 'bg-white border-white/25 text-[#174B37]'
            : 'bg-white border-[#174B37]/15 text-[#174B37]'
        }`}
      >
        {!imgFailed ? (
          <img
            src={BRAND_LOGO}
            alt="Punarchakra brand logo"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
            <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
            <path d="m14 16-3 3 3 3" />
            <path d="M8.293 13.596 7.196 9.5 3.1 10.598" />
            <path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843" />
            <path d="m13.378 9.633 4.096 1.098 1.097-4.096" />
          </svg>
        )}
      </span>
      <span
        className={`font-display font-bold tracking-tight text-lg ${
          inverted ? 'text-white' : 'text-[#174B37]'
        }`}
      >
        PUNARCHAKRA
      </span>
    </button>
  );
};

export const LanguageToggleButton: React.FC<{
  language: LanguageCode;
  onToggle: () => void;
  inverted?: boolean;
}> = ({ language, onToggle, inverted = false }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={language === 'en' ? 'Translate content to Kannada' : 'Switch language to English'}
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
      inverted
        ? 'bg-white/10 text-white border-white/25 hover:bg-white/20'
        : 'bg-white text-[#174B37] border-[#174B37]/20 hover:bg-[#174B37]/5'
    }`}
  >
    <span>{language === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
  </button>
);

export const GlobalLoadingBar: React.FC<{ active: boolean; label?: string | null }> = ({
  active,
  label,
}) => {
  if (!active) return null;
  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 h-1 bg-[#174B37]/15 z-[70] overflow-hidden pointer-events-none"
        role="progressbar"
        aria-busy="true"
        aria-label={label || 'Loading'}
      >
        <div className="h-full w-1/2 bg-[#28A66A] animate-pnc-progress origin-left" />
      </div>
      {label && (
        <div className="fixed top-3 right-4 z-[70] bg-[#174B37] text-white text-xs font-medium px-3.5 py-2 rounded-xl shadow-lg pointer-events-none flex items-center gap-2">
          <span className="w-3.5 h-3.5 border-2 border-[#A5D66D] border-t-transparent rounded-full animate-spin shrink-0" />
          <span>{label}</span>
        </div>
      )}
    </>
  );
};

export const PortalSkeleton: React.FC<{ label?: string | null }> = ({ label }) => (
  <div className="min-h-screen bg-[#F7F9F6] p-4 sm:p-8" aria-busy="true" aria-label="Loading view">
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="h-14 bg-white rounded-2xl border border-[#202820]/10 px-6 flex items-center justify-between">
        <div className="h-5 w-44 bg-[#174B37]/10 rounded-lg animate-pulse" />
        <div className="text-xs font-medium text-[#174B37]/70">{label || 'Loading Punarchakra...'}</div>
        <div className="h-8 w-28 bg-[#174B37]/10 rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="bg-white rounded-2xl border border-[#202820]/10 p-5 space-y-3">
            <div className="h-3 w-24 bg-[#202820]/10 rounded animate-pulse" />
            <div className="h-7 w-28 bg-[#174B37]/12 rounded animate-pulse" />
            <div className="h-2.5 w-32 bg-[#202820]/8 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#202820]/10 p-6 space-y-4">
          <div className="h-5 w-48 bg-[#174B37]/10 rounded animate-pulse" />
          {[1, 2, 3, 4].map((row) => (
            <div key={row} className="h-11 bg-[#F7F9F6] rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#202820]/10 p-6 space-y-4">
          <div className="h-5 w-36 bg-[#174B37]/10 rounded animate-pulse" />
          <div className="h-44 bg-[#F7F9F6] rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28A66A] focus-visible:ring-offset-2 active:scale-[0.98]';
  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-[#174B37] text-white hover:bg-[#103527] shadow-xs',
    secondary: 'bg-[#28A66A] text-white hover:bg-[#208b58] shadow-xs',
    outline: 'bg-white text-[#174B37] border border-[#174B37]/20 hover:bg-[#174B37]/5',
    ghost: 'bg-transparent text-[#202820]/80 hover:bg-[#174B37]/6 hover:text-[#174B37]',
    danger: 'bg-[#DC2626] text-white hover:bg-[#B91C1C]',
  };
  const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'min-h-[36px] px-3.5 py-1.5 text-xs',
    md: 'min-h-[42px] px-5 py-2 text-sm',
    lg: 'min-h-[48px] px-6 py-2.5 text-sm font-semibold',
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {children}
    </button>
  );
};

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}> = ({ children, className = '', padding = 'md' }) => {
  const pads = {
    none: '',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };
  return (
    <div
      className={`bg-white rounded-2xl border border-[#202820]/10 shadow-[0_1px_2px_rgba(23,75,55,0.04)] ${pads[padding]} ${className}`}
    >
      {children}
    </div>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, hint, className = '', id, ...rest }) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-[#202820]/80">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full min-h-[42px] px-3.5 py-2 bg-white border rounded-xl text-sm text-[#202820] placeholder:text-[#202820]/40 focus:outline-none focus:ring-2 focus:ring-[#28A66A]/30 focus:border-[#28A66A] transition-colors ${
          error ? 'border-[#DC2626]' : 'border-[#202820]/15'
        } ${className}`}
        {...rest}
      />
      {error && <p className="text-xs text-[#DC2626]">{error}</p>}
      {!error && hint && <p className="text-xs text-[#202820]/55">{hint}</p>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ label, error, className = '', id, children, ...rest }) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-medium text-[#202820]/80">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full min-h-[42px] px-3.5 py-2 bg-white border rounded-xl text-sm text-[#202820] focus:outline-none focus:ring-2 focus:ring-[#28A66A]/30 focus:border-[#28A66A] transition-colors ${
          error ? 'border-[#DC2626]' : 'border-[#202820]/15'
        } ${className}`}
        {...rest}
      >
        {children}
      </select>
      {error && <p className="text-xs text-[#DC2626]">{error}</p>}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, className = '', id, ...rest }) => {
  const areaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={areaId} className="block text-xs font-medium text-[#202820]/80">
          {label}
        </label>
      )}
      <textarea
        id={areaId}
        className={`w-full p-3.5 bg-white border border-[#202820]/15 rounded-xl text-sm text-[#202820] placeholder:text-[#202820]/40 focus:outline-none focus:ring-2 focus:ring-[#28A66A]/30 focus:border-[#28A66A] transition-colors ${className}`}
        {...rest}
      />
    </div>
  );
};

// Always renders icon + explicit text label (zero-pill / zero hue-only signaling)
export const StatusIndicator: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
    booking_created: { label: 'Booking Created', color: 'text-[#202820]/75', Icon: Clock },
    confirmed: { label: 'Confirmed', color: 'text-[#174B37]', Icon: CheckCircle2 },
    executive_assigned: { label: 'Executive Assigned', color: 'text-[#174B37]', Icon: Truck },
    on_the_way: { label: 'On The Way', color: 'text-[#D97706]', Icon: Truck },
    reached_location: { label: 'Reached Location', color: 'text-[#D97706]', Icon: Package },
    scrap_collected: { label: 'Scrap Collected', color: 'text-[#28A66A]', Icon: Package },
    weight_verified: { label: 'Weight Verified', color: 'text-[#28A66A]', Icon: CheckCircle2 },
    payment_completed: { label: 'Payment Completed', color: 'text-[#16A34A]', Icon: CheckCircle2 },
    cancelled: { label: 'Cancelled', color: 'text-[#DC2626]', Icon: XCircle },
    active: { label: 'Active', color: 'text-[#16A34A]', Icon: CheckCircle2 },
    deactivated: { label: 'Deactivated', color: 'text-[#DC2626]', Icon: XCircle },
    completed: { label: 'Completed', color: 'text-[#16A34A]', Icon: CheckCircle2 },
    pending: { label: 'Pending', color: 'text-[#D97706]', Icon: Clock },
    processing: { label: 'Processing', color: 'text-[#D97706]', Icon: Clock },
    refunded: { label: 'Refunded', color: 'text-[#202820]/70', Icon: Info },
    failed: { label: 'Failed', color: 'text-[#DC2626]', Icon: AlertCircle },
    submitted: { label: 'Submitted', color: 'text-[#D97706]', Icon: Clock },
    priced_by_admin: { label: 'Priced by Admin', color: 'text-[#174B37]', Icon: Info },
    revision_requested: { label: 'Revision Requested', color: 'text-[#D97706]', Icon: AlertCircle },
    accepted: { label: 'Accepted', color: 'text-[#16A34A]', Icon: CheckCircle2 },
    rejected: { label: 'Rejected', color: 'text-[#DC2626]', Icon: XCircle },
    converted_to_order: { label: 'Converted to Order', color: 'text-[#16A34A]', Icon: CheckCircle2 },
    open: { label: 'Open', color: 'text-[#D97706]', Icon: AlertCircle },
    in_progress: { label: 'In Progress', color: 'text-[#174B37]', Icon: Clock },
    resolved: { label: 'Resolved', color: 'text-[#16A34A]', Icon: CheckCircle2 },
    available: { label: 'Available', color: 'text-[#16A34A]', Icon: CheckCircle2 },
    on_pickup: { label: 'On Pickup', color: 'text-[#D97706]', Icon: Truck },
    off_duty: { label: 'Off Duty', color: 'text-[#202820]/55', Icon: Clock },
  };
  const cfg = map[status] || { label: status.replace(/_/g, ' '), color: 'text-[#202820]/75', Icon: Info };
  const Icon = cfg.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{cfg.label}</span>
    </span>
  );
};

export const ImageWithFallback: React.FC<{
  src?: string;
  alt: string;
  className?: string;
  title?: string;
}> = ({ src, alt, className = '', title }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [src]);
  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#174B37]/10 via-[#28A66A]/10 to-[#A5D66D]/20 text-[#174B37] p-4 ${className}`}
      >
        <Leaf className="w-7 h-7 mb-1.5 opacity-80" aria-hidden="true" />
        <span className="text-xs font-medium text-center">{title || alt}</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}> = ({ open, onClose, title, subtitle, children, maxWidth = 'max-w-xl' }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div
        className={`w-full ${maxWidth} bg-white rounded-2xl border border-[#202820]/10 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[#202820]/10">
          <div>
            <h3 className="font-display text-lg font-bold text-[#174B37]">{title}</h3>
            {subtitle && <p className="text-xs text-[#202820]/60 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-[#202820]/60 hover:bg-[#174B37]/8 hover:text-[#174B37] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4">{children}</div>
      </div>
    </div>
  );
};

export const ConfirmDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
}> = ({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', danger = false }) => (
  <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
    <p className="text-sm text-[#202820]/80 leading-relaxed">{description}</p>
    <div className="flex items-center justify-end gap-3 pt-2">
      <Button variant="outline" onClick={onClose}>
        Cancel
      </Button>
      <Button
        variant={danger ? 'danger' : 'primary'}
        onClick={() => {
          onConfirm();
          onClose();
        }}
      >
        {confirmLabel}
      </Button>
    </div>
  </Modal>
);

export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ title, description, actionLabel, onAction }) => (
  <div className="py-12 px-6 text-center border border-dashed border-[#202820]/15 rounded-2xl bg-[#F7F9F6]/60">
    <div className="w-11 h-11 rounded-xl bg-[#174B37]/10 text-[#174B37] flex items-center justify-center mx-auto mb-3">
      <Package className="w-5 h-5" />
    </div>
    <h4 className="font-display text-base font-semibold text-[#202820]">{title}</h4>
    <p className="text-sm text-[#202820]/60 max-w-md mx-auto mt-1">{description}</p>
    {actionLabel && onAction && (
      <div className="mt-4">
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    )}
  </div>
);

export const ToastHost: React.FC<{
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto bg-white border border-[#202820]/12 shadow-lg rounded-xl p-4 flex items-start gap-3"
        >
          <span className="mt-0.5 shrink-0">
            {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#28A66A]" />}
            {t.type === 'error' && <AlertCircle className="w-4 h-4 text-[#DC2626]" />}
            {t.type === 'info' && <Info className="w-4 h-4 text-[#174B37]" />}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#202820]">{t.title}</p>
            {t.description && <p className="text-xs text-[#202820]/65 mt-0.5">{t.description}</p>}
          </div>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss notification"
            className="text-[#202820]/45 hover:text-[#202820] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
