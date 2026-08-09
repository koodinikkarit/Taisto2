import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from 'redux-thunk';
import { createLogger } from "redux-logger";

import Matrix from "./reducers/Matrix";

import createSocket from "./socket";

export default createStore(combineReducers({
    matrix: Matrix
}),
applyMiddleware(thunk,
    createSocket(),
    createLogger()    
));
