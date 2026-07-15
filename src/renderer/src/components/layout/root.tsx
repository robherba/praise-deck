import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { MessageProvider } from '../../context/message-context';
import ManageTypesListener from '../ui/manage-types-listener';
import Message from '../ui/message';

export default function RootLayout(): React.JSX.Element {
  return (
    <Suspense fallback={<div className="p-4 text-md font-body">Cargando aplicación...</div>}>
      <MessageProvider>
        <Outlet />
        <Message />
        <ManageTypesListener />
      </MessageProvider>
    </Suspense>
  );
}
