import { useEffect } from 'react';

// Custom hook to trigger a callback when a specific key is pressed.
export function useKeyPress(key: string, callback: () => void): void {
  useEffect(() => {
    // Handles the key press event.
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === key) {
        callback();
      }
    };

    // Adds the keydown event listener.
    window.addEventListener('keydown', handleKeyPress);

    // Cleans up the event listener when the component unmounts.
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [key, callback]);
}
