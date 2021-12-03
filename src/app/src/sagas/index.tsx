import { takeEvery, all, takeLatest } from 'redux-saga/effects';

/* ------------- Types ------------- */
import { AuthTypes } from '../redux/authRedux';
import { APITypes } from '../redux/apiRedux';

/* ------------- Sagas ------------- */
import { login, logout } from './authSagas';
import { loadData, deleteEvent } from './apiSagas'

/* ------------- Connect Types To Sagas ------------- */

export default function* root() {
  yield all([
    // Auth
    takeLatest(AuthTypes.LOGIN, login),
    takeEvery(AuthTypes.LOGOUT, logout),
    // Data
    takeLatest(APITypes.LOAD_DATA, loadData),
    takeLatest(APITypes.DELETE_EVENT, deleteEvent),
  ]);
}
