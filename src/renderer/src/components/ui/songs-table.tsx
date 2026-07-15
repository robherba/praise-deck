import React from 'react';
import Empty from './empty';
import { Song } from '../../types';
import { Link } from 'react-router-dom';
import { toSentenceCase } from '../../utils/text';

interface SongsTableProps {
  songs: Song[];
  isLoading?: boolean;
  isEditing?: boolean;
  activeTab?: string;
  tabs?: string[];
  isSearching?: boolean;
  onTabChange?: (tab: string) => void;
  onEditPress?: (status: boolean) => void;
  onSongPress?: (id: number, currentStatus: boolean) => void;
}

export function SongsTable({
  songs,
  isLoading,
  isEditing,
  activeTab,
  tabs = [],
  isSearching = false,
  onTabChange,
  onEditPress,
  onSongPress,
}: SongsTableProps): React.JSX.Element {
  return (
    <>
      {isLoading ? (
        <div className="mx-auto my-8">
          <span className="text-md uppercase">
            Cargando datos...
          </span>
        </div>
      ) : (
        <>
          <div className="w-full border border-border-custom rounded-lg shadow-lg overflow-hidden">
            {/* TABS */}
            {onTabChange && tabs && tabs.length > 0 && (
              <div className="border-b border-border-custom px-4 bg-bg">
                <ul className="flex gap-6 text-md font-semibold">
                  {tabs.map((tab) => {
                    const val = tab.toLowerCase();
                    const isActive = activeTab?.toLowerCase() === val;
                    const displayName = tab.endsWith('s') || tab.endsWith('S') ? tab : tab + 's';
                    return (
                      <li key={tab}>
                        <button
                          type="button"
                          onClick={() => onTabChange(val)}
                          className={`py-3 transition relative cursor-pointer
                            ${
                              isActive
                                ? 'text-secondary'
                                : 'hover:text-custom'
                            }
                          `}
                        >
                          {displayName}
                          {isActive && (
                            <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-secondary rounded-full" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* TABLE OR EMPTY STATE */}
            {songs.length > 0 ? (
              <table className="w-full text-md text-left">
                <thead className="text-md uppercase">
                  <tr>
                    <th className="px-6 py-3 w-40 my-4 inline-block">Identificador</th>
                    <th className="px-6 py-3">Título</th>
                    {onSongPress && (
                      <th className="px-6 py-3">
                        {!isEditing && 'Seleccionado'}
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {songs.map((song, index) => (
                    <tr key={index} className="border-b border-border-custom last:border-b-0">
                      <td className="px-6 py-4 uppercase">
                        {song.category} {song.number}
                      </td>

                      <th scope="row">
                        {onSongPress ? (
                          /* React Router Link syntax */
                          <Link
                            to={isEditing ? `/song-form?id=${song.id}&edit=true` : `/song?id=${song.id}`}
                            className="text-xl font-heading px-6 py-4 hover:underline block"
                          >
                            {isEditing && 'Editar:'} {toSentenceCase(song.title)}
                          </Link>
                        ) : (
                          <span className="text-xl font-heading px-6 py-4 block">
                            {toSentenceCase(song.title)}
                          </span>
                        )}
                      </th>

                      {onSongPress && (
                        <td className="px-6">
                          {!isEditing && (
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={song.active}
                                className="sr-only peer"
                                onChange={() => onSongPress(song.id, song.active)}
                              />
                              <div className="relative w-11 h-6 rounded-full bg-[var(--border-color)] after:content-[''] after:absolute after:bg-[var(--bg-color)] after:top-[2px] after:start-[2px] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--secondary-color)] peer-checked:after:translate-x-full"></div>
                            </label>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="bg-bg py-12 flex justify-center">
                {isSearching ? (
                  <div className="text-center w-full max-w-[700px] flex flex-col gap-6 p-8 bg-bg rounded-md">
                    <h2 className="mt-10 mb-0 text-3xl font-extrabold leading-none tracking-tight font-heading text-custom">
                      No se encontraron cantos
                    </h2>
                    <p className="mb-8 text-md text-custom opacity-80">
                      Prueba con otros términos de búsqueda o verifica la ortografía
                    </p>
                  </div>
                ) : (
                  <Empty />
                )}
              </div>
            )}
          </div>

          {songs.length > 0 && onSongPress && (
            <span
              onClick={() => onEditPress?.(!isEditing)}
              className="font-heading ml-auto underline text-md py-4 cursor-pointer"
            >
              {isEditing ? 'Seleccionar Cantos' : 'Editar Cantos'}
            </span>
          )}
        </>
      )}
    </>
  );
}

export default SongsTable;
