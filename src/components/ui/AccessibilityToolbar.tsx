import React, { useEffect } from 'react';
import {
  Accessibility,
  Contrast,
  Eye,
  RotateCcw,
  Sparkles,
  Type,
  Volume2,
} from 'lucide-react';
import { AccessibilitySettings, usePunarchakra } from '../../context/PunarchakraContext';
import { Button, Modal } from './Primitives';

const SCALE_OPTIONS: { value: AccessibilitySettings['textScale']; label: string }[] = [
  { value: 100, label: '100%' },
  { value: 112.5, label: '112%' },
  { value: 125, label: '125%' },
  { value: 137.5, label: '138%' },
];

export const SkipToContentLink: React.FC = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[90] focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-[#174B37] focus:text-white focus:text-sm focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#A5D66D]"
  >
    Skip to main content
  </a>
);

export const ScreenReaderLiveRegions: React.FC = () => {
  const { liveAnnouncement, assertiveAnnouncement } = usePunarchakra();
  return (
    <>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {liveAnnouncement}
      </div>
      <div role="alert" aria-live="assertive" aria-atomic="true" className="sr-only">
        {assertiveAnnouncement}
      </div>
    </>
  );
};

export const AccessibilityTriggerButton: React.FC<{
  inverted?: boolean;
  compact?: boolean;
}> = ({ inverted = false, compact = false }) => {
  const { a11y, a11yPanelOpen, setA11yPanelOpen, t } = usePunarchakra();

  const activeCount =
    (a11y.highContrast ? 1 : 0) +
    (a11y.textScale !== 100 ? 1 : 0) +
    (a11y.screenReaderEnhanced ? 1 : 0) +
    (a11y.reduceMotion ? 1 : 0);

  return (
    <button
      type="button"
      onClick={() => setA11yPanelOpen(!a11yPanelOpen)}
      aria-expanded={a11yPanelOpen}
      aria-controls="pnc-a11y-dialog"
      aria-label={`${t.a11yTitle || 'Accessibility settings'}${activeCount > 0 ? ` (${activeCount} active)` : ''}`}
      accessKey="a"
      className={`inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28A66A] ${
        compact ? 'px-2.5 py-1.5' : 'px-3 py-1.5'
      } ${
        inverted
          ? 'bg-white/10 text-white border-white/25 hover:bg-white/20'
          : activeCount > 0
            ? 'bg-[#174B37] text-white border-[#174B37]'
            : 'bg-white text-[#174B37] border-[#174B37]/20 hover:bg-[#174B37]/5'
      }`}
    >
      <Accessibility className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{t.a11yLabel || 'Accessibility'}</span>
      {activeCount > 0 && (
        <span className="tabular-nums font-bold px-1.5 py-0.5 rounded bg-[#A5D66D] text-[#103527] text-[10px] leading-none">
          {activeCount}
        </span>
      )}
    </button>
  );
};

export const AccessibilityToolbarDrawer: React.FC = () => {
  const {
    a11y,
    a11yPanelOpen,
    setA11yPanelOpen,
    toggleHighContrast,
    setTextScale,
    toggleScreenReaderEnhanced,
    toggleReduceMotion,
    resetA11y,
    announce,
    t,
  } = usePunarchakra();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setA11yPanelOpen(!a11yPanelOpen);
      } else if (e.key === 'Escape' && a11yPanelOpen) {
        setA11yPanelOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [a11yPanelOpen, setA11yPanelOpen]);

  return (
    <Modal
      open={a11yPanelOpen}
      onClose={() => setA11yPanelOpen(false)}
      title={t.a11yTitle || 'WCAG Accessibility Controls'}
      subtitle="WCAG 2.1 AA/AAA visual contrast, typography scaling & screen-reader enhancements · Shortcut: Alt + A"
      maxWidth="max-w-lg"
    >
      <div id="pnc-a11y-dialog" className="space-y-5">
        {/* High Contrast Toggle */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-[#202820]/12 bg-[#F7F9F6]">
          <div className="flex items-start gap-3">
            <Contrast className="w-5 h-5 text-[#174B37] shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-[#202820]">
                {t.a11yHighContrast || 'High-Contrast Mode'}
              </p>
              <p className="text-xs text-[#202820]/65 mt-0.5">
                WCAG AAA dark obsidian surfaces with high-luminance borders and yellow/white text.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={a11y.highContrast}
            onClick={toggleHighContrast}
            className={`w-12 h-7 rounded-full transition-colors p-1 shrink-0 cursor-pointer ${
              a11y.highContrast ? 'bg-[#28A66A]' : 'bg-[#202820]/20'
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                a11y.highContrast ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Text Scaling Controls */}
        <div className="p-4 rounded-xl border border-[#202820]/12 bg-[#F7F9F6] space-y-3">
          <div className="flex items-start gap-3">
            <Type className="w-5 h-5 text-[#174B37] shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-[#202820]">
                {t.a11yTextScale || 'Text Scaling'} ({a11y.textScale}%)
              </p>
              <p className="text-xs text-[#202820]/65 mt-0.5">
                Scales root typography up to 138% without breaking responsive portal layouts.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2" role="group" aria-label="Select text size percentage">
            {SCALE_OPTIONS.map((opt) => {
              const active = a11y.textScale === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTextScale(opt.value)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold tabular-nums border cursor-pointer transition-colors ${
                    active
                      ? 'bg-[#174B37] text-white border-[#174B37]'
                      : 'bg-white text-[#202820]/80 border-[#202820]/15 hover:border-[#174B37]/40'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Screen Reader Focus & Live Announcements */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-[#202820]/12 bg-[#F7F9F6]">
          <div className="flex items-start gap-3">
            <Volume2 className="w-5 h-5 text-[#174B37] shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-[#202820]">
                {t.a11yScreenReader || 'Screen Reader Focus & Announcements'}
              </p>
              <p className="text-xs text-[#202820]/65 mt-0.5">
                Enforces 3px high-visibility keyboard focus rings and announces portal changes & pickup alerts via ARIA live regions.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={a11y.screenReaderEnhanced}
            onClick={toggleScreenReaderEnhanced}
            className={`w-12 h-7 rounded-full transition-colors p-1 shrink-0 cursor-pointer ${
              a11y.screenReaderEnhanced ? 'bg-[#28A66A]' : 'bg-[#202820]/20'
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                a11y.screenReaderEnhanced ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Reduce Motion Toggle */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-[#202820]/12 bg-[#F7F9F6]">
          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-[#174B37] shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-[#202820]">
                {t.a11yReduceMotion || 'Reduce Motion'}
              </p>
              <p className="text-xs text-[#202820]/65 mt-0.5">
                Disables smooth-scroll and transitions to prevent vestibular discomfort.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={a11y.reduceMotion}
            onClick={toggleReduceMotion}
            className={`w-12 h-7 rounded-full transition-colors p-1 shrink-0 cursor-pointer ${
              a11y.reduceMotion ? 'bg-[#28A66A]' : 'bg-[#202820]/20'
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                a11y.reduceMotion ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#202820]/10">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => announce('Punarchakra Accessibility live region test active. Press Tab to navigate landmarks.')}
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Test Screen Reader Cue
          </Button>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={resetA11y}>
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> {t.a11yReset || 'Reset Defaults'}
            </Button>
            <Button size="sm" onClick={() => setA11yPanelOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
