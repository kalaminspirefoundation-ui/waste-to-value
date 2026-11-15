import React from 'react';
import { Bell, BellRing, CheckCircle2, Radio, Send } from 'lucide-react';
import { usePunarchakra } from '../../context/PunarchakraContext';
import { Button, Card } from './Primitives';

export const PushAlertsCard: React.FC<{ portalLabel: string }> = ({ portalLabel }) => {
  const { fcmStatus, fcmToken, lastPushAlert, enablePushNotifications, sendTestPushAlert } =
    usePunarchakra();

  const statusMeta =
    fcmStatus === 'granted'
      ? {
          label: 'FCM Real-Time Push Active',
          color: 'text-[#16A34A]',
          detail: fcmToken?.startsWith('browser-push-')
            ? 'Service Worker & live pickup status channel synced'
            : 'Registered with Firebase Cloud Messaging',
        }
      : fcmStatus === 'denied'
        ? {
            label: 'Browser Push Blocked (In-App Live Active)',
            color: 'text-[#D97706]',
            detail: 'Enable notifications in browser settings for OS background alerts',
          }
        : {
            label: 'Enable Real-Time Pickup Push Alerts',
            color: 'text-[#174B37]',
            detail: `Instant alerts on booking confirmation, executive dispatch, arrival & UPI payout (${portalLabel})`,
          };

  return (
    <Card padding="sm" className="border-[#174B37]/15 bg-[#FFFFFF]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#174B37]/10 text-[#174B37] flex items-center justify-center shrink-0">
            {fcmStatus === 'granted' ? (
              <BellRing className="w-4 h-4 text-[#28A66A]" aria-hidden="true" />
            ) : (
              <Bell className="w-4 h-4" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-semibold inline-flex items-center gap-1 ${statusMeta.color}`}>
                {fcmStatus === 'granted' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                ) : (
                  <Radio className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                )}
                <span>{statusMeta.label}</span>
              </span>
            </div>
            <p className="text-xs text-[#202820]/65 mt-0.5 truncate sm:whitespace-normal">
              {lastPushAlert
                ? `Latest alert: ${lastPushAlert.title} — ${lastPushAlert.message}`
                : statusMeta.detail}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {fcmStatus !== 'granted' && fcmStatus !== 'unsupported' && (
            <Button size="sm" onClick={enablePushNotifications}>
              <BellRing className="w-3.5 h-3.5" aria-hidden="true" /> Enable FCM Push
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={sendTestPushAlert}>
            <Send className="w-3.5 h-3.5" aria-hidden="true" /> Simulate Live Pickup Alert
          </Button>
        </div>
      </div>
    </Card>
  );
};
