import { lazy, Suspense } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Loader } from '@/components/common/Loader';
import { Navbar } from '@/components/layout/Navbar';
import { WatchlistProvider } from '@/store';

const HomePage = lazy(() => import('@/pages/HomePage'));
const MovieDetailsPage = lazy(() => import('@/pages/MovieDetailsPage'));
const PlayerPage = lazy(() => import('@/pages/PlayerPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function AppShell() {
  const location = useLocation();
  const isImmersive = location.pathname.startsWith('/watch');

  return (
    <div className="min-h-dvh bg-background text-content">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      {!isImmersive && <Navbar />}
      <Suspense fallback={<Loader fullscreen />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage />} />
            <Route path="/movie/:id" element={<MovieDetailsPage />} />
            <Route path="/watch/:id" element={<PlayerPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <WatchlistProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </WatchlistProvider>
    </MotionConfig>
  );
}
