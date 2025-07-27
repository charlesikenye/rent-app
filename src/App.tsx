import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TenantsPage } from './components/TenantsPage';
import { PaymentsPage } from './components/PaymentsPage';
import { ReceiptsPage } from './components/ReceiptsPage';
import { RemindersPage } from './components/RemindersPage';
import { DocumentsPage } from './components/DocumentsPage';
import { HelpPage } from './components/HelpPage';
import { PaymentsProvider } from './components/PaymentsContext';

export type Page = 'dashboard' | 'tenants' | 'payments' | 'receipts' | 'reminders' | 'documents' | 'help';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'tenants':
        return <TenantsPage />;
      case 'payments':
        return <PaymentsPage />;
      case 'receipts':
        return <ReceiptsPage />;
      case 'reminders':
        return <RemindersPage />;
      case 'documents':
        return <DocumentsPage />;
      case 'help':
        return <HelpPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <PaymentsProvider>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />
        
        <div className="flex-1 flex flex-col lg:ml-64">
          <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-4 lg:px-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900 capitalize">
                {currentPage === 'dashboard' ? 'Dashboard' : currentPage}
              </h1>
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">JD</span>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-6">
            {renderPage()}
          </main>
        </div>
      </div>
    </PaymentsProvider>
  );
}

export default App;
