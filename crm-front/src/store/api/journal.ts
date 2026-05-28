import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  Account,
  JournalResponse,
  GetJournalParams,
  JournalEntry,
  CreateJournalEntryDto,
  TrialBalanceParams,
  TrialBalanceResponse,
  AccountCardResponse,
  AccountCardParams,
} from "../../models/journalEntries";

export const journalApi = createApi({
  reducerPath: "journalApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:8080/journalEntries",
    prepareHeaders: (headers) => {
      headers.set("Cache-Control", "no-cache");
      headers.set("Pragma", "no-cache");
      headers.set("Expires", "0");
      return headers;
    },
  }),
  tagTypes: ["Journal", "Accounts"],
  keepUnusedDataFor: 0,
  endpoints: (builder) => ({
    /* ===== accounts ===== */
    getAccounts: builder.query<Account[], void>({
      query: () => "/accounts",
      providesTags: ["Accounts"],
    }),

    /* ===== journal list ===== */
    getJournal: builder.query<JournalResponse, GetJournalParams>({
      query: ({ page = 1, limit = 10, searchQuery }) => ({
        url: "/",
        params: {
          page,
          limit,
          ...(searchQuery ? { searchQuery } : {}),
        },
      }),
      providesTags: ["Journal"],
    }),

    /* ===== create journal entry ===== */
    createJournalEntry: builder.mutation<JournalEntry, CreateJournalEntryDto>({
      query: (body) => ({
        url: "/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Journal"],
    }),

    trialBalance: builder.query<TrialBalanceResponse, TrialBalanceParams>({
      query: ({ from, to }) => ({
        url: "/trial-balance",
        params: {
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
        },
      }),
    }),

    accountCard: builder.query<AccountCardResponse, AccountCardParams>({
  query: ({ accountId, from, to }) => ({
    url: `/account-card/${accountId}`,
    params: { from, to },
  }),
}),
  }),
});

export const {
  useGetAccountsQuery,
  useGetJournalQuery,
  useCreateJournalEntryMutation,
  useTrialBalanceQuery,
  useAccountCardQuery,
} = journalApi;

export default journalApi;
