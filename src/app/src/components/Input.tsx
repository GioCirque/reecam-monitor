import React from 'react';
import { OutlinedInput, FormControl, InputLabel, FormHelperText } from '@mui/material';

type Props = {
  id: string;
  label: string;
  labelWidth: number;
  value: any;
  onChange: (value: any) => void;
  autoComplete?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  error?: boolean;
  errorText?: string;
  readOnly?: boolean;
  fullWidth?: boolean;
};

export default function Input(props: Props) {
  const {
    id,
    label,
    value,
    onChange,
    autoComplete,
    disabled,
    autoFocus,
    error,
    readOnly,
    errorText,
    fullWidth,
  } = props;

  return (
    <FormControl fullWidth={fullWidth} variant='outlined'>
      <InputLabel htmlFor={id}>{label}</InputLabel>
      <OutlinedInput
        id={id}
        value={value}
        disabled={disabled}
        readOnly={readOnly}
        onChange={(e) => onChange(e.currentTarget.value)}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        error={error}
        inputProps={{
          'aria-label': label,
        }}
      />
      {error && (
        <FormHelperText error variant='outlined'>
          {errorText}
        </FormHelperText>
      )}
    </FormControl>
  );
}
