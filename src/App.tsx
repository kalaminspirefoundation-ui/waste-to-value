/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
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

const PunarchakraRouter: React.FC = () => {
  const { activeView, toasts, dismissToast, isLoading, loadingLabel, isNavigatingSkeleton } =
    usePunarchakra();

  return (
    <>
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
