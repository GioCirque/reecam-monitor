import React from 'react';
import { connect } from 'react-redux';
import '../styles/App.css';

import { AppUser } from '../types';
import Page from '../components/Layout/Page';
import { Typography } from '@mui/material';
import useMobileService from '../utils/mobileService';

type Props = {
  user: AppUser;
};

function LandingPage(props: Props) {
  const isMobile = useMobileService();

  return (
    <Page className='landingPage' title='Kyle High Hub'>
      <Typography variant='body1' gutterBottom>
        Welcome to the Kyle High Hub!
      </Typography>
      <Typography variant='body1' gutterBottom>
        Here you'll find lots of helpful and interesting information about, and tools for use at the Kyle High Club.
      </Typography>
      <Typography variant='body1' gutterBottom>
        Start by exploring the menu {isMobile ? 'across the bottom' : 'in the upper left corner'}.
      </Typography>
    </Page>
  );
}

const mapStateToProps = (state: any) => {
  return {
    user: state.auth.user,
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {};
};

export default connect(mapStateToProps, mapDispatchToProps)(LandingPage);
