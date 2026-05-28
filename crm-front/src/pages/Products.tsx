import { useState } from "react";
import { Plus, Edit2, Trash2, Search, X, Package } from "lucide-react";
import {
  useCreateProductMutation,
  useDeleteProductMutation,
  useGetProductsQuery,
  useUpdateProductMutation,
} from "../store/api/products";
import type { Product } from "../models/products";
import Pagination from "../components/Pagination";
const limit = 6;
export default function Products() {
  const [filter, setFilter] = useState<{
    page: number;
    searchQuery: string;
  }>({ page: 1, searchQuery: "" });
  const [searchValue, setSearchValue] = useState("");
  const { data, isFetching } = useGetProductsQuery({
    page: filter.page,
    limit,
    searchQuery: filter.searchQuery,
  });
  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Omit<Product, "id">>({
    name: "",
    description: "",
    price: 0,
    stock: 0,
    category: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      await updateProduct({
        id: editingProduct.id,
        ...formData,
      }).unwrap();
    } else {
      await createProduct(formData).unwrap();
    }
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      price: 0,
      stock: 0,
      category: "",
    });
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: Number(product.price),
      stock: product.stock,
      category: product.category,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Ви впевнені, що хочете видалити цей товар?")) return;
    await deleteProduct(id).unwrap();
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
        <h1 className="text-3xl font-bold text-gray-900">Товари</h1>
        <button
          onClick={() => {
            setEditingProduct(null);
            setFormData({
              name: "",
              description: "",
              price: 0,
              stock: 0,
              category: "",
            });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Додати товар
        </button>
      </div>

      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Пошук товарів..."
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!data || data.data.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
            <Package size={48} className="mb-4 text-gray-400" />
            <p>Немає товарів</p>
          </div>
        ) : (
          data.data.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              |
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {product.name}
                    </h3>
                    {product.category && (
                      <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                        {product.category}
                      </span>
                    )}
                  </div>
                </div>

                {product.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {product.description}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ціна:</span>
                    <span className="text-lg font-bold text-gray-900">
                      {Number(product.price).toFixed(2)} ₴
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">На складі:</span>
                    <span
                      className={`font-semibold ${
                        product.stock > 10
                          ? "text-green-600"
                          : product.stock > 0
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {product.stock} шт
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit2 size={16} />
                    Редагувати
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {data && data.pagination.totalPages > 1 && (
        <Pagination
          page={filter.page}
          totalPages={data.pagination.totalPages}
          totalItems={data.pagination.total}
          itemsOnPage={data.data.length}
          onPageChange={(page) => setFilter((prev) => ({ ...prev, page }))}
          type='product'
        />
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingProduct ? "Редагувати товар" : "Новий товар"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingProduct(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Назва <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Опис
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ціна (₴) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Кількість на складі <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Категорія
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingProduct ? "Зберегти зміни" : "Додати товар"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
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
