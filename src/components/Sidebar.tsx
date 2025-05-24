// src/components/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  PieChart, 
  BarChart, 
  Brain, 
  Settings, 
  Menu, 
  X, 
  DollarSign,
  TrendingUp,
  Building2,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  open: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, toggleSidebar }) => {
  const navigationItems = [
    { 
      name: 'Dashboard', 
      path: '/', 
      icon: <Home size={18} />,
      description: 'Financial overview'
    },
    { 
      name: 'Transactions', 
      path: '/transactions', 
      icon: <DollarSign size={18} />,
      description: 'Income & expenses'
    },
    { 
      name: 'Analytics', 
      path: '/analytics', 
      icon: <PieChart size={18} />,
      description: 'Performance insights'
    },
    { 
      name: 'AI Insights', 
      path: '/insights', 
      icon: <Brain size={18} />,
      description: 'Smart recommendations',
      badge: 'AI'
    },
    { 
      name: 'Settings', 
      path: '/settings', 
      icon: <Settings size={18} />,
      description: 'Account & preferences'
    },
  ];

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {open && (
        <div 
          className="fixed inset-0 z-10 bg-gray-800 bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Mobile toggle button */}
      <div className="fixed z-50 p-3 bg-white rounded-full shadow-lg lg:hidden top-4 left-4">
        <button onClick={toggleSidebar} className="p-1 text-gray-700 focus:outline-none">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-20 h-full w-72 bg-gradient-to-b from-blue-600 to-blue-700 text-white transition-transform duration-300 ease-in-out shadow-2xl",
        open ? "transform-none" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-blue-500">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Building2 size={24} className="text-blue-100" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Elegnoia</h1>
              <p className="text-blue-200 text-sm">FinanceAI</p>
            </div>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-6 space-y-2">
          {navigationItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative",
                isActive 
                  ? "bg-blue-500 text-white shadow-lg" 
                  : "text-blue-100 hover:bg-blue-500/50 hover:text-white"
              )}
            >
              <div className="flex items-center space-x-3 flex-1">
                <div className="flex-shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium truncate">{item.name}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="bg-blue-400 text-blue-900 text-xs px-2 py-0.5">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs opacity-75 truncate">{item.description}</p>
                </div>
              </div>
            </NavLink>
          ))}
        </nav>

        {/* Quick Stats */}
        <div className="mx-4 mb-6 p-4 bg-blue-800/30 rounded-xl border border-blue-500/30">
          <h3 className="text-sm font-semibold text-blue-200 mb-3 flex items-center gap-2">
            <Zap size={14} />
            Quick Stats
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-blue-300">This Month</span>
              <span className="text-white font-medium">+$45.2K</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-300">Profit Margin</span>
              <span className="text-green-400 font-medium">18.5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-300">Growth</span>
              <span className="text-green-400 font-medium flex items-center gap-1">
                <TrendingUp size={10} />
                +12.3%
              </span>
            </div>
          </div>
        </div>

        {/* Company Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-500">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-300 rounded-lg flex items-center justify-center">
                <Building2 size={16} className="text-blue-900" />
              </div>
              <span className="font-semibold">elegnoia.com</span>
            </div>
            <p className="text-xs text-blue-200">
              Smart Financial Management
            </p>
            <p className="text-xs text-blue-300 mt-1">
              ©2025 Elegnoia Technology
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;