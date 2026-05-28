import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Product, ProductsResponse } from '../../models/products';


const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:8080/products',
  }),
  tagTypes: ['Products', 'Product'],
  endpoints: (builder) => ({
    /* =======================
       GET all products (pagination)
       ======================= */
    getProducts: builder.query<
      ProductsResponse,
      { page?: number; limit?: number, searchQuery: string }
    >({
      query: ({ page = 1, limit = 10, searchQuery }) => ({
        url: '',
        params: { page, limit, searchQuery },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({
                type: 'Product' as const,
                id,
              })),
              { type: 'Products', id: 'LIST' },
            ]
          : [{ type: 'Products', id: 'LIST' }],
    }),

    /* =======================
       GET product by id
       ======================= */
    getProductById: builder.query<Product, string>({
      query: (id) => `/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Product', id }],
    }),

    /* =======================
       CREATE product
       ======================= */
    createProduct: builder.mutation<
      { id: string },
      Omit<Product, 'id' | 'created_at'>
    >({
      query: (body) => ({
        url: '',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Products', id: 'LIST' }],
    }),

    /* =======================
       UPDATE product
       ======================= */
    updateProduct: builder.mutation<
      { message: string },
      { id: string } & Partial<Omit<Product, 'id'>>
    >({
      query: ({ id, ...body }) => ({
        url: `/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Product', id },
        { type: 'Products', id: 'LIST' },
      ],
    }),

    /* =======================
       DELETE product
       ======================= */
    deleteProduct: builder.mutation<
      { message: string },
      string
    >({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'Product', id },
        { type: 'Products', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productsApi;

export default productsApi;