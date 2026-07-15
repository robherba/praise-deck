import React from 'react';
import SongCard from './song-card';
import { Song } from '../../types';

type ActiveSongsProps = {
  songs: Song[];
  className?: string;
  activeId?: number;
  showRemoveOption?: boolean;
  onClick?: (id: number) => void;
  onChange?: (id: number, currentStatus: boolean) => void;
};

const ActiveSongs: React.FC<ActiveSongsProps> = ({
  songs,
  activeId,
  className,
  showRemoveOption,
  onClick,
  onChange
}) => {
  if (!songs.length) {
    return undefined;
  }
  return (
    <ul className={`w-full my-2 flex gap-4 overflow-auto py-4 ${className}`}>
      {songs.map((song: Song) => {
        const isActive = activeId === song.id;
        return (
          <li key={song.id}>
            <SongCard
              data={song}
              active={isActive}
              showRemoveOption={showRemoveOption}
              onChange={() => onChange?.(song.id, song.active)}
              onClick={() => onClick?.(song.id)}
            />
          </li>
        );
      })}
    </ul>
  );
};

export default ActiveSongs;
