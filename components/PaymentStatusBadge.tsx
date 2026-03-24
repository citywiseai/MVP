'use client';

import { DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface PaymentStatusBadgeProps {
  status: string;
  amount: number;
  amountPaid: number;
  onClick?: () => void;
}

export default function PaymentStatusBadge({
  status,
  amount,
  amountPaid,
  onClick
}: PaymentStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'paid':
        return {
          icon: CheckCircle,
          label: 'Paid',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
        };
      case 'partial':
        const percent = Math.round((amountPaid / amount) * 100);
        return {
          icon: Clock,
          label: `Partial (${percent}%)`,
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200',
        };
      default:
        return {
          icon: AlertCircle,
          label: 'Unpaid',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-600',
          borderColor: 'border-gray-200',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} hover:opacity-80 transition-opacity`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </button>
  );
}
