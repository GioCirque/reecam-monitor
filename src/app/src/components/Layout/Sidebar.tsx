import React from 'react';
import { blue } from '@mui/material/colors';
import { useNavigate, useLocation } from 'react-router-dom';
import { Drawer, List, Typography, Divider, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Home as HomeIcon, AccountCircle as AccountIcon, Camera as CameraIcon } from '@mui/icons-material';

import { isNavActive } from '../../utils/functions';

const navItems: { to: string; name: string; exact: boolean; Icon: any }[] = [
  { to: '/', name: 'Start', exact: true, Icon: HomeIcon },
  { to: '/profile', name: 'Profile', exact: true, Icon: AccountIcon },
  { to: '/cams', name: 'Cams', exact: true, Icon: CameraIcon },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function Sidebar(props: Props) {
  const location = useLocation();
  const navigate = useNavigate();

  const onClick = (e: any, to: string) => {
    e.stopPropagation();
    navigate(to);
    props.onClose();
  };

  return (
    <Drawer
      anchor='left'
      open={props.open}
      onClose={() => props.onClose()}
      ModalProps={{
        keepMounted: true, // Better open performance on mobile.
      }}>
      <Typography variant='h6' style={{ margin: 15, maxWidth: 250 }}>
        {process.env.REACT_APP_NAME}
      </Typography>
      <Divider />
      <List>
        {navItems.map(({ to, name, exact, Icon }) => (
          <ListItem button key={name} onClick={(e) => onClick(e, to)} style={{ width: 250 }}>
            <ListItemIcon style={{ color: isNavActive(to, exact, location.pathname) ? blue[700] : 'inherit' }}>
              <Icon />
            </ListItemIcon>
            <ListItemText
              primary={name}
              style={{ color: isNavActive(to, exact, location.pathname) ? blue[700] : 'inherit' }}
            />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}
