import { configureStore } from "@reduxjs/toolkit";
import userSlice from "./features/userSlice";
import appApi from "./services/appApi";

// Persist our store
import storage from "redux-persist/lib/storage";
import { combineReducers } from "redux";
import { persistReducer } from "redux-persist";
import thunk from "redux-thunk";

// Combine reducers
const reducer = combineReducers({
    user: userSlice,
    [appApi.reducerPath]: appApi.reducer,
});

// Persist configuration
const persistConfig = {
    key: "root",
    storage,
    blacklist: [appApi.reducerPath], // Prevent persisting API cache
};

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, reducer);

// Create Redux store
const store = configureStore({
    reducer: persistedReducer,
    middleware: [thunk, appApi.middleware],
});

export default store;
