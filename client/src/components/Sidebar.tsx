import { Link, useLocation } from 'react-router-dom';
import { Users, Calendar, Sparkles } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  const menuItems = [
    { path: '/my-team', icon: Users, label: 'My Team' },
    { path: '/fixtures', icon: Calendar, label: 'Fixtures' },
    { path: '/ai-assistant', icon: Sparkles, label: 'AI Assistant' }
  ];

  return (
    <aside className="w-64 bg-gradient-to-b from-purple-600 to-purple-700 h-screen text-white flex flex-col fixed left-0 top-0">
      {/* Header */}
      <div className="p-6 border-b border-purple-500">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold">FPL AI</h1>
            <p className="text-sm text-purple-200">Assistant</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${active 
                      ? 'bg-white/20 text-white shadow-lg' 
                      : 'text-purple-200 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Current Gameweek */}
      <div className="p-6 border-t border-purple-500">
        <p className="text-sm text-purple-200 mb-1">Current Gameweek</p>
        <p className="text-4xl font-bold">7</p>
      </div>
    </aside>
  );
};

export default Sidebar;