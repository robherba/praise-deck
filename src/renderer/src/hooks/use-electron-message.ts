import { useEffect } from 'react';
import { useMessage } from '../context/message-context.jsx';

// Custom hook to listen for messages from Electron and update the global message state.
export function useElectronMessage(): void {
  const { setMessage } = useMessage();

  useEffect(() => {
    console.log('useElectronMessage running!!');

    type MessageType = 'success' | 'error' | 'warning' | 'info';

    const isValidType = (t: unknown): t is MessageType =>
      typeof t === 'string' && ['success', 'error', 'warning', 'info'].includes(t);

    const handleMessage = (message: string, type?: unknown) => {
      const finalType: MessageType = isValidType(type) ? type : 'success';
      setMessage(message, finalType);
    };

    // Listen for the message from Electron.
    window.api.receiveMessage(handleMessage);

    return () => {
      // Clean up the listener when the component unmounts.
      window.api.removeReceiveMessage(handleMessage);
    };
  }, [setMessage]);
}
