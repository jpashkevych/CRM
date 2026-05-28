import { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import {
  useCreateOrderMutation,
  useDeleteOrderMutation,
  useGetOrdersQuery,
  useUpdateOrderMutation,
} from "../store/api/orders";
import CustomerSelect from "../components/CustomerSelect";
import type { Customer } from "../models/customers";
import ProductsSelect, {
  type OrderItemForm,
} from "../components/ProductsSelect";
import type { OrderItem } from "../models/orders";
import Pagination from "../components/Pagination";

const limit = 6;
export default function Orders() {
  const [filter, setFilter] = useState<{
    page: number;
    searchQuery: string;
  }>({ page: 1, searchQuery: "" });
  const [searchValue, setSearchValue] = useState("");
  const { data, isFetching } = useGetOrdersQuery({
    page: filter.page,
    limit,
    searchQuery: filter.searchQuery,
  });

  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>();
  const [orderItems, setOrderItems] = useState<OrderItemForm[]>([]);
  const [orderNotes, setOrderNotes] = useState("");

  const [createOrder] = useCreateOrderMutation();
  const [updateOrder] = useUpdateOrderMutation();
  const [deleteOrder] = useDeleteOrderMutation();

  const handleAddItem = () => {
    setOrderItems([
      ...orderItems,
      { product_id: "", product_name: "", quantity: 1, price: 0, max: 1 },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedCustomer ||
      orderItems.length === 0 ||
      orderItems.some((i) => i.product_id === "")
    )
      return;
    const itemsToInsert = orderItems.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
    }));
    await createOrder({
      customer_id: selectedCustomer.id,
      notes: orderNotes,
      items: itemsToInsert,
    }).unwrap();
    setShowModal(false);
    setSelectedCustomer(undefined);
    setOrderItems([]);
    setOrderNotes("");
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    await updateOrder({ id: orderId, status: newStatus }).unwrap;
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
        <h1 className="text-3xl font-bold text-gray-900">Замовлення</h1>
        <button
          onClick={() => {
            setSelectedCustomer(undefined);
            setOrderItems([]);
            setOrderNotes("");
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Нове замовлення
        </button>
      </div>

      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Пошук замовлень..."
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

      <div className="space-y-4">
        {!data || data.data.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
            Немає замовлень
          </div>
        ) : (
          data.data.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {order.customer_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString("uk-UA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={order.status}
                      disabled={
                        order.status === "cancelled" ||
                        order.status === "completed"
                      }
                      onChange={(e) =>
                        handleStatusChange(order.id, e.target.value)
                      }
                      className={`px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        order.status === "completed"
                          ? "bg-green-50 text-green-700"
                          : order.status === "pending"
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      <option value="pending">В обробці</option>
                      <option value="completed">Виконано</option>
                      <option value="cancelled">Скасовано</option>
                    </select>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {Number(order.total_amount).toFixed(2)} ₴
                      </p>
                    </div>
                  </div>
                </div>

                {order.notes && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Примітки:</span>{" "}
                      {order.notes}
                    </p>
                  </div>
                )}

                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Товари:
                  </h4>
                  <div className="space-y-2">
                    {order.items &&
                      order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-900">
                            {item.product_name} × {item.quantity}
                          </span>
                          <span className="font-semibold text-gray-900">
                            {item.subtotal.toFixed(2)} ₴
                          </span>
                        </div>
                      ))}
                  </div>
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
          type='order'
        />
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Нове замовлення
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Клієнт <span className="text-red-500">*</span>
                </label>
                <CustomerSelect setSelectedCustomer={setSelectedCustomer} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Товари <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={16} />
                    Додати товар
                  </button>
                </div>

                <ProductsSelect
                  orderItems={orderItems}
                  setOrderItems={setOrderItems}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Примітки
                </label>
                <textarea
                  rows={3}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {orderItems.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Загальна сума:</span>
                    <span>
                      {orderItems
                        .reduce(
                          (sum, item) =>
                            sum + Number(item.price) * Number(item.quantity),
                          0
                        )
                        .toFixed(2)}{" "}
                      ₴
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={
                    !selectedCustomer ||
                    orderItems.length === 0 ||
                    orderItems.some((i) => i.product_id === "")
                  }
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Створити замовлення
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
