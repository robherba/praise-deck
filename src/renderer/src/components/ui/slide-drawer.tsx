import React, { useEffect, useState } from 'react';
import ActiveSongs from './active-songs';
import { Song } from '../../types';
import Button from './button';

// Icons.
import PlaylistIcon from '../../assets/icons/playlist.svg?react';
import CloseIcon from '../../assets/icons/close.svg?react';

type SlideDrawerProps = {
  currentId?: string | null;
  onClick?: () => void;
};

const SlideDrawer: React.FC<SlideDrawerProps> = ({ currentId, onClick }) => {
  const [activeSongs, setActiveSongs] = useState<Song[]>([]);
  const id = currentId ? parseInt(currentId) : undefined;
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const loadActiveSongs = async () => {
      try {
        const songs = await window.api.getActiveSongs();
        setActiveSongs(songs || []);
      } catch (error) {
        console.error('Error fetching active songs:', error);
      }
    };
    loadActiveSongs();
  }, []);

  const handleClick = () => {
    onClick?.();
    setIsOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        title="Lista de reproducción"
        onClick={() => setIsOpen(true)}
        icon={<PlaylistIcon className="w-5 h-5" />}
      />
      {/* Overlay & Drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black bg-opacity-40 transition-opacity"
          role="dialog"
          aria-modal="true"
        >
          {/* Click outside to close */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

          {/* Drawer */}
          <div className="relative w-full max-w-3xl mx-auto bg-[var(--bg-color)] rounded-t-lg md:rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-semibold text-[var(--text-color)]">
                Lista de Reproducción
              </h3>
              <Button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Cerrar lista de reproducción"
                icon={<CloseIcon className="w-5 h-5" />}
              />
            </div>
            <ActiveSongs activeId={id} songs={activeSongs} onClick={handleClick} />
          </div>
        </div>
      )}
    </>
  );
};

export default SlideDrawer;
