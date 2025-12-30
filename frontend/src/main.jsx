import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import CreatePaste from './pages/CreatePaste';
import ViewPaste from './pages/ViewPaste';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<CreatePaste />} />
        <Route path="p/:id" element={<ViewPaste />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
