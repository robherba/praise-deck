import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Button from '../ui/button';

// Icons.
import CloseIcon from '../../assets/icons/close.svg?react';

interface SlideModalProps {
  show: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  translationValue?: string;
  onChangeTranslation?: (value: string) => void;
  showTranslation?: boolean;
  isEditing?: boolean;
}

export default function SlideModal({
  show,
  onClose,
  value,
  onChange, 
  onConfirm,
  translationValue = '',
  onChangeTranslation,
  showTranslation = false,
  isEditing = false,
}: SlideModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Manejo de eventos globales: Bloqueo de scroll y tecla Escape
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (show) {
      window.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [show, onClose]);

  if (!show) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Fondo oscuro traslúcido (Backdrop) */}
      <div 
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Contenedor del Modal */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-[var(--bg-color)] p-6 shadow-2xl transition-all border border-[var(--border-color)]"
      >
        {/* Botón de Cerrar */}
        <div className="w-full flex justify-end">
          <Button
            type="button"
            title="Cerrar"
            onClick={onClose}
            icon={<CloseIcon className="w-6 h-4" />}
          />
        </div>

        {/* Contenido */}
        <div className="flex flex-col text-center">
          <header>
            <h3 className="mb-4 text-2xl font-bold text-[var(--text-color)]">
              {isEditing ? 'Editar Diapositiva' : 'Nueva Diapositiva'}
            </h3>
            <p className="mb-6 text-md text-[var(--text-color)]">
              {isEditing ? 'Modifica el texto de esta diapositiva.' : 'Ingresa el texto que aparecerá en la proyección.'}
            </p>
          </header>

          <textarea
            id="modal-textarea"
            rows={showTranslation ? 3 : 6}
            value={value}
            onChange={(e) => {onChange(e.target.value);}}
            autoFocus
            placeholder="Escribe el verso o estrofa aquí..."
            className="w-full rounded-lg p-2.5 border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] font-medium focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)] outline-none resize-none"
          />

          {showTranslation && (
            <textarea
              id="modal-translation-textarea"
              rows={3}
              value={translationValue}
              onChange={(e) => {if (onChangeTranslation) onChangeTranslation(e.target.value);}}
              placeholder="Write the english translation here..."
              className="w-full mt-4 rounded-lg p-2.5 border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] font-medium focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)] outline-none resize-none italic opacity-90"
            />
          )}

          <footer className="mt-10 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto min-w-[120px] bg-[var(--bg-color)] text-[var(--text-color)] border border-[var(--border-color)] py-2.5 px-5 rounded-xl font-medium opacity-80 hover:opacity-100 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!value.trim()}
              className="w-full sm:w-auto min-w-[150px] bg-[var(--primary-color)] text-[var(--text-color-inverted)] py-2.5 px-5 rounded-xl font-semibold shadow-md opacity-90 hover:opacity-100 transition-all cursor-pointer border border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Guardar
            </button>
          </footer>
        </div>
      </div>
    </div>,
    document.body
  );
}
