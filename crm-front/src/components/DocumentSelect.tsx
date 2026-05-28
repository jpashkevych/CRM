import type { Document } from "../models/documents";
import { useGetDocumentsQuery } from "../store/api/documents";
import { useEffect, useState } from "react";

interface DocumentSelectProps {
  setSelectedDocument: (document: Document) => void;
  document_number?: string, 
  document_amount?: number,
}

export default function DocumentSelect({
  setSelectedDocument,
  document_number, 
  document_amount
}: DocumentSelectProps) {
  const [searchValue, setSearchValue] = useState(
    document_number ? `${document_number} - ${Number(document_amount).toFixed(2)} ₴` : ''
  );
  const [searchQuery, setSearchQuery] = useState("");
  const { data } = useGetDocumentsQuery({
    page: 1,
    limit: 20,
    searchQuery,
  });
  const [showDocumentDropdown, setShowDocumentDropdown] = useState(false);
  let typingTimer: ReturnType<typeof setTimeout>;

  const searchOnChange = (e: React.FormEvent<HTMLInputElement>) => {
    const query = e.currentTarget.value;
    setSearchValue(query);
    setShowDocumentDropdown(true);
    clearTimeout(typingTimer);
    typingTimer = setTimeout(async () => {
      setSearchQuery(query);
    }, 500);
  };
  useEffect(() => {
    if((!document_number && document_amount) || (!document_amount && document_number)) return;
    setSearchValue(document_number ? `${document_number} - ${Number(document_amount).toFixed(2)} ₴` : '');
  }, [document_number, document_amount]);
  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Пошук документа..."
        value={searchValue}
        onChange={searchOnChange}
        onFocus={() => setShowDocumentDropdown(true)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {showDocumentDropdown && data && data.data.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
          {data.data.map((document) => (
            <button
              key={document.id}
              type="button"
              onClick={() => {
                setSelectedDocument(document);
                setSearchValue(`${document.number} - ${Number(document.amount).toFixed(2)} ₴`);
                setShowDocumentDropdown(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="font-semibold text-gray-900">
                {document.number}
              </div>
              <div className="text-xs text-gray-600">
                 {Number(document.amount).toFixed(2)} ₴
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
