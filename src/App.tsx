import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { SubscriptionProvider, useSubscription } from './context/SubscriptionContext';
import { Auth } from './components/Auth/Auth';
import { TodoPanel } from './components/TodoPanel/TodoPanel';
import { KanbanBoard } from './components/KanbanBoard/KanbanBoard';
import { NotesArea } from './components/NotesArea/NotesArea';
import { Pricing } from './components/Pricing/Pricing';
import { Settings } from './components/Settings/Settings';
import { UsageIndicator } from './components/UsageIndicator/UsageIndicator';
import './App.css';

type Page = 'dashboard' | 'pricing' | 'settings';

// This component is only rendered inside SubscriptionProvider
function AuthenticatedApp() {
  const { user } = useAuth();
  const { loading: subscriptionLoading } = useSubscription();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Handle URL parameters for success/cancel states
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setCurrentPage('settings');
      setShowSuccessMessage(true);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('canceled') === 'true') {
      setCurrentPage('pricing');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  if (subscriptionLoading) {
    return (
      <div className="loading-container">
        <p>Loading...</p>
      </div>
    );
  }

  if (currentPage === 'pricing') {
    return <Pricing onBack={() => setCurrentPage('dashboard')} />;
  }

  if (currentPage === 'settings') {
    return (
      <Settings
        onBack={() => {
          setCurrentPage('dashboard');
          setShowSuccessMessage(false);
        }}
        onNavigatePricing={() => setCurrentPage('pricing')}
        showSuccessMessage={showSuccessMessage}
      />
    );
  }

  return (
    <AppProvider>
      <div className="app-layout">
        <header className="app-header">
          <div className="header-left">
            <UsageIndicator onUpgradeClick={() => setCurrentPage('pricing')} />
          </div>
          <div className="header-right">
            <span className="user-email">{user?.email}</span>
            <button
              onClick={() => setCurrentPage('settings')}
              className="settings-button"
            >
              Settings
            </button>
          </div>
        </header>
        <aside className="panel-left">
          <TodoPanel />
        </aside>
        <main className="main-content">
          <KanbanBoard />
        </main>
        <aside className="panel-right">
          <NotesArea />
        </aside>
      </div>
    </AppProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  // Only wrap in SubscriptionProvider when user is authenticated
  return (
    <SubscriptionProvider>
      <AuthenticatedApp />
    </SubscriptionProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
