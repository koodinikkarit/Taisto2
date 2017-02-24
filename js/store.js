import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from 'redux-thunk';
import createLogger from "redux-logger";

import client from "./client";

import Matrix from "./reducers/Matrix";

import createSocket from "./socket";

export default createStore(combineReducers({
    matrix: Matrix,
    apollo: client.reducer()
}),
applyMiddleware(thunk,
    createSocket(),
    createLogger()    
));