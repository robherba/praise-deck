import { useElectronMessage } from '../hooks/use-electron-message';
import { useCallback, useEffect, useState } from 'react';
import ActiveSongs from '../components/ui/active-songs';
import SongsTable from '../components/ui/songs-table';
import SearchForm from '../components/ui/search-form';
import Header from '../components/layout/header';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/button';
import Pager from '../components/ui/pager';

// Icons.
import NotesIcon from '../assets/icons/notes.svg?react'; 

import {
  SongSearchParams,
  SearchFormData,
  Song,
} from '../types';

export default function Home() {
  const navigate = useNavigate();
  useElectronMessage();

  const [isLoading, setIsLoading] = useState(true);
  const [activeSongs, setActiveSongs] = useState<Song[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [formData, setFormData] = useState<SearchFormData>();
  const [isEditing, setIsEditing] = useState(false);

  // Pagination.
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Categories.
  const [tabs, setTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('coro');

  const pageSize = 10;

  /**
   * Fetch current page songs from Electron main process.
   */
  const loadCurrentPageSongs = useCallback(async () => {
    try {
      const params: SongSearchParams = {
        formData: {
          searchText: formData?.searchText ?? '',
          category: activeTab,
        },
        pageSize,
        currentPage,
      };

      const [songs, total] = await Promise.all([
        window.api.getSongs(params),
        window.api.getSize(params),
      ]);

      setSongs(songs || []);
      setTotalCount(total || 0);
    } catch (error) {
      console.error('Error fetching songs:', error);
    }
  }, [formData, activeTab, currentPage, pageSize]);

  /**
   * Fetch globally active songs.
   */
  const loadActiveSongs = useCallback(async () => {
    try {
      const songs = await window.api.getActiveSongs();
      setActiveSongs(songs || []);
    } catch (error) {
      console.error('Error fetching active songs:', error);
    }
  }, []);

  // Load available song categories on mount.
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const dbTypes = await window.api.getSongTypes();
        if (dbTypes && dbTypes.length > 0) {
          setTabs(dbTypes);
          const lowerTypes = dbTypes.map((t: string) => t.toLowerCase());
          
          if (!activeTab || !lowerTypes.includes(activeTab)) {
            setActiveTab(lowerTypes[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching song types:', err);
      }
    };
    fetchTypes();
  }, []);

  // Reload lists when search criteria or pagination changes.
  useEffect(() => {
    const fetchData = async () => {
      await loadCurrentPageSongs();
      await loadActiveSongs();
      setIsLoading(false);
    };

    fetchData();
  }, [loadCurrentPageSongs, loadActiveSongs]);

  /**
   * Reset pagination and apply search query.
   */
  const handleSearch = (data: SearchFormData) => {
    setFormData(data);
    setCurrentPage(1);
  };

  /**
   * Change current page index.
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  /**
   * Toggle song active state and refresh native menu.
   */
  const handleSongPress = async (id: number, currentStatus: boolean) => {
    try {
      const result = await window.api.updateSong(id, {
        active: !currentStatus,
      });

      if (!result?.error) {
        loadCurrentPageSongs();
        loadActiveSongs();
        window.api.refreshMenu();
      }
    } catch (error) {
      console.error('Error updating song status:', error);
    }
  };

  const headerActionsSlot = (
    <Button
      type="button"
      title="Avisos"
      onClick={() => navigate('/notes')}
      icon={<NotesIcon className="w-5 h-5" />}
    />
  );

  return (
    <main className="w-full flex mx-auto min-h-screen flex-col p-6 md:p-20 items-center">
      <Header actionSlot={headerActionsSlot}>Iglesia Bíblica Pan de Vida</Header>

      {!isEditing && (
        <ActiveSongs
          songs={activeSongs}
          showRemoveOption
          onChange={handleSongPress}
        />
      )}

      <SearchForm onSearch={handleSearch} />

      <SongsTable
        songs={songs}
        isLoading={isLoading}
        isEditing={isEditing}
        activeTab={activeTab}
        tabs={tabs}
        isSearching={!!formData?.searchText}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setCurrentPage(1);
        }}
        onEditPress={setIsEditing}
        onSongPress={handleSongPress}
      />

      <Pager
        visiblePages={5}
        currentPage={currentPage}
        totalPages={Math.ceil(totalCount / pageSize)}
        onPageChange={handlePageChange}
      />
    </main>
  );
}
