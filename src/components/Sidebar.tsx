
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PieChart, BarChart, TrendingUp, Settings, Menu, X, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  open: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, toggleSidebar }) => {
  const navigationItems = [
    { name: 'Dashboard', path: '/', icon: <Home size={18} /> },
    { name: 'Expenses', path: '/expenses', icon: <Wallet size={18} /> },
    { name: 'Analytics', path: '/analytics', icon: <PieChart size={18} /> },
    { name: 'Insights', path: '/insights', icon: <TrendingUp size={18} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={18} /> },
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
        "fixed top-0 left-0 z-20 h-full w-64 bg-pakistan-green text-white transition-transform duration-300 ease-in-out",
        open ? "transform-none" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center justify-between p-4 border-b border-pakistan-lightGreen">
          <div className="flex items-center space-x-2">
            <Wallet size={28} />
            <h1 className="text-xl font-bold">Pak-Kharcha</h1>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="px-4 py-6 space-y-2">
          {navigationItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center px-4 py-3 rounded-md transition-colors",
                isActive 
                  ? "bg-pakistan-lightGreen text-white" 
                  : "text-white/80 hover:bg-pakistan-lightGreen/70"
              )}
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 text-xs text-center text-white/60">
          <p>Your Personal Expense Tracker</p>
          <p className="mt-1">©2025 Pak-Kharcha</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
