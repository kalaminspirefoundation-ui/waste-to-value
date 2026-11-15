import React from 'react';
import { Download, Printer } from 'lucide-react';
import { Payment, PickupOrder } from '../../types/punarchakra';
import { AppLogo, Button, Modal, StatusIndicator } from './Primitives';

export const ReceiptModal: React.FC<{
  open: boolean;
  onClose: () => void;
  payment: Payment | null;
  order?: PickupOrder | null;
}> = ({ open, onClose, payment, order }) => {
  if (!payment) return null;

  const handleDownloadTextReceipt = () => {
    const lines = [
      '============================================',
      'PUNARCHAKRA DIGITAL RECYCLING RECEIPT',
      'Turning Scrap Into Value',
      '============================================',
      `Receipt Number : ${payment.receiptNumber}`,
      `Order Number   : ${payment.orderNumber}`,
      `Customer       : ${payment.userName} (${payment.userRole.toUpperCase()})`,
      `Payment Date   : ${new Date(payment.paidAt || payment.createdAt).toLocaleString('en-IN')}`,
      `Method         : ${payment.method}`,
      `Transaction Ref: ${payment.transactionRef}`,
      `Status         : ${payment.status.toUpperCase()}`,
      '--------------------------------------------',
      ...(order
        ? order.items.map(
            (it) =>
              `${it.categoryName} (${it.actualQty ?? it.estimatedQty} ${it.unit} @ ₹${it.appliedRate}) = ₹${
                it.actualAmount ?? it.estimatedAmount
              }`
          )
        : []),
      '--------------------------------------------',
      `Total Payout   : ₹${payment.amount.toLocaleString('en-IN')}`,
      '============================================',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${payment.receiptNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal open={open} onClose={onClose} title="Digital Settlement Receipt" subtitle={payment.receiptNumber} maxWidth="max-w-lg">
      <div className="border border-[#202820]/12 rounded-xl p-5 bg-[#F7F9F6]/60 space-y-4">
        <div className="flex items-center justify-between border-b border-[#202820]/10 pb-3">
          <AppLogo />
          <StatusIndicator status={payment.status} />
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[#202820]/55 block">Customer / Account</span>
            <span className="font-semibold text-[#202820]">{payment.userName}</span>
          </div>
          <div>
            <span className="text-[#202820]/55 block">Order Reference</span>
            <span className="font-mono font-semibold text-[#174B37]">{payment.orderNumber}</span>
          </div>
          <div>
            <span className="text-[#202820]/55 block">Payment Method</span>
            <span className="font-medium text-[#202820]">{payment.method}</span>
          </div>
          <div>
            <span className="text-[#202820]/55 block">Transaction Reference</span>
            <span className="font-mono text-[#202820]">{payment.transactionRef}</span>
          </div>
        </div>

        {order && (
          <div className="border-t border-[#202820]/10 pt-3">
            <p className="text-xs font-semibold text-[#202820]/70 mb-2">Verified Material Breakdown</p>
            <div className="space-y-1.5">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <span className="text-[#202820]/80">
                    {item.categoryName} ({item.actualQty ?? item.estimatedQty} {item.unit} × ₹{item.appliedRate})
                  </span>
                  <span className="font-mono tabular-nums font-semibold">
                    ₹{(item.actualAmount ?? item.estimatedAmount).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-[#202820]/10 pt-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-[#174B37]">Total Net Payout</span>
          <span className="font-display text-xl font-bold text-[#174B37] tabular-nums">
            ₹{payment.amount.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4" />
          Print PDF
        </Button>
        <Button size="sm" onClick={handleDownloadTextReceipt}>
          <Download className="w-4 h-4" />
          Download Receipt
        </Button>
      </div>
    </Modal>
  );
};
