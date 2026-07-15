import { useEffect } from 'react';
import Button from '../ui/button';

// Icons.
import CloseIcon from '../../assets/icons/close.svg?react';
import MusicIcon from '../../assets/icons/music.svg?react';
import EditIcon from '../../assets/icons/edit.svg?react';

interface DecisionModalProps {
  show: boolean;
  onClose: () => void;
  onChooseNewSlide: () => void;
  onChooseCloneChorus: () => void;
}

export default function DecisionModal({
  show,
  onClose,
  onChooseNewSlide,
  onChooseCloneChorus,
}: DecisionModalProps) {
  
  // Cerrar el modal automáticamente si presionan la tecla Escape
  useEffect(() => {
    if (!show) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Telón de fondo (Backdrop) con desenfoque suave */}
      <div 
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Contenedor del Modal */}
      <div className="relative bg-[var(--bg-color)] border-[var(--border-color)] border rounded-2xl max-w-md w-full p-6 shadow-xl  transform transition-all z-10 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Botón de Cerrar */}
        <div className="w-full flex justify-end">
          <Button
            type="button"
            title="Cerrar"
            onClick={onClose}
            icon={<CloseIcon className="w-6 h-4" />}
          />
        </div>

        {/* Contenido Principal */}
        <div className="text-center mt-2">
          <span className="text-4xl block mb-3" role="img" aria-label="rayo">
            ⚡
          </span>
          <h3 className="mb-4 text-2xl font-semibold text-[var(--text-color)]">
            ¿Qué deseas agregar en esta posición?
          </h3>
          <p className="mb-10 text-md text-[var(--text-color)] leading-relaxed px-2">
            Detectamos que ya tienes un coro configurado. Puedes escribir un verso nuevo o clonar el bloque del coro automáticamente aquí.
          </p>
          
          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={onChooseNewSlide}
              className="w-full sm:w-auto min-w-[120px] bg-[var(--bg-color)] text-[var(--text-color)] border border-[var(--border-color)] py-2.5 px-5 rounded-xl font-medium opacity-80 hover:opacity-100 transition-all cursor-pointer flex justify-center gap-2 flex-1"
            >
              <EditIcon className="w-5 h-5" />Diapositiva
            </button>
            <button
              type="button"
              onClick={onChooseCloneChorus}
              className="w-full sm:w-auto min-w-[150px] bg-[var(--primary-color)] text-[var(--text-color-inverted)] py-2.5 px-5 rounded-xl font-semibold shadow-md opacity-90 hover:opacity-100 transition-all cursor-pointer border border-transparent flex justify-center gap-2 flex-1"
            >
              <MusicIcon className="w-5 h-5" />Repetir Coro
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
