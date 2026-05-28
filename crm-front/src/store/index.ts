import { combineReducers, configureStore } from "@reduxjs/toolkit";
import productsApi from "./api/products";
import customersApi from "./api/customers";
import ordersApi from "./api/orders";
import statisticsApi from "./api/statistics";
import documentsApi from "./api/documents";
import journalApi from "./api/journal";
import cashBankJournalApi from "./api/cashBankJournal";

const rootReducer = combineReducers({
    [productsApi.reducerPath]: productsApi.reducer,
    [customersApi.reducerPath]: customersApi.reducer,
    [ordersApi.reducerPath]: ordersApi.reducer,
    [statisticsApi.reducerPath]: statisticsApi.reducer,
    [documentsApi.reducerPath]: documentsApi.reducer,
    [journalApi.reducerPath]: journalApi.reducer,
    [cashBankJournalApi.reducerPath]: cashBankJournalApi.reducer,
})

export const setupStore = () => {
    return configureStore({
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(productsApi.middleware, customersApi.middleware, ordersApi.middleware, statisticsApi.middleware, documentsApi.middleware, journalApi.middleware, cashBankJournalApi.middleware)
    })
}

export type TRootState = ReturnType<typeof rootReducer>
export type TAppStore = ReturnType<typeof setupStore>
export type TAppDispatch = TAppStore['dispatch']