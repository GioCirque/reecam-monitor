import { connect } from 'react-redux';
import React, { useState } from 'react';
import APIActions from '../redux/apiRedux';
import MessageActions from '../redux/messageRedux';
import { createStyles, makeStyles } from '@mui/styles';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { Theme, Grid, Typography, Breadcrumbs, Link, Modal, Box } from '@mui/material';
import { Home as HomeIcon, Camera as CameraIcon, CameraIndoor as CamIcon } from '@mui/icons-material';

import { AppData, AppUser, IPCamEvent } from '../types';
import Page from '../components/Layout/Page';
import CamEventsList from '../components/CamEventsList';
import { ConfirmDelete } from '../components/ConfirmDelete';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    breadcrumbs: {
      height: 50,
      backgroundColor: theme.palette.background.paper,
    },
    breadcrumbLink: {
      cursor: 'pointer',
    },
  })
);

const modalStyle = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '710px',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

type Props = {
  user: AppUser;
  data: AppData;
  fetching: boolean;
  notify: (message: string, color: string) => void;
  deleteEvent: (camAlias: string, eventId: string, password: string) => void;
};

type DeleteState = {
  camAlias?: string;
  eventId?: string;
  confirmed?: boolean;
};

function CamDetailsPage(props: Props) {
  const classes = useStyles();
  const { alias } = useParams();
  const navigate = useNavigate();

  const [streamEvent, setStreamEvent] = useState<IPCamEvent | null>(null);
  const [deleteState, setDeleteState] = useState<DeleteState | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const openModal = () => setModalOpen(true);
  const closeModal = () => {
    setStreamEvent(null);
    setModalOpen(false);
  };

  const { data, user, deleteEvent, notify } = props;
  if (!user) return <Navigate to='/login' />;
  if (!data) return <Navigate to='/cams' />;

  const cam = data.find((cam) => cam.alias.toLocaleLowerCase() === alias?.toLocaleLowerCase());

  const handleOnStream = (event: IPCamEvent) => {
    setStreamEvent(event);
    openModal();
  };

  const handleVideoError = (event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    event.preventDefault();
    closeModal();
    notify('There was a problem loading that video', 'error');
  };

  const onDeleteRequested = (camAlias: string, eventId: string) => {
    setDeleteState((p) => ({ ...p, camAlias, eventId }));
    setConfirmOpen(true);
  };

  const onDeleteConfirmed = (password?: string) => {
    const { camAlias, eventId } = deleteState as DeleteState;
    if (camAlias && eventId && password && password.length > 0) {
      deleteEvent(camAlias, eventId, password);
    }
    setConfirmOpen(false);
    setDeleteState((p) => null);
  };

  return (
    <Page>
      <Breadcrumbs className={classes.breadcrumbs} aria-label='breadcrumbs'>
        <Link
          color='inherit'
          underline='hover'
          className={classes.breadcrumbLink}
          sx={{ display: 'flex', alignItems: 'center' }}
          onClick={() => navigate('/')}>
          <HomeIcon sx={{ mr: 0.5 }} fontSize='inherit' />
          Home
        </Link>
        <Link
          color='inherit'
          underline='hover'
          className={classes.breadcrumbLink}
          sx={{ display: 'flex', alignItems: 'center' }}
          onClick={() => navigate('/cams')}>
          <CameraIcon sx={{ mr: 0.5 }} fontSize='inherit' />
          Cams
        </Link>
        <Typography sx={{ display: 'flex', alignItems: 'center' }} color='text.primary'>
          <CamIcon sx={{ mr: 0.5 }} fontSize='inherit' />
          {alias?.replace('-', ' ') || 'Invalid Camera'}
        </Typography>
      </Breadcrumbs>
      {cam && (
        <Grid container item justifyContent='center'>
          <CamEventsList onDelete={onDeleteRequested} onStream={handleOnStream} cam={cam} />
        </Grid>
      )}
      {!cam && (
        <Typography variant='h4' gutterBottom>
          The '{alias}' cam appears to invalid.
        </Typography>
      )}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        aria-labelledby='modal-modal-title'
        aria-describedby='modal-modal-description'>
        <Box sx={modalStyle}>
          <video height={480} width={640} controls autoPlay muted poster={streamEvent?.gif} onError={handleVideoError}>
            <source src={streamEvent?.stream} type='video/mp4' />
            Your browser does not support the video tag.
          </video>
        </Box>
      </Modal>
      <ConfirmDelete onClose={onDeleteConfirmed} open={confirmOpen} />
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
    deleteEvent: (camAlias: string, eventId: string, password: string) =>
      dispatch(APIActions.deleteEvent(camAlias, eventId, password)),
    notify: (message: string, color: string) => dispatch(MessageActions.openSnackbarWithColor(message, 'error')),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(CamDetailsPage);
