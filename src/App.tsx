/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import {
  AccessibilityToolbarDrawer,
  ScreenReaderLiveRegions,
  SkipToContentLink,
} from './components/ui/AccessibilityToolbar';
import { GlobalLoadingBar, PortalSkeleton, ToastHost } from './components/ui/Primitives';
import { WhatsAppChatWidget } from './components/ui/WhatsAppChatWidget';
import { PunarchakraProvider, usePunarchakra } from './context/PunarchakraContext';
import { AdminPortal } from './pages/AdminPortal';
import { AuthPortal } from './pages/AuthPortal';
import { B2BPortal } from './pages/B2BPortal';
import { B2CPortal } from './pages/B2CPortal';
import { ExecutivePortal } from './pages/ExecutivePortal';
import { PublicWebsite } from './pages/PublicWebsite';

const GmpQuotaBanner: React.FC = () => {
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onQuotaExceeded = () => {
      setQuotaExceeded(true);
      setDismissed(false);
    };
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  if (!quotaExceeded || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-50 w-full bg-[#FEF3C7] border-b border-[#F59E0B]/40 text-[#78350F] px-4 py-2.5 text-xs sm:text-sm"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" aria-hidden="true" />
          <p className="leading-snug">
            The Google Maps free demo key quota has been reached for this preview.{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noreferrer"
              className="font-semibold underline underline-offset-2 hover:text-[#451A03]"
            >
              Switch to a billed Cloud project or review quota instructions
            </a>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss Maps quota notice"
          className="p-1 rounded-lg hover:bg-[#F59E0B]/20 text-[#78350F] shrink-0 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const PunarchakraRouter: React.FC = () => {
  const { activeView, toasts, dismissToast, isLoading, loadingLabel, isNavigatingSkeleton } =
    usePunarchakra();

  return (
    <>
      <GmpQuotaBanner />
      <SkipToContentLink />
      <ScreenReaderLiveRegions />
      <GlobalLoadingBar active={isLoading || isNavigatingSkeleton} label={loadingLabel} />
      {isNavigatingSkeleton ? (
        <PortalSkeleton label={loadingLabel} />
      ) : (
        <>
          {activeView === 'public' && <PublicWebsite />}
          {activeView === 'auth' && <AuthPortal />}
          {activeView === 'b2c' && <B2CPortal />}
          {activeView === 'b2b' && <B2BPortal />}
          {activeView === 'executive' && <ExecutivePortal />}
          {activeView === 'admin' && <AdminPortal />}
        </>
      )}
      <AccessibilityToolbarDrawer />
      <WhatsAppChatWidget />
      <ToastHost toasts={toasts} onDismiss={dismissToast} />
    </>
  );
};

export default function App() {
  return (
    <PunarchakraProvider>
      <PunarchakraRouter />
    </PunarchakraProvider>
  );
}
