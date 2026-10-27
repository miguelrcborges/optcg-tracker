import { HashRouter, Route, Routes } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/Layout';
import { ScrollToTop } from './components/ScrollToTop';
import { TournamentsPage } from './pages/TournamentsPage';
import { TournamentFormPage } from './pages/TournamentFormPage';
import { TournamentPage } from './pages/TournamentPage';
import { MatchFormPage } from './pages/MatchFormPage';
import { StatsPage } from './pages/StatsPage';
import { DataPage } from './pages/DataPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <DataProvider>
          <ScrollToTop />
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<TournamentsPage />} />
              <Route path="tournaments/new" element={<TournamentFormPage />} />
              <Route path="tournaments/:id" element={<TournamentPage />} />
              <Route
                path="tournaments/:id/edit"
                element={<TournamentFormPage />}
              />
              <Route
                path="tournaments/:id/matches/new"
                element={<MatchFormPage />}
              />
              <Route
                path="tournaments/:id/matches/:matchId/edit"
                element={<MatchFormPage />}
              />
              <Route path="stats" element={<StatsPage />} />
              <Route path="data" element={<DataPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </DataProvider>
      </ToastProvider>
    </HashRouter>
  );
}
