import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  CashBankJournalResponse,
  GetCashBankJournalParams,
  CashBankJournal,
  CreateCashBankJournalDto,
  CashBankBalanceResponse,
  CashBankBalanceParams,
} from "../../models/cashBank";

export const cashBankJournalApi = createApi({
  reducerPath: "cashBankJournalApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:8080/cashBank",
    prepareHeaders: (headers) => {
      headers.set("Cache-Control", "no-cache");
      headers.set("Pragma", "no-cache");
      headers.set("Expires", "0");
      return headers;
    },
  }),
  tagTypes: ["CashBankJournal"],
  keepUnusedDataFor: 0,
  endpoints: (builder) => ({
    /* ===== GET journal ===== */
    getCashBankJournal: builder.query<
      CashBankJournalResponse,
      GetCashBankJournalParams
    >({
      query: ({
        page = 1,
        limit = 10,
        searchQuery,
        from,
        to,
        type = "all",
        status = "all",
      }) => ({
        url: "/",
        params: {
          page,
          limit,
          ...(searchQuery ? { searchQuery } : {}),
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
          ...(type !== "all" ? { type } : {}),
          ...(status !== "all" ? { status } : {}),
        },
      }),
      providesTags: ["CashBankJournal"],
    }),

    /* ===== POST journal ===== */
    createCashBankJournal: builder.mutation<
      CashBankJournal,
      CreateCashBankJournalDto
    >({
      query: (body) => ({
        url: "/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["CashBankJournal"],
    }),
    cashBankBalance: builder.query<
      CashBankBalanceResponse,
      CashBankBalanceParams
    >({
      query: (params) => ({
        url: "/cash-bank-balance",
        params,
      }),
    }),
  }),
});

export const { useCashBankBalanceQuery, useGetCashBankJournalQuery, useCreateCashBankJournalMutation } =
  cashBankJournalApi;

export default cashBankJournalApi;
