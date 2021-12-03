import React from 'react';
import { Box } from '@mui/material';

const EmptyLayout = ({ children, ...restProps }: any) => (
  <Box height='100vh' display='flex' flexDirection='column'>
    {children}
  </Box>
);

export default EmptyLayout;
