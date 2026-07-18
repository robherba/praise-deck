import './assets/css/main.css';

import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';

import RootLayout from './components/layout/root'; 
import ImportForm from './pages/import-form';
import SongForm from './pages/song-form';
import Home from './pages/song-list';
import Notes from './pages/notes';
import Song from './pages/song';

function ElectronRouter() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!window.api?.onNavigate) return;

    const unsubscribe = window.api.onNavigate((data: { route: string; payload?: any }) => {
      if (!data?.route) return;
      
      const targetRoute = data.route.startsWith('/') ? data.route : `/${data.route}`;
      navigate(targetRoute, { state: data.payload });
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [navigate]);

  return null;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <ElectronRouter />
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/song" element={<Song />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/import" element={<ImportForm />} />
          <Route path="/song-form" element={<SongForm />} />
        </Route>
      </Routes>
    </HashRouter>
  </StrictMode>
);
