import { useEffect, useState } from 'react';
import Button from '../ui/button';

// Icons.
import CloseIcon from '../../assets/icons/close.svg?react';
import WarningIcon from '../../assets/icons/warning.svg?react';

type DeleteConfirmationProps = {
  onDelete: () => void;
};

export function DeleteConfirmation({ onDelete }: DeleteConfirmationProps) {
  const [openModal, setOpenModal] = useState(false);

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleConfirm = () => {
    handleCloseModal();
    onDelete();
  };

  // Cerrar el modal automáticamente si presionan la tecla Escape
  useEffect(() => {
    if (!openModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseModal();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openModal]);

  return (
    <>
      <span
        onClick={() => setOpenModal(true)}
        className="font-heading ml-auto underline text-md py-2 hover:underline mx-auto cursor-pointer"
      >
        Eliminar canto
      </span>

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Telón de fondo (Backdrop) con desenfoque suave */}
          <div
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
            onClick={handleCloseModal}
          />

          {/* Contenedor del Modal */}
          <div className="relative bg-[var(--bg-color)] border-[var(--border-color)] border rounded-2xl max-w-md w-full p-6 shadow-xl transform transition-all z-10 animate-in fade-in zoom-in-95 duration-150">
            {/* Botón de Cerrar */}
            <div className="w-full flex justify-end">
              <Button
                type="button"
                title="Cerrar"
                onClick={handleCloseModal}
                icon={<CloseIcon className="w-6 h-4" />}
              />
            </div>

            {/* Contenido Principal */}
            <div className="text-center mt-2">
              <WarningIcon className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
              <h3 className="mb-6 text-xl font-semibold text-[var(--text-color)]">
                ¿Estás seguro de que deseas eliminar este canto?
              </h3>

              {/* Botones de Acción */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full sm:w-auto min-w-[120px] bg-[var(--bg-color)] text-[var(--text-color)] border border-[var(--border-color)] py-2.5 px-5 rounded-xl font-medium opacity-80 hover:opacity-100 transition-all cursor-pointer flex justify-center gap-2 flex-1"
                >
                  No, cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="w-full sm:w-auto min-w-[150px] bg-red-600 hover:bg-red-700 text-white py-2.5 px-5 rounded-xl font-semibold shadow-md transition-all cursor-pointer border border-transparent flex justify-center gap-2 flex-1"
                >
                  Sí, estoy seguro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

