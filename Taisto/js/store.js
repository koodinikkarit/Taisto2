import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from 'redux-thunk';
import createLogger from "redux-logger";
import {
    AppData
} from "./reducers/";

export default createStore(combineReducers({
    appData: AppData
}),
applyMiddleware(thunk, createLogger())
);