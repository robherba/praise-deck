import { useElectronMessage } from '../hooks/use-electron-message';
import SuggestionInput from '../components/ui/suggestion-input';
import { useMessage } from '../context/message-context';
import SongsTable from '../components/ui/songs-table';
import Header from '../components/layout/header';
import { ImportFormData, Song } from '../types';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function ImportForm() {
  const navigate = useNavigate();
  const { setMessage } = useMessage();
  
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [formData, setFormData] = useState<ImportFormData>({
    category: '',
    songs: [],
  });

  useElectronMessage();

  // Listen to file import events from Electron and load types.
  useEffect(() => {
    const handleFileData = (content: Song[]) => {
      if (content?.length) {
        setFormData((prevFormData) => ({
          ...prevFormData,
          songs: content,
        }));
        setIsLoading(false);
      }
    };

    const fetchTypes = async () => {
      try {
        const types = await window.api.getSongTypes();
        setSuggestedCategories(types || []);
      } catch (err) {
        console.error('Error fetching types:', err);
      }
    };

    window.api.onFileData(handleFileData);
    fetchTypes();

    return () => {
      window.api.removeFileDataListener(handleFileData);
    };
  }, []);

  // Update selected category in form state.
  const handleCategoryChange = (value: string) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      category: value,
    }));
  };

  // Submit all imported songs and redirect home.
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await Promise.all(
        formData.songs.map(async (song) => {
          await window.api.addSong({ ...song, category: formData.category });
        })
      );
      setMessage('Cantos importados exitosamente!');
      navigate('/');
    } catch (error) {
      console.error('Error al importar los cantos', error);
      setMessage('Error al importar los cantos', 'error');
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <main className="w-full flex mx-auto min-h-screen flex-col p-6 md:p-20 items-center">
      <Header>Importando datos</Header>
      <form className="w-full max-w-[700px] flex flex-col gap-6 p-5 bg-green-600 shadow-md rounded-md" onSubmit={handleSubmit}>
        <SuggestionInput
          className="flex-1"
          value={formData.category}
          placeholder="Tipo de canto"
          onChange={handleCategoryChange}
          suggestions={suggestedCategories}
        />

        {!!formData.songs.length && (
          <SongsTable songs={formData.songs} isLoading={isLoading} />
        )}

        <div className="flex gap-4 justify-center mt-4">
          <button
            color="blue"
            type="submit"
            className="min-w-[180px]"
          >
            Importar Datos
          </button>
          <button   
            color="gray"
            type="reset"
            className="min-w-[180px]"
            onClick={handleCancel}
          >
            Cancelar
          </button>
        </div>
      </form>
    </main>
  );
}
