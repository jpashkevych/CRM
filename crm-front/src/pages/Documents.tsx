import {useState } from "react";
import { Plus, Search, X, FileText, Receipt, CreditCard } from "lucide-react";
import type {
  DocumentInsert,
  Document,
  DocumentStatus,
} from "../models/documents";
import {
  useChangeDocumentStatusMutation,
  useCreateDocumentMutation,
  useGetDocumentsQuery,
  useUpdateDocumentMutation,
} from "../store/api/documents";
import CustomerSelect from "../components/CustomerSelect";
import OrderSelect from "../components/OrderSelect";
import Pagination from "../components/Pagination";

const documentTypes = {
  invoice: { label: "Рахунок", icon: FileText, color: "blue" },
  act: { label: "Акт", icon: Receipt, color: "purple" },
  payment: { label: "Платіж", icon: CreditCard, color: "green" },
};

const statusLabels = {
  draft: { label: "Чернетка", color: "gray" },
  issued: { label: "Виставлено", color: "blue" },
  paid: { label: "Оплачено", color: "green" },
  cancelled: { label: "Скасовано", color: "red" },
};

const limit = 6;
export default function Documents() {
  const [filter, setFilter] = useState<{
    page: number;
    searchQuery: string;
  }>({ page: 1, searchQuery: "" });

  const [searchValue, setSearchValue] = useState("");
  const { data, isFetching } = useGetDocumentsQuery({
    page: filter.page,
    limit,
    searchQuery: filter.searchQuery,
  });

  const [showModal, setShowModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [formData, setFormData] = useState<
    DocumentInsert & { customer_name?: string }
  >({
    type: "invoice",
    number: "",
    date: new Date().toISOString().split("T")[0],
    customer_id: "",
    amount: 0,
    status: "draft",
    notes: "",
  });

  const [createDocument] = useCreateDocumentMutation();
  const [updateDocument] = useUpdateDocumentMutation();
  const [changeDocumentStatus] = useChangeDocumentStatusMutation();


  const generateDocumentNumber = (type: string) => {
    const prefix = type === "invoice" ? "INV" : type === "act" ? "ACT" : "PAY";
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `${prefix}-${date}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDocument) {
      await updateDocument({ ...formData, id: editingDocument.id }).unwrap();
    } else {
      await createDocument(formData).unwrap();
    }

    setShowModal(false);
    setEditingDocument(null);
    setFormData({
      type: "invoice",
      number: "",
      date: new Date().toISOString().split("T")[0],
      customer_id: "",
      customer_name: undefined,
      order_id: undefined,
      amount: 0,
      status: "draft",
      notes: "",
    });
  };

  const handleEdit = (document: Document) => {
    setEditingDocument(document);
    setFormData({
      type: document.type,
      number: document.number,
      date: document.date,
      customer_id: document.customer_id,
      customer_name: document.customer_name,
      order_id: document.order_id,
      amount: Number(document.amount),
      status: document.status,
      notes: document.notes,
    });
    setShowModal(true);
  };

  const handleStatusChange = async (
    docId: string,
    newStatus: DocumentStatus,
  ) => {
    await changeDocumentStatus({ id: docId, status: newStatus }).unwrap();
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
        <h1 className="text-3xl font-bold text-gray-900">Документи</h1>
        <button
          onClick={() => {
            setEditingDocument(null);
            setFormData({
              type: "invoice",
              number: generateDocumentNumber("invoice"),
              date: new Date().toISOString().split("T")[0],
              customer_id: "",
              order_id: undefined,
              amount: 0,
              status: "draft",
              notes: "",
            });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Створити документ
        </button>
      </div>

      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Пошук документів..."
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
                  Номер
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Тип
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Клієнт
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Дата
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Сума
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Статус
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                  Дії
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {!data || data.data.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Немає документів
                  </td>
                </tr>
              ) : (
                data.data.map((doc) => {
                  const docType = documentTypes[doc.type];
                  const DocIcon = docType.icon;
                  const status = statusLabels[doc.status];

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {doc.number}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <DocIcon
                            size={18}
                            className={`text-${docType.color}-600`}
                          />
                          <span className="text-sm text-gray-900">
                            {docType.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {doc.customer_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(doc.date).toLocaleDateString("uk-UA")}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {Number(doc.amount).toFixed(2)} ₴
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={doc.status}
                          onChange={(e) =>
                            handleStatusChange(
                              doc.id,
                              e.target.value as DocumentStatus,
                            )
                          }
                          className={`px-3 py-1 text-sm rounded-full border-0 bg-${status.color}-100 text-${status.color}-700 focus:outline-none focus:ring-2 focus:ring-${status.color}-500`}
                        >
                          {Object.entries(statusLabels).map(([key, val]) => (
                            <option key={key} value={key}>
                              {val.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEdit(doc)}
                          className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          Редагувати
                        </button>
                      </td>
                    </tr>
                  );
                })
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
        />
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingDocument ? "Редагувати документ" : "Новий документ"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingDocument(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Тип документа
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const newType = e.target.value as
                        | "invoice"
                        | "act"
                        | "payment";
                      setFormData({
                        ...formData,
                        type: newType,
                        number: editingDocument
                          ? formData.number
                          : generateDocumentNumber(newType),
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(documentTypes).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Номер
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.number}
                    onChange={(e) =>
                      setFormData({ ...formData, number: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

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
                    Статус
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as
                          | "draft"
                          | "issued"
                          | "paid"
                          | "cancelled",
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(statusLabels).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Клієнт
                </label>
                <CustomerSelect
                  name={formData.customer_name}
                  setSelectedCustomer={(customer) =>
                    setFormData({
                      ...formData,
                      customer_id: customer.id,
                      customer_name: customer.name,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Замовлення (необов'язково)
                </label>
                <OrderSelect
                  order_id={formData.order_id}
                  setSelectedOrder={(order) =>
                    setFormData({ ...formData, order_id: order.id })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Сума (₴)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
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
                  Примітки
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingDocument ? "Зберегти зміни" : "Створити документ"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingDocument(null);
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
