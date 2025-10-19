import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MyTeam from './components/MyTeam';
import Fixtures from './components/Fixtures';
import AIAssistant from './components/AIAssistant';

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gray-50">
        {/* Fixed Sidebar */}
        <Sidebar />
        
        {/* Main Content with left margin to account for fixed sidebar */}
        <main className="flex-1 ml-64">
          <Routes>
            <Route path="/" element={<Navigate to="/my-team" replace />} />
            <Route path="/my-team" element={<MyTeam />} />
            <Route path="/fixtures" element={<Fixtures />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;