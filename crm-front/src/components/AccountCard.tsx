import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Account } from '../models/journalEntries';
import { useAccountCardQuery } from '../store/api/journal';

interface AccountCardProps {
  account: Account;
  onClose: () => void;
}

export default function AccountCard({ account, onClose }: AccountCardProps) {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const [dateFrom, setDateFrom] = useState(firstDay.toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(today.toISOString().split('T')[0]);
  const {data, isFetching, refetch} = useAccountCardQuery({accountId: account.id, from: dateFrom, to: dateTo});
  
  const accountTypeLabel = {
    asset: 'Актив',
    liability: 'Пасив',
    equity: 'Капітал',
    revenue: 'Дохід',
    expense: 'Витрати',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Картка рахунку {account.code}
            </h2>
            <p className="text-gray-600 mt-1">
              {account.name} ({accountTypeLabel[account.type]})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Період з</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Період по</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={refetch}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Показати
            </button>
          </div>
        </div>

        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Сальдо на початок</p>
              <p className={`text-xl font-bold ${data && data.openingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data?.openingBalance.toFixed(2)} ₴
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="text-blue-600" size={16} />
                <p className="text-sm text-gray-600">Оборот Дт</p>
              </div>
              <p className="text-xl font-bold text-blue-600">{data?.totalDebit.toFixed(2)} ₴</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="text-orange-600" size={16} />
                <p className="text-sm text-gray-600">Оборот Кт</p>
              </div>
              <p className="text-xl font-bold text-orange-600">{data?.totalCredit.toFixed(2)} ₴</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Сальдо на кінець</p>
              <p className={`text-xl font-bold ${data && data.closingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data?.closingBalance.toFixed(2)} ₴
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {isFetching ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Дата</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Кореспондуючий рахунок
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Опис</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Документ</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Дебет</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Кредит</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Сальдо</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {!data || data.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                        Немає проводок за обраний період
                      </td>
                    </tr>
                  ) : (
                    data.transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                          {new Date(transaction.date).toLocaleDateString('uk-UA')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <div className="font-semibold text-gray-900">
                              {transaction.correspondent_account_code}
                            </div>
                            <div className="text-gray-600 text-xs">
                              {transaction.correspondent_account_name}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {transaction.description || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {transaction.document_number || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600">
                          {transaction.debit > 0 ? transaction.debit.toFixed(2) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-orange-600">
                          {transaction.credit > 0 ? transaction.credit.toFixed(2) : '-'}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm text-right font-bold ${
                            transaction.balance >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {transaction.balance.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {data && data.transactions.length > 0 && (
                  <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-sm font-bold text-gray-900">
                        Обороти за період:
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">
                        {data.totalDebit.toFixed(2)} ₴
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-orange-600">
                        {data.totalCredit.toFixed(2)} ₴
                      </td>
                      <td className="px-4 py-3"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
