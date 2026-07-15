import ManageTypesModal from '../modals/manage-types-modal';
import { useEffect, useState } from 'react';

type ManageTypesMode = 'add' | 'edit' | 'delete';

/**
 * Componente global que escucha el evento IPC 'open-manage-types'
 * disparado desde el menú de Electron y renderiza el modal de tipos.
 */
export default function ManageTypesListener() {
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<ManageTypesMode>('add');

  useEffect(() => {
    const handleOpenManageTypes = (receivedMode: string) => {
      setMode(receivedMode as ManageTypesMode);
      setShow(true);
    };

    window.api.onOpenManageTypes(handleOpenManageTypes);

    return () => {
      window.api.removeOpenManageTypes(handleOpenManageTypes);
    };
  }, []);

  return (
    <ManageTypesModal
      show={show}
      mode={mode}
      onClose={() => setShow(false)}
    />
  );
}
