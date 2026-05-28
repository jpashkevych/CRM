import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  SummaryStats,
  SalesResponse,
  AdditionalStats,
} from '../../models/statistics';

export const statisticsApi = createApi({
  reducerPath: 'statisticsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:8080/statistics',
  }),
  keepUnusedDataFor: 0,
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    /* =======================
       GET summary statistics
       ======================= */
    getSummaryStats: builder.query<SummaryStats, void>({
      query: () => ({
        url: '/',
      }),
    }),

    /* =======================
       GET sales by last 7 days
       ======================= */
    getSalesLast7Days: builder.query<SalesResponse, void>({
      query: () => ({
        url: '/sales',
      }),
    }),

    /* =======================
       GET additional stats
       ======================= */
    getAdditionalStats: builder.query<AdditionalStats, void>({
      query: () => '/additional',
    }),
  }),
});

export const {
  useGetSummaryStatsQuery,
  useGetSalesLast7DaysQuery,
  useGetAdditionalStatsQuery,
} = statisticsApi;

export default statisticsApi;