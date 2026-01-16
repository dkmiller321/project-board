import { AppProvider } from './context/AppContext';
import { TodoPanel } from './components/TodoPanel/TodoPanel';
import { KanbanBoard } from './components/KanbanBoard/KanbanBoard';
import { NotesArea } from './components/NotesArea/NotesArea';
import './App.css';

function App() {
  return (
    <AppProvider>
      <div className="app-layout">
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

export default App;
