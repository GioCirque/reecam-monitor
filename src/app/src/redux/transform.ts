import { createTransform } from 'redux-persist';

export const appTransformer = createTransform<any, any, any, any>(
  // transform state on its way to being serialized and persisted.
  (inboundState, key) => {
    return inboundState;
  },

  // transform state being rehydrated
  (outboundState, key) => {
    return outboundState;
  }
);
