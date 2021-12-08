import React from 'react';
import { connect } from 'react-redux';
import {
  Grid,
  Paper,
  OutlinedInput,
  FormControl,
  InputAdornment,
  InputLabel,
  IconButton,
  FormHelperText,
  Divider,
  TextField,
} from '@mui/material';
import { Navigate, useLocation } from 'react-router-dom';
import { Visibility, VisibilityOff } from '@mui/icons-material';

import logo from '../assets/logo.svg';
import AuthActions from '../redux/authRedux';
import LoadingButton from '../components/LoadingButton';
import { isValidMail, isValidPassword } from '../utils/functions';

export type AuthState = 'LOGIN' | 'SIGNUP';

type Props = {
  user: any;
  error: boolean;
  fetching: boolean;
  login: (mail: string, password: string) => void;
};

interface State {
  mail: string;
  password: string;
  passwordConfirm: string;
  checked: boolean;
  showPassword: boolean;
  showPasswordConfirm: boolean;
  passwordForgot: boolean;
}

function AuthPage(props: Props) {
  const { user, fetching } = props;
  const location = useLocation();
  const historyState: any = location.state;

  const [values, setValues] = React.useState<State>({
    mail: '',
    password: '',
    passwordConfirm: '',
    checked: false,
    showPassword: false,
    showPasswordConfirm: false,
    passwordForgot: false,
  });

  const handleChange = (prop: keyof State) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues({ ...values, [prop]: event.target.value });
  };

  const handleBooleanChange = (prop: keyof State) => () => {
    setValues({ ...values, [prop]: !values[prop] });
  };

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const isFormValid = () => {
    return isValidMail(values.mail) && isValidPassword(values.password);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    props.login(values.mail, values.password);
  };

  if (user) {
    return <Navigate to={historyState && historyState.from ? historyState.from : '/'} />;
  }

  return (
    <Grid container alignItems='center' justifyContent='center' style={{ flex: 1 }}>
      <Grid item lg={4} md={6}>
        <Paper elevation={3} style={{ padding: 16 }}>
          <form id='auth' onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid container justifyContent='center' style={{ marginBottom: 20, marginTop: 20 }}>
                <img src={logo} style={{ height: 120 }} alt='logo' />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  id='mail'
                  fullWidth
                  autoFocus
                  variant='outlined'
                  autoComplete='email'
                  value={values.mail}
                  label='Email address'
                  onChange={handleChange('mail')}
                  aria-describedby='filled-weight-helper-text'
                  error={values.mail !== '' && !isValidMail(values.mail)}
                  inputProps={{
                    'aria-label': 'weight',
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth variant='outlined' className='textField'>
                  <InputLabel htmlFor='password'>Password</InputLabel>
                  <OutlinedInput
                    id='password'
                    label='Password'
                    type={values.showPassword ? 'text' : 'password'}
                    value={values.password}
                    autoComplete='current-password'
                    onChange={handleChange('password')}
                    error={values.password !== '' && !isValidPassword(values.password)}
                    endAdornment={
                      <InputAdornment position='end'>
                        <IconButton
                          aria-label='toggle password visibility'
                          onClick={handleBooleanChange('showPassword')}
                          onMouseDown={handleMouseDownPassword}
                          edge='end'>
                          {values.showPassword ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                  {values.password !== '' && !isValidPassword(values.password) && (
                    <FormHelperText error variant='outlined'>
                      Password must contain between 8 and 64 characters
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
            </Grid>
            <Divider style={{ marginTop: 16, marginBottom: 8 }} />
            <Grid container justifyContent='center'>
              <Grid item xs={12}>
                <LoadingButton
                  type='submit'
                  size='large'
                  fetching={fetching}
                  disabled={!isFormValid()}
                  text='Login'
                  fullWidth
                />
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Grid>
    </Grid>
  );
}

const mapStateToProps = (state: any) => {
  return {
    fetching: state.auth.fetching,
    error: state.auth.error,
    user: state.auth.user,
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    login: (mail: string, password: string) => dispatch(AuthActions.login(mail, password)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(AuthPage);
