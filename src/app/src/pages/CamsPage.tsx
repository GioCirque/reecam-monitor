import { connect } from 'react-redux';
import React, { useEffect } from 'react';
import { Stack, Grid } from '@mui/material';
import { Navigate, useNavigate } from 'react-router-dom';

import APIActions from '../redux/apiRedux';
import CamCard from '../components/CamCard';
import { AppData, AppUser } from '../types';
import Page from '../components/Layout/Page';

type Props = {
  user: AppUser;
  data: AppData;
  fetching: boolean;
  loadData: () => void;
};

function CamsPage(props: Props) {
  const navigate = useNavigate();
  const { data, loadData } = props;
  useEffect(() => loadData && loadData(), [loadData]);
  useEffect(() => {
    const interval = setInterval(() => {
      loadData && loadData();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!props.user) {
    return <Navigate to='/login' />;
  }

  return (
    <Page>
      <Grid container justifyContent='center'>
        <Stack alignSelf='center' direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2, sm: 4 }}>
          {data?.map((cam) => (
            <CamCard key={cam.id} cam={cam} click={(cam) => navigate(`/cams/${cam.alias}`)} />
          ))}
        </Stack>
      </Grid>
    </Page>
  );
}

const mapStateToProps = (state: any) => {
  return {
    data: state.api.data,
    user: state.auth.user,
    fetching: state.api.fetching,
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    loadData: () => dispatch(APIActions.loadData()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(CamsPage);
