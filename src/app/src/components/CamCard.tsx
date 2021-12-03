import React from 'react';
import { makeStyles } from '@mui/styles';
import { Card, CardActionArea, CardContent, CardMedia, Typography } from '@mui/material';
import { IPCamMetaData } from '../types';

const useStyles = makeStyles({
  root: {
    minWidth: 345,
    maxWidth: 345,
  },
  media: {
    height: 140,
  },
});

type Props = {
  cam: IPCamMetaData;
  click?: (cam: IPCamMetaData) => void;
};

export default function MediaCard(props: Props) {
  const { cam, click } = props;
  const classes = useStyles();

  return (
    <Card className={classes.root}>
      <CardActionArea onClick={() => click && click(cam)}>
        <CardMedia className={classes.media} image={cam.snapshot} title={`${cam.alias} (${cam.id})`} />
        <CardContent>
          <Typography gutterBottom variant='h5' component='h2'>
            {cam.alias.replace('-', ' ')}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
