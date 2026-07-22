import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  findCountryByIso,
  flagUrl,
  registrationCountries,
  type CountryOption,
} from '@/data/registration';

type PhoneInputProps = {
  id: string;
  countryIso: string;
  phoneNumber: string;
  onCountryChange: (iso: string) => void;
  onPhoneChange: (value: string) => void;
  hasError?: boolean;
  disabled?: boolean;
  /** Force dark dropdown styling (recommended on navy registration surfaces). */
  appearance?: 'auto' | 'dark';
};

export function PhoneInput({
  id,
  countryIso,
  phoneNumber,
  onCountryChange,
  onPhoneChange,
  hasError = false,
  disabled = false,
  appearance = 'auto',
}: PhoneInputProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const forceDark = appearance === 'dark';

  const selected = useMemo(
    () => findCountryByIso(countryIso) ?? registrationCountries[0],
    [countryIso],
  );

  const filteredCountries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return registrationCountries;

    return registrationCountries.filter((country) => {
      return (
        country.name.toLowerCase().includes(normalized) ||
        country.iso.toLowerCase().includes(normalized) ||
        country.dialCode.includes(normalized)
      );
    });
  }, [query]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open]);

  const selectCountry = (country: CountryOption) => {
    onCountryChange(country.iso);
    setOpen(false);
    setQuery('');
  };

  return (
    <div
      ref={rootRef}
      className={`flex rounded-2xl border ${
        forceDark
          ? 'border-white/15 bg-[#111827] text-white'
          : 'border-border bg-white text-ink dark:border-slate-600 dark:bg-[#111827] dark:text-white'
      } ${hasError ? 'border-red-500' : ''}`}
    >
      <div
        className={`relative border-r ${
          forceDark ? 'border-white/15' : 'border-border dark:border-slate-600'
        }`}
      >
        <button
          type="button"
          id={`${id}-country`}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-label={`Country dialing code: ${selected.name} ${selected.dialCode}`}
          onClick={() => {
            if (disabled) return;
            setOpen((value) => !value);
          }}
          className={`flex h-12 min-w-[10rem] items-center gap-2 px-3 text-left text-sm font-medium transition disabled:opacity-50 ${
            forceDark
              ? 'text-white hover:bg-white/10'
              : 'text-ink hover:bg-slate-50 dark:text-white dark:hover:bg-slate-800'
          }`}
        >
          <img
            src={flagUrl(selected.iso)}
            alt=""
            width={22}
            height={16}
            className="rounded-[2px] ring-1 ring-black/10"
          />
          <span className={`font-bold tabular-nums ${forceDark ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
            {selected.dialCode}
          </span>
          <svg
            viewBox="0 0 20 20"
            className={`ml-auto h-4 w-4 transition ${open ? 'rotate-180' : ''} ${
              forceDark ? 'text-slate-300' : 'text-slate-500 dark:text-slate-300'
            }`}
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M5.25 7.5 10 12.25 14.75 7.5" />
          </svg>
        </button>

        {open ? (
          <div
            id={listboxId}
            role="listbox"
            aria-label="Select country dialing code"
            className="absolute top-[calc(100%+0.5rem)] left-0 z-[80] w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-700 bg-[#111827] text-white shadow-2xl shadow-black/50"
          >
            <div className="border-b border-slate-700 p-2">
              <label htmlFor={`${id}-country-search`} className="sr-only">
                Search countries
              </label>
              <input
                ref={searchRef}
                id={`${id}-country-search`}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search country, ISO, or dial code"
                className="h-10 w-full rounded-xl border border-slate-600 bg-[#0B1220] px-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-[#1A6BFF]"
              />
            </div>

            <ul className="max-h-72 overflow-y-auto py-1">
              {filteredCountries.length === 0 ? (
                <li className="px-3 py-3 text-sm text-slate-300">No countries found</li>
              ) : (
                filteredCountries.map((country) => {
                  const isSelected = country.iso === selected.iso;

                  return (
                    <li key={country.iso} role="option" aria-selected={isSelected}>
                      <button
                        type="button"
                        onClick={() => selectCountry(country)}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition ${
                          isSelected
                            ? 'bg-[#0052CC] text-white'
                            : 'text-white hover:bg-[#0052CC]'
                        }`}
                      >
                        <img
                          src={flagUrl(country.iso)}
                          alt=""
                          width={22}
                          height={16}
                          className="rounded-[2px] ring-1 ring-white/20"
                        />
                        <span className="min-w-0 flex-1 truncate font-medium text-white">
                          {country.name}
                        </span>
                        <span className="shrink-0 font-bold text-accent tabular-nums">
                          {country.dialCode}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
        <span
          className={`shrink-0 text-sm font-bold tabular-nums ${
            forceDark ? 'text-accent' : 'text-slate-800 dark:text-accent'
          }`}
        >
          {selected.dialCode}
        </span>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          disabled={disabled}
          value={phoneNumber}
          onChange={(event) => onPhoneChange(event.target.value)}
          placeholder="Phone number"
          aria-invalid={hasError || undefined}
          className={`h-12 min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400 ${
            forceDark ? 'text-white' : 'text-ink dark:text-white'
          }`}
        />
      </div>
    </div>
  );
}
