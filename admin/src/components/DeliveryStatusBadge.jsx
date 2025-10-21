// admin/src/components/DeliveryStatusBadge.jsx
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

export default function DeliveryStatusBadge({ status }) {
  if (!status || status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3" />
        Pending
      </span>
    );
  }

  if (status === 'delivered') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3" />
        Delivered
      </span>
    );
  }

  if (status === 'bounced') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
        <XCircle className="w-3 h-3" />
        Bounced
      </span>
    );
  }

  if (status === 'dropped') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
        <XCircle className="w-3 h-3" />
        Dropped
      </span>
    );
  }

  if (status === 'spam') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
        <AlertTriangle className="w-3 h-3" />
        Spam
      </span>
    );
  }

  return null;
}