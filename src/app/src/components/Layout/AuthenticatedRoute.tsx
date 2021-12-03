import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import LayoutRoute from './LayoutRoute';
import { store } from '../../redux/store';

function AuthenticatedRoute(route: any) {
  const user = store.getState().auth.user;
  const navigate = useNavigate();
  const location = useLocation();
  if (user) {
    return <LayoutRoute {...route} />;
  } else {
    navigate('/login', { state: { from: location.pathname } });
    return <></>;
  }
}

export default AuthenticatedRoute;
