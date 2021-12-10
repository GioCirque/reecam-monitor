import createSagaMiddleware from 'redux-saga';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web
import { createStore, applyMiddleware } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import { seamlessImmutableReconciler, seamlessImmutableTransformCreator } from 'redux-persist-seamless-immutable';

import rootSaga from '../sagas';
import rootReducer from './index';
import { appTransformer } from './transform';

const transformerConfig = {
  blacklistPerReducer: {
    api: ['error', 'fetching'],
    auth: ['error', 'fetching'],
  },
};

const persistConfig = {
  key: 'root',
  storage,
  stateReconciler: seamlessImmutableReconciler,
  transforms: [appTransformer, seamlessImmutableTransformCreator(transformerConfig)],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// create the saga middleware
const sagaMiddleware = createSagaMiddleware();
export const store = createStore(persistedReducer, applyMiddleware(sagaMiddleware)) as any;
sagaMiddleware.run(rootSaga);

export const persister = persistStore(store);
