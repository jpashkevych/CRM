import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  X,
  Wallet,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useGetAccountsQuery } from "../store/api/journal";
import {
  useCashBankBalanceQuery,
  useCreateCashBankJournalMutation,
  useGetCashBankJournalQuery,
} from "../store/api/cashBankJournal";

const CURRENCIES = ["UAH", "USD", "EUR", "GBP", "JPY"];

const limit = 6;
export default function CashBank() {
  const [filter, setFilter] = useState<{
    page: number;
    searchQuery: string;
  }>({ page: 1, searchQuery: "" });
  const [filterType, setFilterType] = useState<"all" | "receipt" | "payment">(
    "all",
  );
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "completed" | "cancelled"
  >("all");
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  const [dateFrom, setDateFrom] = useState(
    firstDay.toISOString().split("T")[0],
  );
  const [dateTo, setDateTo] = useState(today.toISOString().split("T")[0]);
  const [searchValue, setSearchValue] = useState("");
  const { data: accounts } = useGetAccountsQuery();
  const { data: entries, isFetching } = useGetCashBankJournalQuery({
    page: filter.page,
    limit,
    searchQuery: filter.searchQuery,
    from: dateFrom,
    to: dateTo,
    type: filterType,
    status: filterStatus,
  });
  const [showModal, setShowModal] = useState(false);

  const { data: balance } = useCashBankBalanceQuery({
    from: dateFrom,
    to: dateTo,
  });
  const [createCashBankJournal] = useCreateCashBankJournalMutation();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    transaction_type: "receipt" as "receipt" | "payment",
    cash_account_id: "",
    bank_account_id: "",
    counterparty: "",
    description: "",
    amount: 0,
    currency: "UAH",
    status: "completed" as "pending" | "completed" | "cancelled",
    document_number: "",
    notes: "",
  });

  useEffect(() => {
    if (!accounts) return;
    const cashAccount = accounts.find((a) => a.code === "30");
    const bankAccount = accounts.find((a) => a.code === "31");

    if (cashAccount && bankAccount) {
      setFormData((prev) => ({
        ...prev,
        cash_account_id: cashAccount.id,
        bank_account_id: bankAccount.id,
      }));
    }
  }, [accounts]);

  const getAccountCode = (id?: string | null) => {
    if (!accounts || !id) return undefined;
    return accounts.find((ac) => ac.id === id)?.code;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const entryData = {
      ...formData,
      amount: Number(formData.amount),
      cash_account_id:
        formData.transaction_type === "receipt" ||
        formData.transaction_type === "payment"
          ? formData.cash_account_id || null
          : null,
      bank_account_id:
        formData.transaction_type === "receipt" ||
        formData.transaction_type === "payment"
          ? formData.bank_account_id || null
          : null,
    };

    if (!entryData.cash_account_id && !entryData.bank_account_id) {
      alert("Оберіть хоча б один рахунок (касса або банк)");
      return;
    }
    await createCashBankJournal(entryData).unwrap();
      setShowModal(false);
      setFormData({
        date: new Date().toISOString().split("T")[0],
        transaction_type: "receipt",
        cash_account_id: formData.cash_account_id,
        bank_account_id: formData.bank_account_id,
        counterparty: "",
        description: "",
        amount: 0,
        currency: "UAH",
        status: "completed",
        document_number: "",
        notes: "",
      });
  };

  const transactionTypeLabel = {
    receipt: "Надходження",
    payment: "Видаток",
  };

  const statusLabel = {
    pending: "Очікується",
    completed: "Завершена",
    cancelled: "Скасована",
  };

  const statusColor = {
    pending: "text-yellow-600 bg-yellow-50",
    completed: "text-green-600 bg-green-50",
    cancelled: "text-red-600 bg-red-50",
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
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
            <Wallet size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Касса/Банк</h1>
            <p className="text-gray-600">Журнал руху коштів</p>
          </div>
        </div>
        <button
          onClick={() => {
            setFormData({
              date: new Date().toISOString().split("T")[0],
              transaction_type: "receipt",
              cash_account_id: formData.cash_account_id,
              bank_account_id: formData.bank_account_id,
              counterparty: "",
              description: "",
              amount: 0,
              currency: "UAH",
              status: "completed",
              document_number: "",
              notes: "",
            });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Нова операція
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Каса</p>
            <TrendingUp size={20} className="text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {balance?.cash.toFixed(2)} ₴
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Банк</p>
            <TrendingDown size={20} className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {balance?.bank.toFixed(2)} ₴
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Всього коштів</p>
            <Wallet size={20} className="text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {balance?.total.toFixed(2)} ₴
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Період з
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Період по
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Тип операції
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Всі операції</option>
              <option value="receipt">Надходження</option>
              <option value="payment">Видатки</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Статус
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Всі статуси</option>
              <option value="pending">Очікується</option>
              <option value="completed">Завершена</option>
              <option value="cancelled">Скасована</option>
            </select>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Пошук по контрагенту, опису або документу..."
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Дата
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Тип
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Рахунок
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Контрагент
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Опис
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Документ
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                  Сума
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Статус
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {!entries || entries.data.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Немає операцій за обраний період
                  </td>
                </tr>
              ) : (
                entries.data.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(entry.date).toLocaleDateString("uk-UA")}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          entry.transaction_type === "receipt"
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {transactionTypeLabel[entry.transaction_type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-gray-900">
                        {entry.cash_account_id
                          ? getAccountCode(entry.cash_account_id) || "30"
                          : getAccountCode(entry.bank_account_id) || "31"}
                      </div>
                      <div className="text-gray-600 text-xs">
                        {entry.cash_account_id ? "Каса" : "Банк"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {entry.counterparty}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {entry.description || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {entry.document_number || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                      {Number(entry.amount).toFixed(2)} {entry.currency}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          statusColor[entry.status]
                        }`}
                      >
                        {statusLabel[entry.status]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Нова операція касси/банку
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дата
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Тип операції
                  </label>
                  <select
                    required
                    value={formData.transaction_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        transaction_type: e.target.value as
                          | "receipt"
                          | "payment",
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="receipt">Надходження</option>
                    <option value="payment">Видаток</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Касса
                  </label>
                  <input
                    type="checkbox"
                    checked={!!formData.cash_account_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cash_account_id: e.target.checked && accounts
                          ? formData.cash_account_id || ""
                          : "",
                      })
                    }
                    className="h-4 w-4 text-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Банк
                  </label>
                  <input
                    type="checkbox"
                    checked={!!formData.bank_account_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bank_account_id: e.target.checked && accounts
                          ? formData.bank_account_id || ""
                          : "",
                      })
                    }
                    className="h-4 w-4 text-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Контрагент <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.counterparty}
                  onChange={(e) =>
                    setFormData({ ...formData, counterparty: e.target.value })
                  }
                  placeholder="ФІ контрагента або назва компанії"
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
                  placeholder="Опис операції"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Сума <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Валюта
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) =>
                      setFormData({ ...formData, currency: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CURRENCIES.map((curr) => (
                      <option key={curr} value={curr}>
                        {curr}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Статус
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as
                          | "pending"
                          | "completed"
                          | "cancelled",
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="completed">Завершена</option>
                    <option value="pending">Очікується</option>
                    <option value="cancelled">Скасована</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Номер документа
                  </label>
                  <input
                    type="text"
                    value={formData.document_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        document_number: e.target.value,
                      })
                    }
                    placeholder="Номер рахунку/накладної"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Примітка
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Додаткова інформація"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Створити операцію
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
