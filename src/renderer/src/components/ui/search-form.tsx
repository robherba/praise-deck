import { useCallback, useEffect, useState } from 'react';
import { useKeyPress } from '../../hooks/use-key-press';
import { SearchFormProps } from '../../types';

// Icons.
import FilterOffIcon from '../../assets/icons/filter-off.svg?react';
import SearchIcon from '../../assets/icons/search.svg?react';

export default function SearchForm({ onSearch }: SearchFormProps) {
  const [searchText, setSearchText] = useState('');

  const handleSubmit = useCallback(() => {
    onSearch({
      searchText,
      category: '', // el tipo lo manejan los tabs
    });
  }, [searchText, onSearch]);

  const handleClear = () => {
    setSearchText('');
    onSearch({ searchText: '', category: '' });
  };

  const handleSearchText = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    if (value === '') {
      onSearch({ searchText: '', category: '' });
    }
  };

  /* ===============================
     KEY EVENTS
  =============================== */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const input = document.querySelector('#simple-search');
      if (event.key === 'Escape' && document.activeElement === input) {
        handleClear();
      }
      if (event.key === 'Enter' && document.activeElement === input) {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit]);

  useKeyPress('Enter', handleSubmit);
  useKeyPress('Escape', handleClear);

  /* ===============================
     RENDER
  =============================== */
  return (
    <div className="relative max-w-[700px] mb-6 flex">
      <label htmlFor="simple-search" className="sr-only">
        Buscar canto
      </label>

      {/* SEARCH INPUT */}
      <div className="relative w-80">
        <input
          type="text"
          id="simple-search"
          value={searchText}
          onChange={handleSearchText}
          placeholder="Buscar canto..."
          className="w-full rounded-lg p-2.5 border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] font-medium focus:border-[var(--primary-color)] focus:ring-1 focus:ring-[var(--primary-color)] outline-none"
        />
      </div>

      {/* SEARCH BUTTON */}
      <button
        type="button"
        title="Buscar"
        onClick={handleSubmit}
        className="flex items-center p-1.5 ms-2 rounded-lg bg-[var(--secondary-color)] text-[var(--bg-color)]"
      >
        <span className="sr-only">Buscar</span>
        <SearchIcon className="w-8 h-6" />
      </button>

      {/* CLEAR BUTTON */}
      {searchText && (
        <button
          onClick={handleClear}
          title="Limpiar búsqueda"
          className="flex items-center p-1.5 ms-2 rounded-lg bg-[var(--text-color)] text-[var(--bg-color)]"
        >
          <span className="sr-only">Limpiar</span>
          <FilterOffIcon className="w-8 h-6" />
        </button>
      )}
    </div>
  );
}
