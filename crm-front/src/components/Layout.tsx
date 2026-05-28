import { useState } from 'react';
import { LayoutDashboard, Users, Package, ShoppingCart, MessageSquare, Menu, X, FileText, BookOpen, Wallet } from 'lucide-react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useActiveRoute } from '../hooks/useActiveRoute';
export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();

  const { isActive } = useActiveRoute();
  const menuItems = [
    { id: '', label: 'Панель управління', icon: LayoutDashboard },
    { id: 'customers', label: 'Клієнти', icon: Users },
    { id: 'products', label: 'Товари', icon: Package },
    { id: 'orders', label: 'Замовлення', icon: ShoppingCart },
    { id: 'documents', label: 'Документи', icon: FileText },
    { id: 'accounting', label: 'Бухгалтерія', icon: BookOpen },
    { id: 'cashbank', label: 'Касса/Банк', icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">CRM Магазин</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">CRM Магазин</h1>
          <p className={`text-sm text-gray-500 mt-${sidebarOpen ? '4' : '1'}`}>Система управління</p>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.id)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={() => {
              navigate('assistant');
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive('assistant')
                ? 'bg-green-50 text-green-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <MessageSquare size={20} />
            <span className="font-medium">AI Асистент</span>
          </button>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="lg:ml-64 pt-20 lg:pt-0">
        <main className="p-6">
            <Outlet/>
        </main>
      </div>
    </div>
  );
}
