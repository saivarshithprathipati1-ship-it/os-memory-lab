import { useEffect, useState } from 'react';
import { SimulationProvider } from './context/SimulationContext';
import { SchedulingProvider } from './context/SchedulingContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Simulator from './pages/Simulator';
import Algorithms from './pages/Algorithms';
import MemoryVisualization from './pages/MemoryVisualization';
import Performance from './pages/Performance';
import Learn from './pages/Learn';
import Scheduling from './pages/Scheduling';

const PAGES = {
  dashboard: Dashboard,
  simulator: Simulator,
  algorithms: Algorithms,
  memory: MemoryVisualization,
  performance: Performance,
  scheduling: Scheduling,
  learn: Learn,
};

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [theme, setTheme] = useState(() => {
    const t = document.documentElement.getAttribute('data-theme');
    if (t === 'light' || t === 'dark') return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const navigate = (id) => {
    setPage(id);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const CurrentPage = PAGES[page];

  return (
    <SimulationProvider>
      <SchedulingProvider>
      <div className="app-bg min-h-screen">
        <Header
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          onOpenMenu={() => setMenuOpen(true)}
        />
        <div className="flex">
          <Sidebar active={page} onNavigate={navigate} open={menuOpen} onClose={() => setMenuOpen(false)} />
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            <div key={page} className="mx-auto max-w-7xl animate-rise">
              <CurrentPage onNavigate={navigate} />
            </div>
          </main>
        </div>
      </div>
      </SchedulingProvider>
    </SimulationProvider>
  );
}
