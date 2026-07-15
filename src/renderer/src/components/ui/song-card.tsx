import React from 'react';
import { Song } from '../../types';
import { Link } from 'react-router-dom';
import { toSentenceCase } from '../../utils/text';

// Icons.
import PlayIcon from '../../assets/icons/play.svg?react';

interface SongCardProps {
  data: Song;
  active?: boolean;
  onClick?: () => void;
  onChange?: () => void;
  showRemoveOption?: boolean;
}

export function SongCard({
  data,
  active,
  showRemoveOption,
  onClick,
  onChange
}: SongCardProps): React.JSX.Element {
  
  // Utilizando tus variables CSS registradas en Tailwind v4
  let rootStyles = 'w-[350px] p-6 bg-bg border border-border-custom rounded-lg shadow-lg';
  if (active) {
    rootStyles += ' border-2';
  }

  return (
    <div className={`${rootStyles} h-full min-h-[150px] flex flex-col`}>
      <h5 className="text-3xl font-bold font-heading">
        {toSentenceCase(data.title)}
      </h5>
      <p className="mb-8 text-md">
        {data.category} {data.number}
      </p>
      
      <div className="flex mt-auto">
        {/* React Router Link syntax */}
        <Link
          to={`/song?id=${data.id}&playlist=true`} // 👈 Formato de URL plano y limpio
          onClick={() => onClick?.()}
          aria-controls="side-drawer"
          data-drawer-hide="side-drawer"
          className="inline-flex items-center px-3 py-2 text-md text-bg font-semibold text-center rounded-lg bg-secondary"
        >
          Presentar
          <PlayIcon className="w-[20px] h-[20px] ml-2" />
        </Link>
        
        {showRemoveOption && (
          <span
            onClick={() => onChange?.()}
            className="font-heading ml-4 underline text-md py-2 hover:underline mx-auto cursor-pointer"
          >
            Quitar
          </span>
        )}
      </div>
    </div>
  );
}

export default SongCard;