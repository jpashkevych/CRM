import { useState } from "react";
import { useGetProductsQuery } from "../store/api/products";
import type { Product } from "../models/products";
import { Trash2 } from "lucide-react";

export interface OrderItemForm {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  max: number
}

interface ProductsSelectProps {
  orderItems: OrderItemForm[];
  setOrderItems: React.Dispatch<React.SetStateAction<OrderItemForm[]>>;
}

export default function ProductsSelect({
  orderItems,
  setOrderItems,
}: ProductsSelectProps) {
  const [productSearchQuery, setProductSearchQuery] = useState<{
    [key: number]: string;
  }>({});
  const [productDropdownIndex, setProductDropdownIndex] = useState<number>(-1);
  const [searchQuery, setSearchQuery] = useState("");
  const { data } = useGetProductsQuery({
    page: 1,
    limit: 20,
    searchQuery,
  });

  let typingTimer: ReturnType<typeof setTimeout>;
  const searchOnChange = (query: string) => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(async () => {
      setSearchQuery(query);
    }, 500);
  };
  const getProducts = (data: Product[]) => {
    return data.filter(
      (item) => !orderItems.some((i) => item.id === i.product_id) && item.stock > 0
    );
  };
  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
    setProductSearchQuery((prev) => {
      const copy = { ...prev };
      delete copy[index];
      return copy;
    });
    setProductDropdownIndex(-1);
  };

  const selectProduct = (index: number, product: Product) => {
    const newItems = [...orderItems];
    newItems[index] = {
      ...newItems[index],
      product_id: product.id,
      product_name: product.name,
      price: product.price,
      max: product.stock,
    };
    setOrderItems(newItems);
  };
  const handleQuantityChange = (index: number, quantity: number) => {
    const newItems = [...orderItems];
    newItems[index] = { ...newItems[index], quantity: quantity };
    setOrderItems(newItems);
  };
  return (
    <div className="space-y-3">
      {orderItems.map((item, index) => {
        return (
          <div key={index} className="flex gap-3 items-start">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Пошук товару..."
                required
                value={
                  item.product_id != ""
                    ? `${item.product_name} (${Number(item.price).toFixed(
                        2
                      )} ₴)`
                    : productSearchQuery[index] || ""
                }
                onChange={(e) => {
                  setProductSearchQuery({
                    ...productSearchQuery,
                    [index]: e.target.value,
                  });
                  if (item.product_id === "") {
                    setProductDropdownIndex(index);
                    searchOnChange(e.target.value);
                  }
                }}
                onFocus={(e) => {
                  if (item.product_id === "") {
                    setProductDropdownIndex(index);
                    searchOnChange(e.target.value);
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {productDropdownIndex === index &&
                data &&
                data.data.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {getProducts(data.data).map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => {
                          selectProduct(index, product);
                          setProductDropdownIndex(-1);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-semibold text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {product.category && `${product.category} • `}
                          {Number(product.price).toFixed(2)} ₴ • К-сть:{" "}
                          {product.stock} шт
                        </div>
                      </button>
                    ))}
                  </div>
                )}
            </div>
            <input
              type="number"
              min="1"
              max={item.max.toString()}
              required
              value={item.quantity}
              onChange={(e) =>
                handleQuantityChange(index, parseInt(e.target.value))
              }
              className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Кількість"
            />
            <button
              type="button"
              onClick={() => handleRemoveItem(index)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={20} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
