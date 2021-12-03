import React from 'react';
import { Grid, Divider } from '@mui/material';

const Footer = () => {
  return (
    <Grid container>
      <Grid item xs={12}>
        <Divider />
      </Grid>
      <Grid item xs={12} style={{ textAlign: 'center', color: 'grey', padding: 8 }}>
        Copyright © 2021
      </Grid>
    </Grid>
  );
};

export default Footer;
