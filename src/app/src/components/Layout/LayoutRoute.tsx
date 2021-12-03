import React from 'react';

const LayoutRoute = ({ component: Component, layout: Layout, title, ...rest }: any) => (
  <Layout title={title}>
    <Component {...rest} />
  </Layout>
);

export default LayoutRoute;
