import { combineReducers } from 'redux';
import { reducer as api } from './apiRedux';
import { reducer as auth } from './authRedux';
import { reducer as message } from './messageRedux';

const rootReducer = combineReducers({ api, auth, message });

export default rootReducer;
