import React, { ReactElement } from 'react';

type ButtonProps = {
  type: 'button' | 'link';
  icon?: ReactElement;
  href?: any;
  title: string;
  className?: string;
  onClick?: (event: React.FormEvent) => void;
};

const Button: React.FC<ButtonProps> = ({ type, icon, className, ...rest }) => {
  const RootElement = type === 'button' ? 'button' : 'a';

  return (
    <RootElement
      className={`w-max min-w-[44px] flex items-center gap-4 p-2.5 ms-2 text-md text-[var(--text-color)] transition-all font-medium bg-[color-mix(in_srgb,var(--bg-color)_60%,transparent)] border-[var(--text-color)] border-[1.5px] hover:bg-[var(--secondary-color)] hover:text-[var(--bg-color)] hover:border-[var(--bg-color)] rounded-lg cursor-pointer ${className}`}
      type="button"
      {...rest}
    >
      <span className="sr-only">{rest.title}</span>
      {icon}
    </RootElement>
  );
};

export default Button;
