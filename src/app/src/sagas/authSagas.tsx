import { call, put } from 'redux-saga/effects';
import AuthActions from '../redux/authRedux';
import MessageActions from '../redux/messageRedux';
import { persister } from '../redux/store';
import { AppUser } from '../types';
import { API } from '../utils/api';

export function* login(action: any) {
  try {
    yield put(AuthActions.updateFetching(true));
    yield put(AuthActions.updateError(false));

    const { mail, password } = action;
    const user: AppUser = yield call(API.login, mail, password);
    console.log(`Logged in as ${JSON.stringify(user)}`);

    if (user) {
      yield put(AuthActions.updateUser(user));
      yield put(AuthActions.updateFetching(false));
    } else {
      yield call(onError, 'Authentication Failed');
    }
  } catch (e) {
    console.error('Error on login', e);
    yield call(onError);
  }
}

function* onError(message = 'Oops.. Something went wrong!') {
  yield put(MessageActions.openSnackbarWithColor(message, 'error'));
  yield put(AuthActions.updateFetching(false));
  yield put(AuthActions.updateError(true));
}

export function* logout() {
  try {
    yield put(AuthActions.updateFetching(true));
    yield put(AuthActions.updateError(false));

    yield call(API.logout);

    yield put(AuthActions.resetAuthState());
    yield call(persister.purge);
  } catch (e) {
    console.error('Error at logging out', e);
  }
}
