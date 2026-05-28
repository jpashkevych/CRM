import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Customer, CustomersResponse } from '../../models/customers';

export const customersApi = createApi({
  reducerPath: 'customersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:8080/customers', 
  }),
  tagTypes: ['Customers', 'Customer'],
  endpoints: (builder) => ({
    /* =======================
       GET customers
       ======================= */
    getCustomers: builder.query<
      CustomersResponse,
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
                type: 'Customer' as const,
                id,
              })),
              { type: 'Customers', id: 'LIST' },
            ]
          : [{ type: 'Customers', id: 'LIST' }],
    }),

    /* =======================
       GET customer by id
       ======================= */
    getCustomerById: builder.query<Customer, string>({
      query: (id) => `/${id}`,
      providesTags: (_res, _err, id) => [
        { type: 'Customer', id },
      ],
    }),

    /* =======================
       CREATE customer
       ======================= */
    createCustomer: builder.mutation<
      { id: string },
      Omit<Customer, 'id' | 'created_at' | 'total_spent'>
    >({
      query: (body) => ({
        url: '',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Customers', id: 'LIST' }],
    }),

    /* =======================
       UPDATE customer
       ======================= */
    updateCustomer: builder.mutation<
      { message: string },
      { id: string } & Partial<Omit<Customer, 'id' | 'created_at'>>
    >({
      query: ({ id, ...body }) => ({
        url: `/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Customer', id },
        { type: 'Customers', id: 'LIST' },
      ],
    }),

    /* =======================
       DELETE customer
       ======================= */
    deleteCustomer: builder.mutation<
      { message: string },
      string
    >({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'Customer', id },
        { type: 'Customers', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customersApi;

export default customersApi;