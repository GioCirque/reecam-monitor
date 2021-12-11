import { call, put } from 'redux-saga/effects';

import { API } from '../utils/api';
import { AppData } from '../types';
import APIActions from '../redux/apiRedux';
import MessageActions from '../redux/messageRedux';

export function* loadData() {
  try {
    yield put(APIActions.updateFetching(true));
    yield put(APIActions.updateError(false));

    const data: AppData = yield call(API.data);

    if (data) {
      yield put(APIActions.updateData(data));
      yield put(APIActions.updateFetching(false));
    } else {
      yield call(onError, 'Loading Remote Data Failed');
    }
  } catch (e) {
    console.error('Error on loadData', e);
    yield call(onError);
  }
}

export function* deleteEvent(action: any) {
  try {
    yield put(APIActions.updateFetching(true));
    yield put(APIActions.updateError(false));

    const { camAlias, eventId, password } = action;
    const data: AppData = yield call(API.delete, camAlias, eventId, password);

    if (data) {
      yield put(APIActions.updateData(data));
      yield put(APIActions.updateFetching(false));
    } else {
      yield call(onError, 'Deleting Remote Event Failed');
    }
  } catch (e) {
    console.error('Error on deleteEvent', e);
    yield call(onError);
  }
}

function* onError(message = 'Oops.. Something went wrong!') {
  yield put(MessageActions.openSnackbarWithColor(message, 'error'));
  yield put(APIActions.updateFetching(false));
  yield put(APIActions.updateError(true));
}
