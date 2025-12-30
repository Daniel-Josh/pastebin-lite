import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export default function App() {
  return (
    <div className="container">
      <header>
        <Link to="/"><h1>Pastebin Lite</h1></Link>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
