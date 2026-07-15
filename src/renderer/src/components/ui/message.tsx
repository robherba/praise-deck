import Button from '../ui/button';
import { useEffect, useRef, useState } from 'react';
import { useMessage } from '../../context/message-context';

// Icons.
import CloseIcon from '../../assets/icons/close.svg?react';
import ErrorIcon from '../../assets/icons/error.svg?react';
import SuccessIcon from '../../assets/icons/success.svg?react';
import WarningIcon from '../../assets/icons/warning.svg?react';

const messageIcons = {
  success: <SuccessIcon className="h-5 w-5" />,
  error: <ErrorIcon className="h-5 w-5" />,
  warning: <WarningIcon className="h-5 w-5" />,
} as const;

const DURATION_MS = 5000;

export default function Message() {
  const { message, clearMessage } = useMessage();
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = () => {
    setExiting(true);
    exitTimerRef.current = setTimeout(() => {
      setVisible(false);
      setExiting(false);
      clearMessage();
    }, 300);
  };

  useEffect(() => {
    if (message) {
      // Cancel any pending exit animation
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
      setExiting(false);
      setVisible(true);

      timerRef.current = setTimeout(() => {
        dismiss();
      }, DURATION_MS);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  if (!message || !visible) return null;

  const progressColor =
    message.type === 'success' ? 'bg-emerald-500' :
    message.type === 'error' ? 'bg-rose-500' :
    'bg-amber-500';

  const iconColors =
    message.type === 'success' ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-400' :
    message.type === 'error' ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400' :
    'bg-amber-50 text-amber-500 dark:bg-amber-950/40 dark:text-amber-400';

  return (
    <div
      className={`fixed left-4 top-4 z-50 max-w-sm w-full transition-all duration-300 ${
        exiting
          ? 'opacity-0 -translate-y-4 scale-95'
          : 'opacity-100 translate-y-0 scale-100'
      }`}
    >
      <div className="overflow-hidden bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl shadow-2xl">
        {/* Progress bar */}
        <div
          className={`h-1 w-full origin-left ${progressColor}`}
          style={{
            animation: `shrink-x ${DURATION_MS}ms linear both`,
          }}
        />

        <div className="flex items-center gap-3 px-4 py-3">
          <div className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconColors}`}>
            {messageIcons[message.type]}
          </div>
          <div className="flex-1 text-sm font-medium text-[var(--text-color)] leading-tight">
            {message.text}
          </div>
          <Button
            type="button"
            title="Cerrar"
            onClick={dismiss}
            icon={<CloseIcon className="h-5 w-5" />}
          />
        </div>
      </div>
    </div>
  );
}
