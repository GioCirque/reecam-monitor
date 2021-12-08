import { connect } from 'react-redux';
import React, { useEffect, useState } from 'react';
import { Paper, Grid, Divider, Button, Hidden, TextField, Container } from '@mui/material';

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

  return (
    <Page className='landingPage' title={`${props.user.alias}`}>
      <Container maxWidth='md'>
        <Paper elevation={3} style={{ marginTop: 18 }}>
          <Grid container style={{ padding: 16 }} spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                id='name'
                disabled
                fullWidth
                autoFocus
                label='Name'
                variant='outlined'
                autoComplete='name'
                value={values.alias}
                aria-describedby='filled-weight-helper-text'
                inputProps={{
                  'aria-label': 'weight',
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id='email'
                disabled
                fullWidth
                autoFocus
                label='Email'
                variant='outlined'
                autoComplete='email'
                value={values.email}
                aria-describedby='filled-weight-helper-text'
                inputProps={{
                  'aria-label': 'weight',
                }}
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
      </Container>
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
