import { createReducer, createActions } from 'reduxsauce';
import Immutable from 'seamless-immutable';
import { AppData } from '../types';

/* ------------- Types and Action Creators ------------- */

const { Types, Creators } = createActions({
  updateData: ['data'],
  updateFetching: ['fetching'],
  updateError: ['error'],
  deleteEvent: ['camAlias', 'eventId', 'password'],
  loadData: null,
});

export const APITypes = Types;
export default Creators;

/* ------------- Initial State ------------- */

type APIState = {
  data: AppData | null;
  fetching: boolean;
  error: boolean;
};

export const INITIAL_STATE = Immutable<APIState>({
  data: null,
  fetching: false,
  error: false,
});

/* ------------- Reducers ------------- */

export const updateData = (state: any, { data }: any) => state.merge({ data });

export const updateFetching = (state: any, { fetching }: APIState) => state.merge({ fetching });

export const updateError = (state: any, { error }: APIState) => state.merge({ error });

/* ------------- Hookup Reducers To Types ------------- */

export const reducer = createReducer(INITIAL_STATE, {
  [Types.UPDATE_DATA]: updateData,
  [Types.UPDATE_ERROR]: updateError,
  [Types.UPDATE_FETCHING]: updateFetching,
});
