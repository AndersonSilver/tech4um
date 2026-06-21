interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
}

function NetworkIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden
      className="shrink-0 text-bordergray"
    >
      <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="14" cy="4" r="2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="9" cy="14" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5.6 5.6L7.8 7.8M10.2 7.8L12.4 5.6M7.8 7.8V11.2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function MagnifyingGlassIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden
      className="shrink-0 text-background"
    >
      <circle cx="8" cy="8" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11.5 11.5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function SearchBar({ value, onChange, onSubmit }: SearchBarProps) {
  function handleSubmit() {
    onSubmit?.();
  }

  return (
    <div className="flex flex-1 gap-2 min-w-0 w-full items-stretch">
      <label className="flex flex-1 h-11 items-center gap-2 sm:gap-3 px-3 sm:px-4 min-w-0 cursor-text rounded-search border border-primary-dark bg-white">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Buscar uma sala..."
          className="w-full min-w-0 bg-transparent outline-none border-0 font-poppins font-light text-xs sm:text-sm text-textgray placeholder:text-bordergray"
        />
        <span className="hidden sm:inline shrink-0">
          <NetworkIcon />
        </span>
      </label>
      <button
        type="button"
        onClick={handleSubmit}
        aria-label="Buscar sala"
        className="shrink-0 h-11 w-11 rounded-button bg-primary-dark flex items-center justify-center hover:brightness-110 transition-all"
      >
        <MagnifyingGlassIcon />
      </button>
    </div>
  );
}
