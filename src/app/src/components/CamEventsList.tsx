import React from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { createStyles, makeStyles } from '@mui/styles';
import { Theme, Card, CardHeader, CardActions, CardMedia, Typography, Grid, Button } from '@mui/material';

import { IPCamMetaData, IPCamEvent } from '../types';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      maxWidth: '100vw',
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
  const eventId = (event.date.valueOf() / 1000).toString();
  const title = (() => {
    try {
      let result = formatDistanceToNow(event.date, { addSuffix: true });
      result = result[0].toLocaleUpperCase() + result.substring(1);
      return result;
    } catch (e) {
      console.log(e);
    }
    return 'Console Error';
  })();
  const subtitle = format(event.date, 'PPpp');
  return (
    <Card className={classes.root}>
      <CardHeader title={title} subheader={subtitle} />
      <CardMedia className={classes.media} image={event.gif} title={`Cam event from ${event.date}`} />
      <CardActions>
        <Button size='small' onClick={() => onStream(event)}>
          Stream
        </Button>
        <Button size='small' onClick={() => window.open(event.video)}>
          Download
        </Button>
        <Button size='small' color='error' onClick={() => onDelete(eventId)}>
          Delete
        </Button>
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
  const classes = useStyles();
  const itemClasses = useItemStyles();
  const { cam, onDelete, onStream } = props;
  const events = [...props.cam.events].sort((a, b) => b.date.valueOf() - a.date.valueOf());

  return (
    <Grid container direction='row' justifyContent='center' spacing={2} className={classes.root}>
      {events.map((e) => (
        <Grid item key={e.date.valueOf().toString()}>
          <CamEventListCard
            event={e}
            onStream={onStream}
            classes={itemClasses}
            onDelete={(eventId) => onDelete(cam.alias, eventId)}
          />
        </Grid>
      ))}
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
