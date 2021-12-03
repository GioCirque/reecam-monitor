import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BottomNavigation, BottomNavigationAction } from '@mui/material';
import { Home as HomeIcon, AccountCircle as AccountIcon, Camera as CameraIcon } from '@mui/icons-material';

import { isNavActive } from '../../utils/functions';

const navItems: { to: string; name: string; exact: boolean; Icon: any }[] = [
  { to: '/', name: 'Start', exact: true, Icon: HomeIcon },
  { to: '/profile', name: 'Profile', exact: true, Icon: AccountIcon },
  { to: '/cams', name: 'Cams', exact: true, Icon: CameraIcon },
];

export default function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeValue, setActiveValue] = React.useState('');

  // update the active value when the url changes
  useEffect(() => {
    if (location.pathname !== activeValue) {
      for (var item of navItems) {
        if (isNavActive(item.to, item.exact, location.pathname)) {
          setActiveValue(item.to);
          break;
        }
      }
      setActiveValue(location.pathname);
    }
  }, [location.pathname, activeValue]);

  return (
    <BottomNavigation
      value={activeValue}
      onChange={(event, value) => {
        setActiveValue(value);
        navigate(value);
      }}
      showLabels
      style={{ position: 'fixed', bottom: 0, width: '100%' }}>
      {navItems.map(({ to, name, Icon }, index) => (
        <BottomNavigationAction key={name} label={name} value={to} icon={<Icon />} />
      ))}
    </BottomNavigation>
  );
}
