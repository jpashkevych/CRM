import { useEffect, useState } from "react";
import { Plus, Search, X, BookOpen } from "lucide-react";
import type {
  Account,
  CreateJournalEntryDto,
} from "../models/journalEntries";
import { useGetDocumentsQuery } from "../store/api/documents";
import { useCreateJournalEntryMutation, useGetAccountsQuery, useGetJournalQuery, useTrialBalanceQuery } from "../store/api/journal";
import DocumentSelect from "../components/DocumentSelect";
import Pagination from "../components/Pagination";
import AccountCard from "../components/AccountCard";

const limit = 6;
export default function Accounting() {
  const [filter, setFilter] = useState<{
    page: number;
    searchQuery: string;
  }>({ page: 1, searchQuery: "" });
  const { data: entries, isFetching } = useGetJournalQuery({
    page: filter.page,
    limit,
    searchQuery: filter.searchQuery,
  });
  const { data: accounts } = useGetAccountsQuery();

  const [searchValue, setSearchValue] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showBalances, setShowBalances] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState<
    CreateJournalEntryDto & {
      document_number?: string;
      document_amount?: number;
    }
  >({
    date: new Date().toISOString().split("T")[0],
    document_id: null,
    debit_account_id: "",
    credit_account_id: "",
    amount: 0,
    description: "",
  });
  const [createEntries] = useCreateJournalEntryMutation();
  const {data: balances} = useTrialBalanceQuery({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createEntries({ ...formData }).unwrap();
    setShowModal(false);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      document_id: null,
      debit_account_id: "",
      credit_account_id: "",
      amount: 0,
      description: "",
    });
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
          <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
            <BookOpen size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Журнал проводок
            </h1>
            <p className="text-gray-600">Бухгалтерський облік (Дт/Кт)</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBalances(!showBalances)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {showBalances ? "Сховати баланси" : "Показати баланси"}
          </button>
          <button
            onClick={() => {
              setFormData({
                date: new Date().toISOString().split("T")[0],
                document_id: null,
                debit_account_id: "",
                credit_account_id: "",
                amount: 0,
                description: "",
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus size={20} />
            Нова проводка
          </button>
        </div>
      </div>

      {showBalances && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Оборотно-сальдова відомість
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Рахунок
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Назва
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    Дебет
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    Кредит
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    Сальдо
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {balances && balances.data
                  .filter((b) => b.debit > 0 || b.credit > 0)
                  .map((balance) => (
                    <tr
                      key={balance.account.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedAccount(balance.account)}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-blue-600 hover:text-blue-800">
                        {balance.account.code}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {balance.account.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {balance.debit.toFixed(2)} ₴
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {balance.credit.toFixed(2)} ₴
                      </td>
                      <td
                        className={`px-4 py-3 text-sm text-right font-semibold ${
                          balance.balance >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {balance.balance.toFixed(2)} ₴
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-3 text-sm font-bold text-gray-900"
                  >
                    Всього:
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                    {balances && balances.data.reduce((sum, b) => sum + b.debit, 0).toFixed(2)} ₴
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                    {balances && balances.data.reduce((sum, b) => sum + b.credit, 0).toFixed(2)}{" "}
                    ₴
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Пошук проводок..."
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
                  Дебет
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Кредит
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                  Сума
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Опис
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Документ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {!entries || entries.data.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Немає проводок
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
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-semibold text-gray-900">
                          {entry.debit_account_code}
                        </div>
                        <div className="text-gray-600">
                          {entry.debit_account_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-semibold text-gray-900">
                          {entry.credit_account_code}
                        </div>
                        <div className="text-gray-600">
                          {entry.credit_account_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                      {Number(entry.amount).toFixed(2)} ₴
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {entry.description || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {entry.document_number || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {entries && entries.pages > 1 && (
              <Pagination
                page={filter.page}
                totalPages={entries.pages}
                totalItems={entries.total}
                itemsOnPage={entries.data.length}
                onPageChange={(page) => setFilter((prev) => ({ ...prev, page }))}
              />
            )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Нова проводка
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дебет (Дт)
                </label>
                <select
                  required
                  value={formData.debit_account_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      debit_account_id: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Оберіть рахунок</option>
                  {accounts &&
                    accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Кредит (Кт)
                </label>
                <select
                  required
                  value={formData.credit_account_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      credit_account_id: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Оберіть рахунок</option>
                  {accounts &&
                    accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Сума (₴)
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Документ (необов'язково)
                </label>
                <DocumentSelect
                  setSelectedDocument={(doc) =>
                    setFormData({
                      ...formData,
                      document_id: doc.id,
                      document_number: doc.number,
                      document_amount: doc.amount,
                    })
                  }
                  document_amount={formData.amount}
                  document_number={formData.document_number}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Опис господарської операції"
                />
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-900 font-medium mb-2">
                  Проводка:
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-700">
                    Дт{" "}
                    {accounts?.find((a) => a.id === formData.debit_account_id)
                      ?.code || "___"}
                  </span>
                  <span className="text-purple-700">
                    Кт{" "}
                    {accounts?.find((a) => a.id === formData.credit_account_id)
                      ?.code || "___"}
                  </span>
                  <span className="font-bold text-purple-900">
                    {formData.amount > 0
                      ? `${formData.amount.toFixed(2)} ₴`
                      : "___"}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Створити проводку
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

      {selectedAccount && (
        <AccountCard
          account={selectedAccount}
          onClose={() => setSelectedAccount(null)}
        />
      )}
    </div>
  );
}
