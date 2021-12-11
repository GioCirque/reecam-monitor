import React from 'react';
import { makeStyles } from '@mui/styles';
import { Card, CardActionArea, CardHeader, CardMedia } from '@mui/material';
import {
  NotificationsActiveOutlined as AlarmedIcon,
  NotificationsOffOutlined as UnalarmedIcon,
} from '@mui/icons-material';

import { IPCamMetaData } from '../types';

const useStyles = makeStyles({
  root: {
    minWidth: 345,
    maxWidth: 345,
  },
  media: {
    height: 140,
  },
  blink: {
    animationName: '$blink-animation',
    animationDuration: '1s',
    animationTimingFunction: 'steps(5, start)',
    animationIterationCount: 'infinite',
  },
  '@keyframes blink-animation': {
    to: {
      visibility: 'hidden',
    },
  },
});

type Props = {
  cam: IPCamMetaData;
  click?: (cam: IPCamMetaData) => void;
};

export default function MediaCard(props: Props) {
  const { cam, click } = props;
  const classes = useStyles();
  const subtitle = cam.isAlarmed ? 'Well, this is alarming' : 'We found our calm';
  const alarmIcon = cam.isAlarmed ? <AlarmedIcon color='error' className={classes.blink} /> : <UnalarmedIcon />;

  return (
    <Card className={classes.root}>
      <CardActionArea onClick={() => click && click(cam)}>
        <CardHeader title={cam.alias.replace('-', ' ')} subheader={subtitle} avatar={alarmIcon} />
        <CardMedia className={classes.media} image={cam.snapshot} title={`${cam.alias} (${cam.id})`} />
      </CardActionArea>
    </Card>
  );
}
