
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ExpenseProvider } from '@/context/ExpenseContext';
import { PakistanEconomyProvider } from '@/context/PakistanEconomyContext';
import Sidebar from './Sidebar';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <ExpenseProvider>
      <PakistanEconomyProvider>
        <div className="flex min-h-screen bg-gray-50">
          <Sidebar open={sidebarOpen} toggleSidebar={toggleSidebar} />
          <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
            <div className="container px-4 py-6 mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </PakistanEconomyProvider>
    </ExpenseProvider>
  );
};

export default Layout;
