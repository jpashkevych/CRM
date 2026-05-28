import type { Order } from "../models/orders";
import { useGetOrdersQuery } from "../store/api/orders";
import { useEffect, useState } from "react";

interface OrderSelectProps {
  setSelectedOrder: (order: Order) => void;
  order_id?: string;
}

export default function OrderSelect({
  setSelectedOrder,
  order_id,
}: OrderSelectProps) {
  const [searchValue, setSearchValue] = useState(
    order_id ? `Замовлення #${order_id.slice(0, 8)}` : "",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const { data } = useGetOrdersQuery({
    page: 1,
    limit: 20,
    searchQuery,
  });
  const [showOrderDropdown, setShowOrderDropdown] = useState(false);
  let typingTimer: ReturnType<typeof setTimeout>;

  const searchOnChange = (e: React.FormEvent<HTMLInputElement>) => {
    const query = e.currentTarget.value;
    setSearchValue(query);
    setShowOrderDropdown(true);
    clearTimeout(typingTimer);
    typingTimer = setTimeout(async () => {
      setSearchQuery(query);
    }, 500);
  };
  useEffect(() => {
    setSearchValue(order_id ? `Замовлення #${order_id.slice(0, 8)}` : "");
  }, [order_id]);
  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Пошук замовлення..."
        value={searchValue}
        onChange={searchOnChange}
        onFocus={() => setShowOrderDropdown(true)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {showOrderDropdown && data && data.data.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
          {data.data.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => {
                setSelectedOrder(order);
                setSearchValue(`Замовлення #${order.id.slice(0, 8)}`);
                setShowOrderDropdown(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="font-semibold text-gray-900">
                Замовлення #{order.id.slice(0, 8)}
              </div>
              <div className="text-xs text-gray-600">
                {order.customer_name} {Number(order.total_amount).toFixed(2)} ₴
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
