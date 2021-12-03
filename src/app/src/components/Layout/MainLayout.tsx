import { Box } from '@mui/material';
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

import Footer from './Footer';
import Header from './Header';
import TabBar from './TabBar';
import Sidebar from './Sidebar';
import useMobileService from '../../utils/mobileService';

type Props = {
  children: React.ReactNode;
  title?: string;
};

export default function MainLayout(props: Props) {
  const [open, setOpen] = useState(false);
  const isMobile = useMobileService();
  const { children } = props;
  let { title } = props;

  const params = useParams();
  const tokensDefault = {} as Record<string, string | undefined>;
  const tokens =
    title
      ?.match(/:([\w-_])+/gm)
      ?.map((m) => m.replace(':', ''))
      .reduce((p, c) => ({ ...p, [c]: params[c] }), tokensDefault) || tokensDefault;
  Object.keys(tokens).forEach((t) => (title = title?.replace(`:${t}`, tokens[t] || '')));

  if (isMobile) {
    return (
      <Box minHeight='100vh' display='flex' flexDirection='column'>
        <Header title={title} centerTitle />
        <Box flex={1} overflow='scroll'>
          {children}
        </Box>
        <TabBar />
      </Box>
    );
  }

  return (
    <Box minHeight='100vh' display='flex' flexDirection='column'>
      <Header title={title} onMenuClick={() => setOpen(true)} showMenu showProfile />
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <Box flex={1} overflow='auto'>
        {children}
      </Box>
      <Footer />
    </Box>
  );
}
