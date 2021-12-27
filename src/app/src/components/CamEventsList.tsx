import React, { useState } from 'react';
import { format } from 'date-fns';
import { createStyles, makeStyles } from '@mui/styles';
import { Theme, Card, CardHeader, CardActions, CardMedia, Typography, Grid, Button, Chip } from '@mui/material';
import {
  NotificationsActiveOutlined as ActiveIcon,
  DownloadingOutlined as DownloadingIcon,
  CheckCircleOutline as DownloadedIcon,
  VideoSettingsOutlined as EncodingIcon,
  VideoLibraryOutlined as EncodedIcon,
} from '@mui/icons-material';

import { IPCamMetaData, IPCamEvent } from '../types';

const EventStageIcons: { [key: string]: React.ReactElement } = {
  Active: <ActiveIcon />,
  Downloading: <DownloadingIcon />,
  Downloaded: <DownloadedIcon />,
  Encoding: <EncodingIcon />,
  Encoded: <EncodedIcon />,
};

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      maxWidth: '100vw',
      marginBottom: '75px',
      backgroundColor: theme.palette.background.paper,
    },
    pager: {
      width: '100%',
      maxWidth: '100vw',
      marginTop: '75px',
      marginBottom: '75px',
      backgroundColor: theme.palette.background.paper,
    },
  })
);

const useItemStyles = makeStyles({
  root: {
    minWidth: 345,
    maxWidth: 345,
  },
  media: {
    height: 140,
  },
});

type ItemProps = {
  event: IPCamEvent;
  onStream: (event: IPCamEvent) => void;
  classes: Record<string, string | undefined>;
  onDelete: (eventId: string) => void;
};
function CamEventListCard(props: ItemProps) {
  const { event, classes, onStream, onDelete } = props;
  const eventId = event.id.toString();
  const title = event.elapsed;
  const subtitle = format(event.start, 'PPpp');

  return (
    <Card className={classes.root}>
      <CardHeader title={title} subheader={subtitle} />
      <CardMedia className={classes.media} image={event.gif} title={`Cam event from ${subtitle}`} />
      <CardActions>
        {event.hasVid ? (
          <>
            <Button size='small' onClick={() => onStream(event)}>
              Stream
            </Button>
            <Button size='small' onClick={() => window.open(event.video)}>
              Download
            </Button>
            <Button size='small' color='error' onClick={() => onDelete(eventId)}>
              Delete
            </Button>
          </>
        ) : (
          <Chip icon={EventStageIcons[event.stageName]} label={event.stageName} variant='outlined' />
        )}
      </CardActions>
    </Card>
  );
}

export type Props = {
  cam: IPCamMetaData;
  onStream: (event: IPCamEvent) => void;
  onDelete: (camAlias: string, eventId: string) => void;
};

export default function CamEventsList(props: Props) {
  const pageSize = 4;
  const classes = useStyles();
  const itemClasses = useItemStyles();
  const { cam, onDelete, onStream } = props;
  const [eventCount, setEventCount] = useState(pageSize);
  const events = [...props.cam.events].sort((a, b) => b.start - a.start).slice(0, eventCount);

  return (
    <Grid container direction='row' justifyContent='center' spacing={2} className={classes.root}>
      {(events && events.length > 0) && (
        <>
          {events.map(e => (<Grid item key={e.id}>
            <CamEventListCard
              event={e}
              onStream={onStream}
              classes={itemClasses}
              onDelete={(eventId) => onDelete(cam.alias, eventId)}
            />
          </Grid>))}
          <Grid container justifyContent='center' className={classes.pager}>
            <Button variant='contained' onClick={() => setEventCount(p => p + pageSize)} disabled={events.length >= props.cam.events.length}>Load Older Events</Button>
            <Grid container justifyContent='center'><Typography>Showing {events.length} of {props.cam.events.length} events</Typography></Grid>
          </Grid>
        </>
      )}
      {(!events || events.length === 0) && (
        <Grid item>
          <Typography gutterBottom component='h6'>
            No events found
          </Typography>
        </Grid>
      )}
    </Grid>
  );
}
