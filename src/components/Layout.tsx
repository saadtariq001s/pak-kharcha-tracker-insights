// src/components/Layout.tsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ExpenseProvider } from '@/context/ExpenseContext';
import { PakistanEconomyProvider } from '@/context/PakistanEconomyContext';
import { LanguageProvider } from '@/context/LanguageContext';
import Sidebar from './Sidebar';
import UserMenu from './UserMenu';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <ExpenseProvider>
      <PakistanEconomyProvider>
        <LanguageProvider>
          <div className="flex min-h-screen bg-gray-50">
            <Sidebar open={sidebarOpen} toggleSidebar={toggleSidebar} />
            <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
              {/* Top bar with user menu */}
              <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-end">
                <UserMenu />
              </div>
              
              <div className="container px-4 py-6 mx-auto">
                <Outlet />
              </div>
            </main>
          </div>
        </LanguageProvider>
      </PakistanEconomyProvider>
    </ExpenseProvider>
  );
};

export default Layout;