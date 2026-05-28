import { useState } from 'react';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import type { Customer } from '../models/customers';
import { useCreateCustomerMutation, useDeleteCustomerMutation, useGetCustomersQuery, useUpdateCustomerMutation } from '../store/api/customers';
import Pagination from '../components/Pagination';

const limit = 6;
export default function Customers() {
    const [filter, setFilter] = useState<{
        page: number;
        searchQuery: string;
      }>({ page: 1, searchQuery: "" });
      const [searchValue, setSearchValue] = useState("");
      const { data, isFetching } = useGetCustomersQuery({
        page: filter.page,
        limit,
        searchQuery: filter.searchQuery,
      });

       const [createCustomer] = useCreateCustomerMutation();
        const [updateCustomer] = useUpdateCustomerMutation();
        const [deleteCustomer] = useDeleteCustomerMutation();

  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<Omit<Customer, 'id' | 'created_at' | 'total_spent'>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });


  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
      if (editingCustomer) {
        await updateCustomer({
        id: editingCustomer.id,
        ...formData,
      }).unwrap();
      } else {
        await createCustomer(formData).unwrap();
      }

      setShowModal(false);
      setEditingCustomer(null);
      setFormData({ name: '', email: '', phone: '', address: '', notes: '' });
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      notes: customer.notes,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ви впевнені, що хочете видалити цього клієнта?')) return;
    await deleteCustomer(id).unwrap();
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Клієнти</h1>
        <button
          onClick={() => {
            setEditingCustomer(null);
            setFormData({ name: '', email: '', phone: '', address: '', notes: '' });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Додати клієнта
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Пошук клієнтів..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setFilter((prev) => ({
                ...prev,
                searchQuery: searchValue,
                page: 1,
              }));
            }
          }}
          onBlur={() => {
            setFilter((prev) => ({
              ...prev,
              searchQuery: searchValue,
              page: 1,
            }));
          }}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Ім'я</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Телефон</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Всього витрачено</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Дата реєстрації</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {!data || data.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Немає клієнтів
                  </td>
                </tr>
              ) : (
                data.data.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{customer.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{customer.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{customer.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {Number(customer.total_spent).toFixed(2)} ₴
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(customer.created_at).toLocaleDateString('uk-UA')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {data && data.pagination.totalPages > 1 && (
              <Pagination
                page={filter.page}
                totalPages={data.pagination.totalPages}
                totalItems={data.pagination.total}
                itemsOnPage={data.data.length}
                onPageChange={(page) => setFilter((prev) => ({ ...prev, page }))}
                type='customer'
              />
            )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingCustomer ? 'Редагувати клієнта' : 'Новий клієнт'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingCustomer(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ім'я <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Телефон</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Адреса</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Примітки</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingCustomer ? 'Зберегти зміни' : 'Додати клієнта'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCustomer(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Скасувати
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
