import React from 'react';
import { Navigate } from 'react-router-dom';

import LayoutRoute from './LayoutRoute';
import { store } from '../../redux/store';

function AuthenticatedRoute(route: any) {
  const user = store.getState().auth.user;
  if (user) {
    return <LayoutRoute {...route} />;
  } else {
    return <Navigate to={{ pathname: '/login' }} replace={true} />;
  }
}

export default AuthenticatedRoute;
