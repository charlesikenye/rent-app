import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Receipt, 
  Bell, 
  Upload, 
  HelpCircle,
  Building
} from 'lucide-react';
import type { Page } from '../App';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tenants', label: 'Tenants', icon: Users },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'receipts', label: 'Receipts', icon: Receipt },
  { id: 'reminders', label: 'Reminders', icon: Bell },
  { id: 'documents', label: 'Documents', icon: Upload },
  { id: 'help', label: 'Help', icon: HelpCircle },
];

export function Sidebar({ currentPage, setCurrentPage, isOpen, setIsOpen }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-4 border-b border-gray-200">
            <Building className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">PropertyPro</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentPage(item.id as Page);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              © 2025 PropertyPro
            </div>
          </div>
        </div>
      </div>
    </>
  );
}