
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  Document,
  DocumentInsert,
  DocumentsResponse,
  DocumentStatus,
} from '../../models/documents';

export const documentsApi = createApi({
  reducerPath: 'documentsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:8080/documents', // змінити якщо треба
  }),
  tagTypes: ['Documents', 'Document'],
  endpoints: (builder) => ({
    /* =======================
       GET documents (pagination + search)
       ======================= */
    getDocuments: builder.query<
      DocumentsResponse,
      {
        page?: number;
        limit?: number;
        searchQuery?: string;
      }
    >({
      query: ({ page = 1, limit = 10, searchQuery }) => ({
        url: '',
        params: {
          page,
          limit,
          ...(searchQuery ? { searchQuery } : {}),
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: 'Document' as const,
                id,
              })),
              { type: 'Documents', id: 'LIST' },
            ]
          : [{ type: 'Documents', id: 'LIST' }],
    }),

    /* =======================
       CREATE document
       ======================= */
    createDocument: builder.mutation<
      { id: string },
      DocumentInsert
    >({
      query: (body) => ({
        url: '',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Documents', id: 'LIST' }],
    }),

    /* =======================
       UPDATE document
       ======================= */
    updateDocument: builder.mutation<
      { message: string },
      {
        id: string;
      } & DocumentInsert
    >({
      query: ({ id, ...body }) => ({
        url: `/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Document', id },
        { type: 'Documents', id: 'LIST' },
      ],
    }),

    /* =======================
       PATCH change status
       ======================= */
    changeDocumentStatus: builder.mutation<
      { message: string },
      {
        id: string;
        status: DocumentStatus;
      }
    >({
      query: ({ id, status }) => ({
        url: `/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Document', id },
        { type: 'Documents', id: 'LIST' },
      ],
    }),

    /* =======================
       DELETE document
       ======================= */
    deleteDocument: builder.mutation<
      { message: string },
      string
    >({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'Document', id },
        { type: 'Documents', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetDocumentsQuery,
  useCreateDocumentMutation,
  useUpdateDocumentMutation,
  useChangeDocumentStatusMutation,
  useDeleteDocumentMutation,
} = documentsApi;

export default documentsApi;