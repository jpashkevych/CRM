import type { Customer } from "../models/customers";
import { useGetCustomersQuery } from "../store/api/customers";
import { useEffect, useState } from "react";

interface CustomerSelectProps {
  setSelectedCustomer: (customer: Customer) => void;
  name?: string, 
}

export default function CustomerSelect({
  name, 
  setSelectedCustomer,
}: CustomerSelectProps) {
  const [searchValue, setSearchValue] = useState(name || "");
  const [searchQuery, setSearchQuery] = useState("");
  const { data } = useGetCustomersQuery({
    page: 1,
    limit: 20,
    searchQuery,
  });
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  let typingTimer: ReturnType<typeof setTimeout>;
  useEffect(()=>{
    setSearchValue(name || "");
  },[name])

  const searchOnChange = (e: React.FormEvent<HTMLInputElement>) => {
    const query = e.currentTarget.value;
    setSearchValue(query);
    setShowCustomerDropdown(true);
    clearTimeout(typingTimer);
    typingTimer = setTimeout(async () => {
      setSearchQuery(query);
    }, 500);
  }
  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Пошук клієнта по імені або email..."
        value={searchValue}
        onChange={searchOnChange}
        onFocus={() => setShowCustomerDropdown(true)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {showCustomerDropdown && data && data.data.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
          {data.data.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => {
                setSelectedCustomer(customer);
                setSearchValue(customer.name);
                setShowCustomerDropdown(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="font-semibold text-gray-900">{customer.name}</div>
              <div className="text-xs text-gray-600">{customer.email}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
