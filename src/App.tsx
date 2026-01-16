import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { Auth } from './components/Auth/Auth';
import { TodoPanel } from './components/TodoPanel/TodoPanel';
import { KanbanBoard } from './components/KanbanBoard/KanbanBoard';
import { NotesArea } from './components/NotesArea/NotesArea';
import './App.css';

function AppContent() {
  const { user, loading, signOut } = useAuth();

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

  return (
    <AppProvider>
      <div className="app-layout">
        <header className="app-header">
          <span className="user-email">{user.email}</span>
          <button onClick={signOut} className="logout-button">
            Sign Out
          </button>
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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
