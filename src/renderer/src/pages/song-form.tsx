import { DeleteConfirmation } from '../components/modals/delete-confirmation';
import { useElectronMessage } from '../hooks/use-electron-message';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DecisionModal from '../components/modals/decision-modal';
import SlideModal from '../components/modals/slide-modal';
import { useCallback, useEffect, useState } from 'react';
import DragAndDropList from '../components/ui/drag-list';
import { useMessage } from '../context/message-context';
import Header from '../components/layout/header';
import Input from '../components/ui/input';

interface SlideItem {
  text: string;
  isChorus: boolean;
  translation?: string;
}

export default function SongForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setMessage } = useMessage();
  
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [slides, setSlides] = useState<SlideItem[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showTranslations, setShowTranslations] = useState(false);

  const [modalText, setModalText] = useState('');
  const [modalTranslationText, setModalTranslationText] = useState('');
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);

  const [song, setSong] = useState({
    active: false,
    category: '',
    number: '',
    title: '',
    tags: '',
  });

  // Query parameters.
  const id = searchParams.get('id');
  const edit = searchParams.get('edit');

  useElectronMessage();

  // Fetch initial song details if editing.
  const loadSongData = useCallback(async () => {
    if (id) {
      try {
        const rows = await window.api.getSongData(parseInt(id, 10));
        if (rows && rows.length) {
          const [currentSong] = rows;
          
          setSong({
            title: currentSong.title || '',
            tags: currentSong.tags ? String(currentSong.tags).toLowerCase() : '',
            number: currentSong.number ? String(currentSong.number) : '',
            category: currentSong.category ? String(currentSong.category).toLowerCase() : '',
            active: currentSong.active || false,
          });

          const savedChorusIndices = (currentSong.chorus || [])
            .map((val: any) => parseInt(val, 10))
            .filter((val: number) => !isNaN(val));

          const formattedSlides = (currentSong.slides || []).map((text: string, index: number) => ({
            text,
            isChorus: savedChorusIndices.includes(index),
            translation: currentSong.translations?.[index] || '',
          }));
          
          if (currentSong.translations && currentSong.translations.some((t: string) => t.trim().length > 0)) {
            setShowTranslations(true);
          }

          setSlides(formattedSlides);
        }
      } catch (error) {
        console.error('Error fetching songs:', error);
      }
    }
  }, [id]);

  useEffect(() => {
    loadSongData();
  }, [loadSongData]);

  // Load category suggestions on mount.
  useEffect(() => {
    const getCategories = async () => {
      const data = await window.api.getCategories();
      setCategories(data || []);
    };
    const fetchTypes = async () => {
      const types = await window.api.getSongTypes();
      setSuggestedCategories(types || []);
    };
    getCategories();
    fetchTypes();
  }, []);

  // Update song text input values.
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setSong((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Select or deselect matching chorus slides automatically.
  const handleToggleChorus = (selectedIndex: number) => {
    const targetSlide = slides[selectedIndex];
    if (!targetSlide) return;

    const newChorusState = !targetSlide.isChorus;
    const targetTextClean = targetSlide.text.trim().toLowerCase();

    let autoSelectedCount = 0;
    const newSlides = slides.map((slide, idx) => {
      if (slide.text.trim().toLowerCase() === targetTextClean) {
        if (idx !== selectedIndex && newChorusState === true) {
          autoSelectedCount++;
        }
        return { ...slide, isChorus: newChorusState };
      }
      return { ...slide };
    });

    setSlides(newSlides);

    if (newChorusState && autoSelectedCount > 0) {
      setMessage(`¡Se identificaron y marcaron ${autoSelectedCount} repeticiones automáticamente!`);
    } else if (!newChorusState && autoSelectedCount > 0) {
      setMessage(`Se removió el coro de todas las diapositivas idénticas.`);
    }
  };

  // Open editor or insertion modal.
  const handleOpenModal = (index: number | null = null, isInsertion: boolean = false) => {
    if (isInsertion) {
      setEditIndex(null);
      setInsertIndex(index);
      setModalText('');
      setModalTranslationText('');

      const hasChorus = slides.some(slide => slide.isChorus);

      if (hasChorus) {
        setShowDecisionModal(true);
      } else {
        setShowModal(true);
      }
    } else {
      setEditIndex(index);
      setInsertIndex(null);
      setModalText(index !== null ? slides[index].text : '');
      setModalTranslationText(index !== null ? (slides[index].translation || '') : '');
      setShowModal(true);
    }
  };

  const handleChooseNewSlide = () => {
    setShowDecisionModal(false);
    setShowModal(true);
  };

  // Duplicate current chorus slides at specific position.
  const handleChooseCloneChorus = () => {
    setShowDecisionModal(false);
    if (insertIndex === null) return;

    const firstChorusIndex = slides.findIndex(slide => slide.isChorus);
    if (firstChorusIndex === -1) return;

    const chorusSlidesToClone: SlideItem[] = [];
    for (let i = firstChorusIndex; i < slides.length; i++) {
      if (slides[i].isChorus) {
        chorusSlidesToClone.push({ text: slides[i].text, isChorus: true, translation: slides[i].translation || '' });
      } else {
        break;
      }
    }

    const updated = [...slides];
    updated.splice(insertIndex, 0, ...chorusSlidesToClone);
    
    setSlides(updated);
    setInsertIndex(null);
  };

  // Apply additions or edits to slide state list.
  const handleSaveModal = () => {
    if (!modalText.trim()) return;

    const updated = [...slides];

    if (editIndex !== null) {
      updated[editIndex].text = modalText;
      updated[editIndex].translation = modalTranslationText;
      setSlides(updated);
    } else if (insertIndex !== null) {
      updated.splice(insertIndex, 0, { text: modalText, isChorus: false, translation: modalTranslationText });
      setSlides(updated);
    } else {
      setSlides([...slides, { text: modalText, isChorus: false, translation: modalTranslationText }]);
    }
    
    setShowModal(false);
    setEditIndex(null);
    setInsertIndex(null);
  };

  // Save changes and redirect back.
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const finalSlides = slides.map((s) => s.text);
    const finalTranslations = slides.map((s) => s.translation || '');
    const finalChorus = slides.reduce((acc, s, index) => {
      if (s.isChorus) acc.push(index);
      return acc;
    }, [] as number[]);

    const songPayload = {
      ...song,
      number: song.number ? parseInt(song.number, 10) : 0,
      slides: finalSlides,
      translations: showTranslations ? finalTranslations : [],
      chorus: finalChorus,
    };

    try {
      if (edit) {
        await window.api.updateSong(parseInt(id!, 10), songPayload);
      } else {
        await window.api.addSong(songPayload);
      }
      setMessage('Cambios guardados exitosamente!');
      navigate('/');
    } catch (error) {
      setMessage('Error al guardar los cambios', 'error');
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  // Delete current record from database.
  const handleDelete = async () => {
    if (!id) return;
    await window.api.deleteSong(parseInt(id, 10));
    setMessage('Canto eliminado exitosamente!');
    navigate('/');
  };

  return (
    <main className="w-full flex mx-auto min-h-screen flex-col p-4 md:p-12 mb-20 items-center text-[var(--text-color)] transition-colors duration-200">
      <div className="w-full max-w-3xl mb-6 text-left">
        <Header>{edit ? 'Editar Canto' : 'Nuevo Canto'}</Header>
      </div>

      <form
        className="w-full max-w-3xl flex flex-col gap-6 p-6 md:p-8 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-2xl"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className="text-sm font-semibold text-[var(--text-color)] bg-transparent">Título</label>
          <Input
            id="title"
            type="text"
            value={song.title}
            onChange={(e) => setSong((prev) => ({ ...prev, title: e.target.value }))}
            className="w-full rounded-lg p-2.5 border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] font-medium focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)] outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="number" className="text-sm font-semibold text-[var(--text-color)] bg-transparent">Número</label>
            <input
              id="number"
              type="text"
              value={song.number}
              onChange={handleInputChange}
              className="w-full rounded-lg p-2.5 border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] font-medium focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)] outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="category" className="text-sm font-semibold text-[var(--text-color)] bg-transparent">Tipo</label>
            <select
              id="category"
              value={song.category}
              onChange={handleInputChange}
              className="w-full rounded-lg p-2.5 border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] font-medium focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)] outline-none"
            >
              {suggestedCategories.map((label, idx) => {
                const val = String(label).toLowerCase();
                return (
                  <option key={idx} value={val} className="bg-[var(--bg-color)] text-[var(--text-color)]">
                    {String(label).charAt(0).toUpperCase() + String(label).slice(1)}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="tags" className="text-sm font-semibold text-[var(--text-color)] bg-transparent">Categoría</label>
            <select
              id="tags"
              value={song.tags}
              onChange={handleInputChange}
              className="w-full rounded-lg p-2.5 border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] font-medium focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)] outline-none"
            >
              <option value="" className="bg-[var(--bg-color)] text-[var(--text-color)]">Predeterminado</option>
              {categories?.filter((category) => category.label !== "Predeterminado").map((label, idx) => {
                const val = String(label).toLowerCase();
                return (
                  <option key={idx} value={val} className="bg-[var(--bg-color)] text-[var(--text-color)]">
                    {String(label).charAt(0).toUpperCase() + String(label).slice(1)}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <hr className="border-[var(--border-color)] my-2" />

        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-base font-bold text-[var(--text-color)] bg-transparent">Estructura de Diapositivas</label>
              <p className="text-sm text-[var(--text-color)] opacity-60 max-w-xl leading-relaxed">
                Usa el botón 🎵 para agrupar coros. Arrastra las tarjetas para reordenar la secuencia de proyección y usa los separadores dinámicos para expandir la letra.
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => setShowTranslations(!showTranslations)}
              className={`group flex-shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                showTranslations
                  ? 'bg-[var(--primary-color)]/10 border-[var(--primary-color)] text-[var(--primary-color)]'
                  : 'bg-[var(--bg-color)] border-[var(--border-color)] text-[var(--text-color)] opacity-70 hover:opacity-100 hover:border-[var(--text-color)]'
              }`}
              title={showTranslations ? 'Deshabilitar traducción' : 'Habilitar traducción en inglés'}
            >
              <span
                className={`relative inline-flex items-center w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${
                  showTranslations ? 'bg-[var(--primary-color)]' : 'bg-[var(--border-color)]'
                }`}
              >
                <span
                  className={`absolute left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    showTranslations ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </span>
              <span className="text-xs font-semibold whitespace-nowrap">
                {showTranslations ? 'Traducción (EN) activa' : 'Traducción en inglés'}
              </span>
            </button>
          </div>

          <div className="mt-2">
            {slides.length ? (
              <div className="space-y-4">
                <div className="group flex justify-center h-4 relative items-center">
                  <div className="absolute inset-x-0 h-[1px] bg-[var(--border-color)] scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
                  <button
                    type="button"
                    onClick={() => handleOpenModal(0, true)}
                    className="relative px-3 py-1 text-[14px] bg-[var(--bg-color)] text-[var(--text-color)] border border-[var(--border-color)] rounded-full font-medium shadow-sm opacity-65 group-hover:opacity-100 scale-95 group-hover:scale-100 hover:bg-[var(--secondary-color)] hover:text-[var(--text-color-inverted)] hover:border-[var(--secondary-color)] transition-all cursor-pointer duration-150"
                  >
                    + Agregar al inicio
                  </button>
                </div>

                <div className="bg-[var(--gray-color)] opacity-95 border border-[var(--border-color)] p-4 rounded-xl">
                  <DragAndDropList
                    items={slides}
                    onReorder={setSlides}
                    onToggleChorus={handleToggleChorus}
                    onRemove={(index) => setSlides(slides.filter((_, i) => i !== index))}
                    onEdit={(index) => handleOpenModal(index)}
                    onInsertBetween={(index) => handleOpenModal(index + 1, true)}
                    showTranslations={showTranslations}
                  />
                </div>

                <div className="group flex justify-center h-4 relative items-center pt-2">
                  <div className="absolute inset-x-0 h-[1px] bg-[var(--border-color)] scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
                  <button
                    type="button"
                    onClick={() => handleOpenModal(slides.length, true)}
                    className="relative px-3 py-1 text-[14px] bg-[var(--bg-color)] text-[var(--text-color)] border border-[var(--border-color)] rounded-full font-medium shadow-sm opacity-65 group-hover:opacity-100 scale-95 group-hover:scale-100 hover:bg-[var(--secondary-color)] hover:text-[var(--text-color-inverted)] hover:border-[var(--secondary-color)] transition-all cursor-pointer duration-150"
                  >
                    + Agregar al final
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenModal(null)}
                className="w-full py-12 border-2 border-dashed border-[var(--border-color)] rounded-2xl text-sm text-[var(--text-color)] opacity-60 hover:opacity-100 hover:border-[var(--secondary-color)] hover:text-[var(--secondary-color)] transition-all bg-[var(--gray-color)] flex flex-col items-center justify-center gap-2 cursor-pointer group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform duration-150">✨</span>
                <span className="font-medium">Agregar la primera diapositiva del canto</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-end items-center pt-4 mt-2 border-t border-[var(--border-color)] fixed bottom-0 left-0 w-full h-auto bg-[var(--bg-color)] p-4">
          <div className="max-w-3xl w-full m-auto flex gap-4 z-10 justify-end">
            {edit && (
              <div className="w-full h-auto pt-2 flex-1">
                <DeleteConfirmation onDelete={handleDelete} />
              </div>
            )}
            <button 
              type="button"
              onClick={handleCancel}
              className="w-full sm:w-auto min-w-[120px] bg-[var(--bg-color)] text-[var(--text-color)] border border-[var(--border-color)] py-2.5 px-5 rounded-xl font-medium opacity-80 hover:opacity-100 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="w-full sm:w-auto min-w-[150px] bg-[var(--primary-color)] text-[var(--text-color-inverted)] py-2.5 px-5 rounded-xl font-semibold shadow-md opacity-90 hover:opacity-100 transition-all cursor-pointer border border-transparent"
            >
              Guardar Canto
            </button>
          </div>
        </div>
      </form>

      <DecisionModal
        show={showDecisionModal}
        onClose={() => setShowDecisionModal(false)}
        onChooseNewSlide={handleChooseNewSlide}
        onChooseCloneChorus={handleChooseCloneChorus}
      />

      <SlideModal
        show={showModal}
        onClose={() => setShowModal(false)}
        value={modalText}
        onChange={setModalText}
        translationValue={modalTranslationText}
        onChangeTranslation={setModalTranslationText}
        showTranslation={showTranslations}
        isEditing={editIndex !== null}
        onConfirm={handleSaveModal}
      />
    </main>
  );
}
