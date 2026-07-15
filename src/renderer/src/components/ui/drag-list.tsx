import React from 'react';
import { useMessage } from '../../context/message-context';

// Icons.
import RemoveIcon from '../../assets/icons/remove.svg?react';
import MusicIcon from '../../assets/icons/music.svg?react';
import EditIcon from '../../assets/icons/edit.svg?react';
import CopyIcon from '../../assets/icons/copy.svg?react';

interface SlideItem {
  text: string;
  isChorus: boolean;
  translation?: string;
}

interface DragListProps {
  items: SlideItem[];
  onReorder: (newItems: SlideItem[]) => void;
  onToggleChorus: (index: number) => void;
  onRemove: (index: number) => void;
  onEdit: (index: number) => void;
  onInsertBetween: (index: number) => void;
  showTranslations?: boolean;
}

export default function DragAndDropList({
  items,
  onReorder,
  onToggleChorus,
  onRemove,
  onEdit,
  onInsertBetween,
  showTranslations = false,
}: DragListProps) {
  const { setMessage } = useMessage();

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (sourceIndex === targetIndex) return;

    const updated = [...items];
    const [movedItem] = updated.splice(sourceIndex, 1);
    updated.splice(targetIndex, 0, movedItem);
    onReorder(updated);
  };

  const copyToClipboard = (e: React.MouseEvent, text: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setMessage('Texto copiado');
  };

  return (
    <div className="w-full flex flex-col gap-2" onDragOver={(e) => e.preventDefault()}>
      {items.map((item, index) => {
        const isLastItem = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              className={`group relative flex items-center justify-between p-4 pl-14 rounded-xl border transition-all select-none cursor-grab active:cursor-grabbing ${
                item.isChorus
                  ? 'bg-[var(--primary-color-light)] border-[var(--primary-color)]'
                  : 'bg-[var(--bg-color)] border-[var(--border-color)]'
              }`}
            >
              {/* Indicador/Botón de Coro */}
              <button
                type="button"
                title={item.isChorus ? "Quitar del coro" : "Marcar como coro"}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleChorus(index);
                }}
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
                  item.isChorus
                    ? 'bg-[var(--primary-color-light)] border-[var(--primary-color)] shadow-sm scale-100'
                    : 'bg-[var(--bg-color)] border-[var(--border-color)] text-[var(--text-color)] opacity-40 hover:opacity-100'
                }`}
              >
                <span className="text-md">
                  <MusicIcon className="w-5 h-5" />
                </span>
              </button>

              {/* Contenido */}
              <div className="flex-1 pr-4">
                <span className={`absolute top-2 right-4 text-[11px] font-bold tracking-wider uppercase ${
                  item.isChorus ? 'text-[var(--secondary-color)]' : 'text-[var(--text-color)] opacity-50'
                }`}>
                  {item.isChorus ? 'Coro' : 'Verso'}
                </span>
                <p className="text-md whitespace-pre-wrap leading-relaxed text-[var(--text-color)]">
                  {item.text}
                </p>
                {showTranslations && item.translation && (
                  <p className="text-sm italic whitespace-pre-wrap leading-relaxed text-[var(--text-color)] opacity-70 mt-1">
                    {item.translation}
                  </p>
                )}
              </div>

              {/* Panel de acciones */}
              <div
                className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-2"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <button
                  type="button"
                  onClick={(e) => copyToClipboard(e, item.text)}
                  className="p-1.5 hover:bg-[var(--gray-color)] text-[var(--text-color)] rounded-lg transition-colors"
                  title="Copiar"
                >
                  <CopyIcon className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(index)}
                  className="p-1.5 text-[var(--text-color)] hover:bg-[var(--primary-color-light)] rounded-lg transition-colors"
                  title="Editar"
                >
                  <EditIcon className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="p-1.5 text-[var(--text-color)] hover:bg-[var(--primary-color-light)] rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <RemoveIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Divisor/Botón intermedio inteligente */}
            {!isLastItem && (
              <div 
                className="flex justify-center h-6 relative group/btn z-30 transition-all"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-dashed border-[var(--border-color)] opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof onInsertBetween === 'function') {
                      onInsertBetween(index);
                    }
                  }}
                  className="absolute px-2.5 py-0.5 text-[12px] font-medium border rounded-md shadow-sm transition-all cursor-pointer opacity-0 group-hover/btn:opacity-100 bg-[var(--bg-color)] text-[var(--text-color)] border-[var(--border-color)] hover:bg-[var(--secondary-color)] hover:text-[var(--text-color-inverted)] hover:border-[var(--secondary-color)]"
                >
                  + Agregar aquí
                </button>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
