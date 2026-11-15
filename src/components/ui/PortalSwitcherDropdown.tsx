import React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { AppView, usePunarchakra } from '../../context/PunarchakraContext';
import { UserRole } from '../../types/punarchakra';
import { AccessibilityTriggerButton } from './AccessibilityToolbar';

export const PortalSwitcherDropdown: React.FC<{
  compact?: boolean;
  inverted?: boolean;
}> = ({ compact = false, inverted = false }) => {
  const { activeView, currentUser, navigateTo, quickDemoLogin, language } = usePunarchakra();

  const currentSelection: AppView =
    activeView === 'auth' ? 'public' : activeView;

  const handlePortalChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as AppView;
    if (next === 'public') {
      navigateTo('public');
      return;
    }
    if (currentUser?.role === next) {
      navigateTo(next);
      return;
    }
    await quickDemoLogin(next as UserRole);
  };

  return (
    <div className="inline-flex items-center gap-1.5 shrink-0">
      <label htmlFor={`portal-switch-${compact ? 'c' : 'f'}-${inverted ? 'i' : 'l'}`} className="sr-only">
        {language === 'kn' ? 'ಪೋರ್ಟಲ್ ಬದಲಾಯಿಸಿ' : 'Switch Portal'}
      </label>
      <div
        className={`relative inline-flex items-center rounded-lg border transition-colors ${
          inverted
            ? 'bg-white/10 border-white/25 text-white'
            : 'bg-white border-[#174B37]/20 text-[#174B37] hover:border-[#174B37]/40'
        }`}
      >
        <ArrowLeftRight
          className={`w-3.5 h-3.5 shrink-0 pointer-events-none ml-2.5 ${
            inverted ? 'text-[#A5D66D]' : 'text-[#28A66A]'
          }`}
          aria-hidden="true"
        />
        <select
          id={`portal-switch-${compact ? 'c' : 'f'}-${inverted ? 'i' : 'l'}`}
          aria-label={language === 'kn' ? 'ಪೋರ್ಟಲ್ ಬದಲಾಯಿಸಿ' : 'Switch Portal'}
          value={currentSelection}
          onChange={handlePortalChange}
          className={`appearance-none bg-transparent pr-7 pl-2 ${
            compact ? 'py-1.5 text-xs' : 'py-1.5 text-xs'
          } font-semibold cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#28A66A] rounded-lg ${
            inverted ? 'text-white [&>option]:text-[#202820]' : 'text-[#174B37]'
          }`}
        >
          <option value="public">
            {language === 'kn' ? 'ಸಾರ್ವಜನಿಕ ವೆಬ್‌ಸೈಟ್' : 'Public Website'}
          </option>
          <option value="b2c">
            {language === 'kn' ? 'B2C ಗ್ರಾಹಕ ಪೋರ್ಟಲ್' : 'B2C Customer Portal'}
          </option>
          <option value="b2b">
            {language === 'kn' ? 'B2B ವ್ಯಾಪಾರ ಪೋರ್ಟಲ್' : 'B2B Business Portal'}
          </option>
          <option value="executive">
            {language === 'kn' ? 'ಪಿಕಪ್ ಕಾರ್ಯನಿರ್ವಾಹಕ' : 'Pickup Executive Portal'}
          </option>
          <option value="admin">
            {language === 'kn' ? 'ಅಡ್ಮಿನ್ ಮಾಸ್ಟರ್ ಪೋರ್ಟಲ್' : 'Admin Master Portal'}
          </option>
        </select>
        <svg
          className={`w-3.5 h-3.5 pointer-events-none absolute right-2 ${
            inverted ? 'text-white/75' : 'text-[#174B37]/70'
          }`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );
};

export const PortalFooter: React.FC<{
  portalLabel: string;
  withMobileBottomBarSpace?: boolean;
}> = ({ portalLabel, withMobileBottomBarSpace = false }) => {
  return (
    <footer
      className={`mt-auto border-t border-[#202820]/10 bg-white/90 px-4 sm:px-6 lg:px-8 py-4 ${
        withMobileBottomBarSpace ? 'pb-20 lg:pb-4' : ''
      }`}
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#202820]/65">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <span className="font-semibold text-[#174B37]">PUNARCHAKRA</span>
          <span>·</span>
          <span>{portalLabel}</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">North Bengaluru B2C & Industrial Areas B2B</span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <PortalSwitcherDropdown compact />
          <AccessibilityTriggerButton compact />
        </div>
      </div>
    </footer>
  );
};
