import React from 'react';
import { Check } from 'lucide-react';
import { OrderStatus } from '../../types/punarchakra';

const STAGES: { status: OrderStatus; label: string }[] = [
  { status: 'booking_created', label: 'Booking created' },
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'executive_assigned', label: 'Executive assigned' },
  { status: 'on_the_way', label: 'Executive on the way' },
  { status: 'reached_location', label: 'Reached location' },
  { status: 'scrap_collected', label: 'Scrap collected' },
  { status: 'weight_verified', label: 'Weight verified' },
  { status: 'payment_completed', label: 'Payment completed' },
];

export const OrderTracker: React.FC<{ currentStatus: OrderStatus }> = ({ currentStatus }) => {
  if (currentStatus === 'cancelled') {
    return (
      <div className="p-4 rounded-xl bg-[#DC2626]/8 border border-[#DC2626]/20 text-sm text-[#DC2626] font-medium">
        This pickup order has been cancelled.
      </div>
    );
  }

  const activeIdx = Math.max(
    0,
    STAGES.findIndex((s) => s.status === currentStatus)
  );

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="min-w-[680px] grid grid-cols-8 gap-2">
        {STAGES.map((stage, idx) => {
          const done = idx <= activeIdx;
          const isCurrent = idx === activeIdx;
          return (
            <div key={stage.status} className="relative flex flex-col items-center text-center">
              {idx < STAGES.length - 1 && (
                <div
                  className={`absolute top-3.5 left-1/2 w-full h-0.5 ${
                    idx < activeIdx ? 'bg-[#28A66A]' : 'bg-[#202820]/12'
                  }`}
                />
              )}
              <div
                className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  done
                    ? 'bg-[#28A66A] text-white'
                    : 'bg-white border border-[#202820]/20 text-[#202820]/45'
                } ${isCurrent ? 'ring-4 ring-[#A5D66D]/50' : ''}`}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <span
                className={`mt-2 text-[11px] leading-tight font-medium ${
                  done ? 'text-[#174B37]' : 'text-[#202820]/45'
                }`}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
