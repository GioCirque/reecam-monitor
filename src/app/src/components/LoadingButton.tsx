import React from 'react';
import { makeStyles, createStyles } from '@mui/styles';
import { Button, CircularProgress, Theme } from '@mui/material';

type Props = {
  type?: 'button' | 'submit';
  color?: 'error' | 'success' | 'warning' | 'info' | 'primary' | 'secondary';
  onClick?: () => void;
  fetching?: boolean;
  disabled?: boolean;
  text: string;
  startIcon?: any;
  endIcon?: React.ReactChild;
  fullWidth?: boolean;
  size?: 'large' | 'medium' | 'small';
};

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    button: {
      backgroundColor: (props: Props) => theme.palette[props.color || 'primary'].main,
      color: (props: Props) => theme.palette[props.color || 'primary'].contrastText,
    },
  })
);

export default function LoadingButton(props: Props) {
  const classes = useStyles(props);
  const { text, type = 'button', onClick, fetching, disabled, startIcon, endIcon, fullWidth, size = 'medium' } = props;

  return (
    <div style={{ position: 'relative' }}>
      <Button
        variant='contained'
        className={classes.button}
        disabled={disabled || fetching}
        startIcon={startIcon}
        endIcon={endIcon}
        onClick={type === 'button' ? onClick : console.log}
        style={{ minWidth: 100 }}
        type={type}
        fullWidth={fullWidth}
        size={size}>
        {text}
        {fetching && (
          <CircularProgress
            size={24}
            style={{
              color: 'primary',
              position: 'absolute',
              top: '50%',
              left: '50%',
              marginTop: -12,
              marginLeft: -12,
            }}
          />
        )}
      </Button>
    </div>
  );
}
