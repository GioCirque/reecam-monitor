import React from 'react';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AccountCircle, Menu as MenuIcon } from '@mui/icons-material';
import { IconButton, Toolbar, AppBar, Typography, Button, Menu, MenuItem } from '@mui/material';

import AuthActions from '../../redux/authRedux';
import { AppUser } from '../../types';

type Props = {
  title?: string;
  showMenu?: boolean;
  showProfile?: boolean;
  centerTitle?: boolean;
  user: AppUser;
  onMenuClick?: () => void;
  logout: () => void;
};

function Header(props: Props) {
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const logout = () => {
    handleUserMenuClose();
    props.logout();
  };

  const navigateProfile = () => {
    handleUserMenuClose();
    navigate('/profile');
  };

  function renderProfile() {
    if (!props.user) {
      return (
        <Button color='inherit' onClick={() => navigate('/login')}>
          Login
        </Button>
      );
    } else {
      return (
        <div>
          <Button
            variant='text'
            color='inherit'
            aria-haspopup='true'
            onClick={handleUserMenu}
            aria-controls='menu-appbar'
            aria-label='account of current user'
            endIcon={<AccountCircle />}>
            {props.user.alias}
          </Button>
          <Menu
            id='menu-appbar'
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={open}
            onClose={handleUserMenuClose}>
            <MenuItem onClick={navigateProfile}>Profile</MenuItem>
            <MenuItem divider />
            <MenuItem onClick={logout}>Logout</MenuItem>
          </Menu>
        </div>
      );
    }
  }

  return (
    <AppBar position='static'>
      <Toolbar>
        {props.showMenu && (
          <IconButton edge='start' color='inherit' aria-label='menu' onClick={props.onMenuClick}>
            <MenuIcon />
          </IconButton>
        )}
        <Typography variant='h6' style={{ flexGrow: 1, textAlign: props.centerTitle ? 'center' : 'left' }}>
          {props.title}
        </Typography>
        {props.showProfile && renderProfile()}
      </Toolbar>
    </AppBar>
  );
}

const mapStateToProps = (state: any) => {
  return {
    user: state.auth.user,
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    logout: () => dispatch(AuthActions.logout()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Header);
