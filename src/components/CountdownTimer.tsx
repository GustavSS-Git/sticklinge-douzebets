import { useState, useEffect } from 'react';
import { Clock, Lock } from 'lucide-react';

interface CountdownTimerProps {
  lockTime: string; // ISO timestamp
  lockedLabel?: string;
  openLabel?: string;
}

export function CountdownTimer({
  lockTime,
  lockedLabel = 'Tippningen har stängt',
  openLabel = 'Stänger om',
}: CountdownTimerProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const target = new Date(lockTime).getTime();
  const diff = target - now;

  if (diff <= 0) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
        <Lock className="w-4 h-4 shrink-0" />
        <span className="text-sm font-medium">{lockedLabel}</span>
      </div>
    );
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-accent/10 border border-accent/20 text-accent">
      <Clock className="w-4 h-4 shrink-0" />
      <span className="text-sm font-medium">
        {openLabel}:{' '}
        <span className="font-display font-bold tabular-nums">
          {String(days).padStart(2, '0')} dagar {String(hours).padStart(2, '0')} timmar{' '}
          {String(minutes).padStart(2, '0')} minuter
        </span>
      </span>
    </div>
  );
}
