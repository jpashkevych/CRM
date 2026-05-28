import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Order, OrdersResponse } from '../../models/orders';

export const ordersApi = createApi({
  reducerPath: 'ordersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:8080/orders', 
  }),
  tagTypes: ['Orders', 'Order'],
  endpoints: (builder) => ({
    /* =======================
       GET orders
       ======================= */
    getOrders: builder.query<
      OrdersResponse,
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
                type: 'Order' as const,
                id,
              })),
              { type: 'Orders', id: 'LIST' },
            ]
          : [{ type: 'Orders', id: 'LIST' }],
    }),

    /* =======================
       GET order by id (with items)
       ======================= */
    getOrderById: builder.query<Order, string>({
      query: (id) => `/${id}`,
      providesTags: (_res, _err, id) => [
        { type: 'Order', id },
      ],
    }),

    /* =======================
       CREATE order
       ======================= */
    createOrder: builder.mutation<
      { id: string },
      {
        customer_id: string;
        notes?: string;
        items: {
          product_id: string;
          quantity: number;
          price: number;
        }[];
      }
    >({
      query: (body) => ({
        url: '',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Orders', id: 'LIST' }],
    }),

    /* =======================
       UPDATE order
       ======================= */
    updateOrder: builder.mutation<
      { message: string },
      {
        id: string;
        status?: string;
        notes?: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Order', id },
        { type: 'Orders', id: 'LIST' },
      ],
    }),

    /* =======================
       DELETE order
       ======================= */
    deleteOrder: builder.mutation<
      { message: string },
      string
    >({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'Order', id },
        { type: 'Orders', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
} = ordersApi;

export default ordersApi;
