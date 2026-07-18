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
  
  let rootStyles = 'w-[350px] p-6 bg-bg border rounded-lg shadow-lg hover:border-[var(--primary-color)]';
  if (active) {
    rootStyles += ' border-2 border-[var(--secondary-color)]';
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
        <Link
        className="inline-flex items-center px-3 py-2 text-md text-bg font-semibold text-center rounded-lg bg-secondary hover:bg-[var(--primary-color)] hover:text-white"
        to={`/song?id=${data.id}&playlist=true`}
        data-drawer-hide="side-drawer"
        aria-controls="side-drawer"
        onClick={() => onClick?.()}
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