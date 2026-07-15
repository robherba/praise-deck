import React from 'react';

interface EmptyProps {}

const Empty: React.FC<EmptyProps> = () => {
  return (
    <div className="text-center w-full max-w-[700px] flex flex-col gap-6 p-8 bg-[var(--bg-color)] rounded-md">
      <h2 className="mt-10 mb-0 text-3xl font-extrabold leading-none tracking-tight font-heading">
        Aún no hay cantos
      </h2>
      <p className='mb-8'>
        Puedes importar o crear cantos en el menú principal de la aplicación
      </p>
    </div>
  );
};

export default Empty;
