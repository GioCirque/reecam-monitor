import React, { useRef } from 'react';
import {
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Container
} from '@mui/material';

export type Props = {
  open: boolean;
  onClose: (value?: string) => void;
};

export function ConfirmDelete(props: Props) {
  const { onClose, open: openProp } = props;
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEntering = () => {
    if (inputRef.current != null) {
      inputRef.current.focus();
    }
  };

  const handleCancel = () => {
    onClose(inputRef.current?.value);
  };

  const handleConfirm = () => {
    onClose(inputRef.current?.value);
  };

  return (
    <Dialog
      sx={{ '& .MuiDialog-paper': { width: '80%', maxHeight: 435 } }}
      maxWidth='xs'
      TransitionProps={{ onEntering: handleEntering }}
      open={openProp}>
      <DialogTitle>Delete</DialogTitle>
      <DialogContent>
        <Container>
          <Typography variant='subtitle1' gutterBottom component='div'>
            You must provide your password to confirm deletion.
          </Typography>
          <TextField inputRef={inputRef} id='outlined-basic' label='Password' variant='outlined' type='password' required />
        </Container>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={handleCancel} color='primary'>
          Cancel
        </Button>
        <Button onClick={handleConfirm} color='error'>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
