import { useCategoryImage } from '../hooks/use-category-image';
import { useKeyPress } from '../hooks/use-key-press';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/button';

// Icons.
import FullScreenIcon from '../assets/icons/full-screen.svg?react';
import CloseIcon from '../assets/icons/close.svg?react';
import HomeIcon from '../assets/icons/home.svg?react';

export default function NotesPage() {
  const navigate = useNavigate();

  const image = useCategoryImage('predeterminado');
  const editorRef = useRef<HTMLDivElement>(null);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  // Monitor fullscreen change events and focus the editor on mount.
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    editorRef.current?.focus();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);

      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    };
  }, []);

  // Check if content editable element has text.
  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.textContent?.trim() ?? '';
    setIsEmpty(text.length === 0);
  };

  // Toggle application window fullscreen state.
  const toggleFullScreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  // Ensure fullscreen is closed before routing home.
  const handleGoHome = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } finally {
      navigate('/');
    }
  };

  useKeyPress('Escape', handleGoHome);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <img
        className="absolute inset-0 w-full h-full object-cover"
        src={`media://${image}`}
        alt="background"
      />

      <div className="fixed top-4 right-4 z-50 flex gap-4 opacity-20 hover:opacity-100 transition-opacity">
        <Button
          type="button"
          title="Inicio"
          onClick={handleGoHome}
          icon={<HomeIcon className="w-5 h-5" />}
        />

        <Button
          type="button"
          title={
            isFullScreen
              ? 'Salir de pantalla completa'
              : 'Pantalla completa'
          }
          onClick={toggleFullScreen}
          icon={
            isFullScreen ? (
              <CloseIcon className="w-6 h-4" />
            ) : (
              <FullScreenIcon className="w-6 h-5" />
            )
          }
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="w-[75%] h-[80vh] flex items-center justify-center text-center bg-white/50 backdrop-blur-sm rounded-md p-10">
          <div className="relative w-full max-w-[80%]">
            {isEmpty && (
              <div
                className="absolute inset-0 pointer-events-none text-black/40 heading-dinamic font-heading"
              >
                Escriba aquí sus notas...
              </div>
            )}

            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              onClick={() => editorRef.current?.focus()}
              className="heading-dinamic font-heading text-black outline-none min-h-[120px] w-full"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
