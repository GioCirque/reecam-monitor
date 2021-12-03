import React from 'react';
import { pink, blue } from '@mui/material/colors';
import { useMediaQuery, CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import AuthPage from './pages/AuthPage';
import CamsPage from './pages/CamsPage';
import ProfilePage from './pages/ProfilePage';
import LandingPage from './pages/LandingPage';
import { getBasename } from './utils/functions';
import CamDetailsPage from './pages/CamDetailsPage';
import Snackbar from './components/widgets/Snackbar';
import MainLayout from './components/Layout/MainLayout';
import EmptyLayout from './components/Layout/EmptyLayout';
import LayoutRoute from './components/Layout/LayoutRoute';
import AuthenticatedRoute from './components/Layout/AuthenticatedRoute';

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
          primary: {
            main: blue[700],
          },
          secondary: pink,
        },
      }),
    [prefersDarkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter basename={getBasename()}>
        <Routes>
          <Route
            path='/'
            element={<LayoutRoute title='Kyle High Hub' layout={MainLayout} component={(props: any) => <LandingPage {...props} />} />}
          />
          <Route
            path='/login'
            element={<LayoutRoute title='Login' layout={EmptyLayout} component={(props: any) => <AuthPage {...props} />} />}
          />
          <Route
            path='/profile'
            element={<AuthenticatedRoute title='Profile' layout={MainLayout} component={ProfilePage} />}
          />
          <Route path='/cams' element={<AuthenticatedRoute title='Cams' layout={MainLayout} component={CamsPage} />} />
          <Route
            path='/cams/:alias'
            element={<AuthenticatedRoute title='Cams - :alias' layout={MainLayout} component={CamDetailsPage} />}
          />
        </Routes>
      </BrowserRouter>
      <Snackbar />
    </ThemeProvider>
  );
}

export default App;
