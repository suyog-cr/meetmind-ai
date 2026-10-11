import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ToastContainer from '../components/ToastContainer';
import { useState } from 'react';

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="mt-16 py-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-400">
          MeetMind AI &mdash; Turn meetings into clear actions.
        </div>
      </footer>
    </div>
  );
}
