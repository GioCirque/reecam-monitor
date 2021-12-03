import { connect } from 'react-redux';
import { Navigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { Paper, Grid, Divider, Button, Hidden } from '@mui/material';

import Input from '../components/Input';
import Page from '../components/Layout/Page';
import AuthActions from '../redux/authRedux';
import LoadingButton from '../components/LoadingButton';
import { AppUser } from '../types';

type Props = {
  user: AppUser;
  fetching: boolean;
  logout: () => void;
};

function ProfilePage(props: Props) {
  const [values, setValues] = useState(props.user);
  useEffect(() => setValues(props.user), [props.user]);

  if (!props.user) {
    return <Navigate to='/login' />;
  }

  return (
    <Page className='landingPage' title={`${props.user.alias}`}>
      <Paper elevation={3} style={{ marginTop: 8 }}>
        <Grid container style={{ padding: 16 }} spacing={2}>
          <Grid item xs={12} sm={6}>
            <Input
              id='name'
              label='Name'
              labelWidth={50}
              value={values.alias}
              onChange={() => setValues({ ...values })}
              fullWidth
              disabled
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Input
              id='email'
              label='Email'
              labelWidth={60}
              value={values.email}
              onChange={() => setValues({ ...values })}
              fullWidth
              disabled
            />
          </Grid>
          <Grid item xs={12}>
            <Divider />
          </Grid>
          <Grid item xs={12}>
            <Hidden smDown>
              Are you you not {props.user.alias} ({props.user.email})?{' '}
              <Button variant='text' onClick={() => props.logout()} color='primary'>
                Logout here
              </Button>
            </Hidden>
            <Hidden mdUp>
              <LoadingButton type='button' color='error' onClick={() => props.logout()} fullWidth text='Logout' />
            </Hidden>
          </Grid>
        </Grid>
      </Paper>
    </Page>
  );
}

const mapStateToProps = (state: any) => {
  return {
    user: state.auth.user,
    fetching: state.auth.fetching,
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    logout: () => dispatch(AuthActions.logout()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ProfilePage);
