import { Check, Circle, Package, Truck, Home, XCircle } from 'lucide-react';
import type { TrackingEvent, ShipmentStatus } from '../../types/shipping';

interface TrackingTimelineProps {
  events: TrackingEvent[];
  currentStatus: ShipmentStatus;
}

export function TrackingTimeline({ events, currentStatus }: TrackingTimelineProps) {
  const getStatusIcon = (status: ShipmentStatus, isCompleted: boolean) => {
    const iconClass = `h-5 w-5 ${isCompleted ? 'text-primary' : 'text-muted-foreground'}`;

    switch (status) {
      case 'pending':
        return <Package className={iconClass} />;
      case 'picked_up':
        return <Truck className={iconClass} />;
      case 'in_transit':
        return <Truck className={iconClass} />;
      case 'out_for_delivery':
        return <Truck className={iconClass} />;
      case 'delivered':
        return <Home className={iconClass} />;
      case 'failed':
      case 'cancelled':
        return <XCircle className={iconClass} />;
      default:
        return <Circle className={iconClass} />;
    }
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  // Sort events by time (most recent first)
  const sortedEvents = [...events].sort(
    (a, b) => b.eventTime.getTime() - a.eventTime.getTime()
  );

  return (
    <div className="relative">
      {sortedEvents.map((event, index) => {
        const isLast = index === sortedEvents.length - 1;
        const isFirst = index === 0;

        return (
          <div key={event.id} className="relative pb-8">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-[18px] top-[32px] h-full w-0.5 bg-border" />
            )}

            {/* Event content */}
            <div className="flex gap-4">
              {/* Icon */}
              <div
                className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                  isFirst
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-background'
                }`}
              >
                {isFirst ? (
                  <Check className="h-5 w-5 text-primary" />
                ) : (
                  getStatusIcon(event.status, false)
                )}
              </div>

              {/* Event details */}
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className={`font-medium ${isFirst ? 'text-primary' : ''}`}>
                      {event.description}
                    </div>
                    {event.location && (
                      <div className="text-sm text-muted-foreground">{event.location}</div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                    {formatDateTime(event.eventTime)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
