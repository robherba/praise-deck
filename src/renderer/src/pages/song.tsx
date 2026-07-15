import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Slider, { SliderHandle } from '../components/ui/slider';
import { useCategoryImage } from '../hooks/use-category-image';
import SlideDrawer from '../components/ui/slide-drawer';
import { useKeyPress } from '../hooks/use-key-press';
import Button from '../components/ui/button';
import { Song } from '../types';

// Icons.
import TranslationIcon from '../assets/icons/translation.svg?react';
import FullScreenIcon from '../assets/icons/full-screen.svg?react';
import RestartIcon from '../assets/icons/restart.svg?react';
import CloseIcon from '../assets/icons/close.svg?react';
import HomeIcon from '../assets/icons/home.svg?react';

export default function SongPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sliderRef = useRef<SliderHandle>(null);
  
  const [song, setSong] = useState<Song | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  // Check if current song contains any valid translation.
  const hasTranslations = useMemo(() => {
    return song?.translations?.some(t => t && t.trim().length > 0) || false;
  }, [song]);

  // Query parameters.
  const playlist = searchParams.get('playlist');
  const id = searchParams.get('id');

  // Fetch song details from Electron database.
  const loadSongData = useCallback(async () => {
    if (id) {
      try {
        const rows = await window.api.getSongData(parseInt(id, 10));
        if (rows && rows.length) {
          const [currentSong] = rows;
          setSong(currentSong);
        }
      } catch (error) {
        console.error('Error fetching songs:', error);
      }
    }
  }, [id]);

  useEffect(() => {
    loadSongData();
  }, [id, loadSongData]);

  // Handle system fullscreen change events.
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
  
    document.addEventListener('fullscreenchange', handleFullScreenChange);
  
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

  // Exit fullscreen on component unmount.
  useEffect(() => {
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    };
  }, []);

  // Return to home page on Escape press.
  useKeyPress('Escape', () => {
    navigate('/');
  });

  const handleGoToSlide = (index: number) => {
    sliderRef.current?.goToSlide(index);
  };

  // Toggle fullscreen mode on document level.
  const toggleFullScreen = () => {
    const elem = document.documentElement;
    if (!document.fullscreenElement) {
      elem.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const image = useCategoryImage(song?.tags || 'predeterminado');

  const renderedSlider = useMemo(() => {
    if (!song) return;

    return (
      <Slider ref={sliderRef} className="w-screen h-screen">
        {song.slides && Array.isArray(song.slides) &&
          song.slides.map((item: string, index: number) => {
            const isLast = index === song.slides.length - 1;
            return (
              <div key={index} className="w-full h-full">
                <img
                  className="w-full h-full absolute top-0 left-0"
                  src={`media://${image}`}
                  alt="background"
                />
                <div className="w-full h-full flex items-center justify-center z-10">
                  <div className="w-[75%] h-[80%] flex flex-col items-center justify-center text-center bg-[#fff]/50 backdrop-blur-sm rounded-md gap-6">
                    <h1 className="heading-dinamic font-heading max-w-[80%] text-[#000] opacity-0 transition-opacity duration-300 group-current:opacity-100 whitespace-pre-wrap">{item}</h1>
                    {showTranslation && song.translations?.[index] && (
                      <h2
                        className="subheading-dinamic max-w-[65%] text-[#000] font-regular opacity-0 transition-opacity duration-300 group-current:opacity-80 whitespace-pre-wrap mt-4"
                      >
                        {song.translations[index]}
                      </h2>
                    )}
                  </div>
                  {isLast && (
                    <div className="flex gap-4 mt-8 absolute bottom-4 right-4">
                      <Button
                        type="button"
                        title="Inicio"
                        onClick={() => navigate('/')}
                        icon={<HomeIcon className="w-5 h-5" />}
                      />
                      <Button
                        type="button"
                        title="Reiniciar"
                        onClick={() => handleGoToSlide(0)}
                        icon={<RestartIcon className="w-5 h-5" />}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </Slider>
    );
  }, [id, song, image, showTranslation, navigate]);

  return (
    <main id="presentation" className="relative flex min-h-screen flex-col items-center">
      <div className="p-6 flex gap-4 justify-end fixed right-0 top-0 opacity-10 hover:opacity-100 w-6/12 transition-opacity z-50">
        {hasTranslations && (
          <Button
            type="button"
            title={showTranslation ? 'Ocultar traducción' : 'Mostrar traducción'}
            onClick={() => setShowTranslation(!showTranslation)}
            className={`transition-all ${showTranslation ? '!bg-[var(--primary-color)] !border-[var(--primary-color)] !text-[var(--text-color-inverted)] shadow-lg scale-105' : 'opacity-60 hover:opacity-100'}`}
            icon={<TranslationIcon className="w-5 h-5" />}
          />
        )}
        <Button
          type="button"
          title="Inicio"
          onClick={() => navigate('/')}
          icon={<HomeIcon className="w-5 h-5" />}
        />
        <Button
          type="button"
          title={isFullScreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          onClick={toggleFullScreen}
          icon={
            isFullScreen ? (
              <CloseIcon className="w-6 h-4" />
            ) : (
              <FullScreenIcon className="w-6 h-5" />
            )
          }
        />
        {(playlist || song?.active) ? <SlideDrawer currentId={id} onClick={() => handleGoToSlide(0)} /> : ''}
      </div>
      {renderedSlider}
    </main>
  );
}
