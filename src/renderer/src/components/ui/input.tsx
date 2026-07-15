type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

export default function Input({
  value,
  className,
  placeholder,
  onChange,
  ...props
}: InputProps) {
  return (
    <div
      className={`
        w-full w-max-[100%] max-h-[42px] flex items-center border text-md rounded-lg px-2.5 py-0 transition-all focus-within:ring-2 focus-within:ring-[var(--secondary-color)]
        ${className}
      `}
    >
      {placeholder && value && <span className='ml-3'>{placeholder}:</span>}
      <input
        type="text"
        value={value}
        onChange={onChange}
        className="w-0 flex-1 py-2.5 text-md bg-transparent border-none outline-none focus:outline-none focus:ring-0"
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
}
