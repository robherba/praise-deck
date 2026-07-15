import './assets/css/main.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';

// Layout architecture.
import RootLayout from './components/layout/root'; 

// Application views.
import ImportForm from './pages/import-form';
import SongForm from './pages/song-form';
import Home from './pages/song-list';
import Notes from './pages/notes';
import Song from './pages/song';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
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
