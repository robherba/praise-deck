import { useEffect, useState } from 'react';
import { useMessage } from '../../context/message-context';
import Button from '../ui/button';

// Icons.
import CloseIcon from '../../assets/icons/close.svg?react';

type ManageTypesMode = 'add' | 'edit' | 'delete';

interface ManageTypesModalProps {
  show: boolean;
  mode: ManageTypesMode;
  onClose: () => void;
}

export default function ManageTypesModal({
  show,
  mode,
  onClose,
}: ManageTypesModalProps) {
  const { setMessage } = useMessage();

  const [types, setTypes] = useState<string[]>([]);
  const [typeName, setTypeName] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar los tipos desde la base de datos al abrir el modal
  useEffect(() => {
    if (!show) return;

    const fetchTypes = async () => {
      try {
        const result = await window.api.getSongTypes();
        const list = result || [];
        setTypes(list);

        if (list.length > 0) {
          setSelectedType(list[0]);
          if (mode === 'edit') {
            setTypeName(list[0]);
          }
        }
      } catch (err) {
        console.error('Error loading song types:', err);
      }
    };

    // Resetear estado cada vez que se abre
    setTypeName('');
    setSelectedType('');
    setIsSubmitting(false);
    fetchTypes();
  }, [show, mode]);

  // Cerrar con Escape
  useEffect(() => {
    if (!show) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, onClose]);

  const handleSelectChange = (value: string) => {
    setSelectedType(value);
    if (mode === 'edit') {
      setTypeName(value);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (mode === 'add') {
        const name = typeName.trim();
        if (!name) return;
        await window.api.addSongType(name);
        setMessage(`Tipo "${name}" agregado correctamente.`, 'success');
      } else if (mode === 'edit') {
        const newName = typeName.trim();
        if (!selectedType || !newName) return;
        await window.api.updateSongType(selectedType, newName);
        setMessage(`Tipo renombrado de "${selectedType}" a "${newName}".`, 'success');
      } else if (mode === 'delete') {
        if (!selectedType) return;
        await window.api.deleteSongType(selectedType);
        setMessage(`Tipo "${selectedType}" eliminado correctamente.`, 'success');
      }
      onClose();
      window.location.reload();
    } catch (err) {
      console.error('Error managing type:', err);
      setMessage('Ocurrió un error al procesar la solicitud.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!show) return null;

  const title =
    mode === 'add'
      ? 'Agregar nuevo tipo'
      : mode === 'edit'
        ? 'Editar tipo de canto'
        : 'Eliminar tipo de canto';

  const emoji = mode === 'add' ? '✨' : mode === 'edit' ? '✏️' : '🗑️';

  const submitLabel =
    mode === 'add' ? 'Agregar' : mode === 'edit' ? 'Guardar' : 'Eliminar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--bg-color)] border-[var(--border-color)] border rounded-2xl max-w-md w-full p-6 shadow-xl transform transition-all z-10 animate-in fade-in zoom-in-95 duration-150">
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
        <div className="mt-2">
          <span className="text-3xl block mb-2 text-center" role="img" aria-label="icono">
            {emoji}
          </span>
          <h3 className="mb-6 text-2xl font-semibold text-[var(--text-color)] text-center">
            {title}
          </h3>

          {/* Formulario */}
          <div className="flex flex-col gap-4 mb-6">
            {mode === 'add' && (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="typeName"
                  className="text-sm font-semibold text-[var(--text-color)] opacity-80"
                >
                  Nombre del tipo
                </label>
                <input
                  id="typeName"
                  type="text"
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ej. Coro, Himno..."
                  autoFocus
                  className="w-full rounded-lg p-2.5 border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] font-medium focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)] outline-none"
                />
              </div>
            )}

            {mode === 'edit' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="typeSelect"
                    className="text-sm font-semibold text-[var(--text-color)] opacity-80"
                  >
                    Selecciona el tipo a editar
                  </label>
                  <select
                    id="typeSelect"
                    value={selectedType}
                    onChange={(e) => handleSelectChange(e.target.value)}
                    className="w-full rounded-lg p-2.5 border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] font-medium focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)] outline-none"
                  >
                    {types.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="typeName"
                    className="text-sm font-semibold text-[var(--text-color)] opacity-80"
                  >
                    Nuevo nombre
                  </label>
                  <input
                    id="typeName"
                    type="text"
                    value={typeName}
                    onChange={(e) => setTypeName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="w-full rounded-lg p-2.5 border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] font-medium focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)] outline-none"
                  />
                </div>
              </>
            )}

            {mode === 'delete' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="typeSelect"
                    className="text-sm font-semibold text-[var(--text-color)] opacity-80"
                  >
                    Selecciona el tipo a eliminar
                  </label>
                  <select
                    id="typeSelect"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full rounded-lg p-2.5 border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] font-medium focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)] outline-none"
                  >
                    {types.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-red-500 -mt-2">
                  * Nota: Esto no eliminará los cantos, pero ya no tendrán este tipo asignado.
                </p>
              </>
            )}
          </div>

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto min-w-[120px] bg-[var(--bg-color)] text-[var(--text-color)] border border-[var(--border-color)] py-2.5 px-5 rounded-xl font-medium opacity-80 hover:opacity-100 transition-all cursor-pointer flex justify-center gap-2 flex-1"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`w-full sm:w-auto min-w-[150px] py-2.5 px-5 rounded-xl font-semibold shadow-md transition-all cursor-pointer border border-transparent flex justify-center gap-2 flex-1 disabled:opacity-50 ${
                mode === 'delete'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-[var(--primary-color)] text-[var(--text-color-inverted)] opacity-90 hover:opacity-100'
              }`}
            >
              {submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
