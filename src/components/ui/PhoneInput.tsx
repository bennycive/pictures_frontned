/**
 * PhoneInput — country-code selector + local number input.
 * value/onChange use the full E.164-style string, e.g. "+255712345678".
 */
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export interface Country {
  code: string;   // ISO-2 e.g. "TZ"
  name: string;
  dial: string;   // e.g. "+255"
  flag: string;   // emoji
}

// Priority countries appear first (African-focused platform)
const PRIORITY = ['TZ', 'KE', 'UG', 'RW', 'BI', 'ET', 'NG', 'GH', 'ZA', 'EG', 'MA', 'SN', 'CM', 'CI', 'AO'];

export const COUNTRIES: Country[] = [
  // Africa
  { code: 'DZ', name: 'Algeria',              dial: '+213', flag: '🇩🇿' },
  { code: 'AO', name: 'Angola',               dial: '+244', flag: '🇦🇴' },
  { code: 'BJ', name: 'Benin',                dial: '+229', flag: '🇧🇯' },
  { code: 'BW', name: 'Botswana',             dial: '+267', flag: '🇧🇼' },
  { code: 'BF', name: 'Burkina Faso',         dial: '+226', flag: '🇧🇫' },
  { code: 'BI', name: 'Burundi',              dial: '+257', flag: '🇧🇮' },
  { code: 'CM', name: 'Cameroon',             dial: '+237', flag: '🇨🇲' },
  { code: 'CV', name: 'Cape Verde',           dial: '+238', flag: '🇨🇻' },
  { code: 'CF', name: 'Central African Rep.', dial: '+236', flag: '🇨🇫' },
  { code: 'TD', name: 'Chad',                 dial: '+235', flag: '🇹🇩' },
  { code: 'KM', name: 'Comoros',              dial: '+269', flag: '🇰🇲' },
  { code: 'CD', name: 'Congo (DRC)',          dial: '+243', flag: '🇨🇩' },
  { code: 'CG', name: 'Congo (Republic)',     dial: '+242', flag: '🇨🇬' },
  { code: 'CI', name: "Côte d'Ivoire",        dial: '+225', flag: '🇨🇮' },
  { code: 'DJ', name: 'Djibouti',             dial: '+253', flag: '🇩🇯' },
  { code: 'EG', name: 'Egypt',                dial: '+20',  flag: '🇪🇬' },
  { code: 'GQ', name: 'Equatorial Guinea',    dial: '+240', flag: '🇬🇶' },
  { code: 'ER', name: 'Eritrea',              dial: '+291', flag: '🇪🇷' },
  { code: 'SZ', name: 'Eswatini',             dial: '+268', flag: '🇸🇿' },
  { code: 'ET', name: 'Ethiopia',             dial: '+251', flag: '🇪🇹' },
  { code: 'GA', name: 'Gabon',                dial: '+241', flag: '🇬🇦' },
  { code: 'GM', name: 'Gambia',               dial: '+220', flag: '🇬🇲' },
  { code: 'GH', name: 'Ghana',                dial: '+233', flag: '🇬🇭' },
  { code: 'GN', name: 'Guinea',               dial: '+224', flag: '🇬🇳' },
  { code: 'GW', name: 'Guinea-Bissau',        dial: '+245', flag: '🇬🇼' },
  { code: 'KE', name: 'Kenya',                dial: '+254', flag: '🇰🇪' },
  { code: 'LS', name: 'Lesotho',              dial: '+266', flag: '🇱🇸' },
  { code: 'LR', name: 'Liberia',              dial: '+231', flag: '🇱🇷' },
  { code: 'LY', name: 'Libya',                dial: '+218', flag: '🇱🇾' },
  { code: 'MG', name: 'Madagascar',           dial: '+261', flag: '🇲🇬' },
  { code: 'MW', name: 'Malawi',               dial: '+265', flag: '🇲🇼' },
  { code: 'ML', name: 'Mali',                 dial: '+223', flag: '🇲🇱' },
  { code: 'MR', name: 'Mauritania',           dial: '+222', flag: '🇲🇷' },
  { code: 'MU', name: 'Mauritius',            dial: '+230', flag: '🇲🇺' },
  { code: 'MA', name: 'Morocco',              dial: '+212', flag: '🇲🇦' },
  { code: 'MZ', name: 'Mozambique',           dial: '+258', flag: '🇲🇿' },
  { code: 'NA', name: 'Namibia',              dial: '+264', flag: '🇳🇦' },
  { code: 'NE', name: 'Niger',                dial: '+227', flag: '🇳🇪' },
  { code: 'NG', name: 'Nigeria',              dial: '+234', flag: '🇳🇬' },
  { code: 'RW', name: 'Rwanda',               dial: '+250', flag: '🇷🇼' },
  { code: 'ST', name: 'São Tomé & Príncipe',  dial: '+239', flag: '🇸🇹' },
  { code: 'SN', name: 'Senegal',              dial: '+221', flag: '🇸🇳' },
  { code: 'SC', name: 'Seychelles',           dial: '+248', flag: '🇸🇨' },
  { code: 'SL', name: 'Sierra Leone',         dial: '+232', flag: '🇸🇱' },
  { code: 'SO', name: 'Somalia',              dial: '+252', flag: '🇸🇴' },
  { code: 'ZA', name: 'South Africa',         dial: '+27',  flag: '🇿🇦' },
  { code: 'SS', name: 'South Sudan',          dial: '+211', flag: '🇸🇸' },
  { code: 'SD', name: 'Sudan',                dial: '+249', flag: '🇸🇩' },
  { code: 'TZ', name: 'Tanzania',             dial: '+255', flag: '🇹🇿' },
  { code: 'TG', name: 'Togo',                 dial: '+228', flag: '🇹🇬' },
  { code: 'TN', name: 'Tunisia',              dial: '+216', flag: '🇹🇳' },
  { code: 'UG', name: 'Uganda',               dial: '+256', flag: '🇺🇬' },
  { code: 'ZM', name: 'Zambia',               dial: '+260', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe',             dial: '+263', flag: '🇿🇼' },
  // Americas
  { code: 'AR', name: 'Argentina',            dial: '+54',  flag: '🇦🇷' },
  { code: 'BR', name: 'Brazil',               dial: '+55',  flag: '🇧🇷' },
  { code: 'CA', name: 'Canada',               dial: '+1',   flag: '🇨🇦' },
  { code: 'CL', name: 'Chile',                dial: '+56',  flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia',             dial: '+57',  flag: '🇨🇴' },
  { code: 'CU', name: 'Cuba',                 dial: '+53',  flag: '🇨🇺' },
  { code: 'MX', name: 'Mexico',               dial: '+52',  flag: '🇲🇽' },
  { code: 'PE', name: 'Peru',                 dial: '+51',  flag: '🇵🇪' },
  { code: 'US', name: 'United States',        dial: '+1',   flag: '🇺🇸' },
  { code: 'VE', name: 'Venezuela',            dial: '+58',  flag: '🇻🇪' },
  // Europe
  { code: 'AT', name: 'Austria',              dial: '+43',  flag: '🇦🇹' },
  { code: 'BE', name: 'Belgium',              dial: '+32',  flag: '🇧🇪' },
  { code: 'CN', name: 'China',                dial: '+86',  flag: '🇨🇳' },
  { code: 'HR', name: 'Croatia',              dial: '+385', flag: '🇭🇷' },
  { code: 'CZ', name: 'Czech Republic',       dial: '+420', flag: '🇨🇿' },
  { code: 'DK', name: 'Denmark',              dial: '+45',  flag: '🇩🇰' },
  { code: 'FI', name: 'Finland',              dial: '+358', flag: '🇫🇮' },
  { code: 'FR', name: 'France',               dial: '+33',  flag: '🇫🇷' },
  { code: 'DE', name: 'Germany',              dial: '+49',  flag: '🇩🇪' },
  { code: 'GR', name: 'Greece',               dial: '+30',  flag: '🇬🇷' },
  { code: 'HU', name: 'Hungary',              dial: '+36',  flag: '🇭🇺' },
  { code: 'IN', name: 'India',                dial: '+91',  flag: '🇮🇳' },
  { code: 'ID', name: 'Indonesia',            dial: '+62',  flag: '🇮🇩' },
  { code: 'IE', name: 'Ireland',              dial: '+353', flag: '🇮🇪' },
  { code: 'IL', name: 'Israel',               dial: '+972', flag: '🇮🇱' },
  { code: 'IT', name: 'Italy',                dial: '+39',  flag: '🇮🇹' },
  { code: 'JP', name: 'Japan',                dial: '+81',  flag: '🇯🇵' },
  { code: 'JO', name: 'Jordan',               dial: '+962', flag: '🇯🇴' },
  { code: 'KW', name: 'Kuwait',               dial: '+965', flag: '🇰🇼' },
  { code: 'LB', name: 'Lebanon',              dial: '+961', flag: '🇱🇧' },
  { code: 'MY', name: 'Malaysia',             dial: '+60',  flag: '🇲🇾' },
  { code: 'NL', name: 'Netherlands',          dial: '+31',  flag: '🇳🇱' },
  { code: 'NZ', name: 'New Zealand',          dial: '+64',  flag: '🇳🇿' },
  { code: 'NO', name: 'Norway',               dial: '+47',  flag: '🇳🇴' },
  { code: 'PK', name: 'Pakistan',             dial: '+92',  flag: '🇵🇰' },
  { code: 'PH', name: 'Philippines',          dial: '+63',  flag: '🇵🇭' },
  { code: 'PL', name: 'Poland',               dial: '+48',  flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal',             dial: '+351', flag: '🇵🇹' },
  { code: 'QA', name: 'Qatar',                dial: '+974', flag: '🇶🇦' },
  { code: 'RO', name: 'Romania',              dial: '+40',  flag: '🇷🇴' },
  { code: 'RU', name: 'Russia',               dial: '+7',   flag: '🇷🇺' },
  { code: 'SA', name: 'Saudi Arabia',         dial: '+966', flag: '🇸🇦' },
  { code: 'SG', name: 'Singapore',            dial: '+65',  flag: '🇸🇬' },
  { code: 'ZA', name: 'South Africa',         dial: '+27',  flag: '🇿🇦' },
  { code: 'KR', name: 'South Korea',          dial: '+82',  flag: '🇰🇷' },
  { code: 'ES', name: 'Spain',                dial: '+34',  flag: '🇪🇸' },
  { code: 'SE', name: 'Sweden',               dial: '+46',  flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland',          dial: '+41',  flag: '🇨🇭' },
  { code: 'TH', name: 'Thailand',             dial: '+66',  flag: '🇹🇭' },
  { code: 'TR', name: 'Turkey',               dial: '+90',  flag: '🇹🇷' },
  { code: 'AE', name: 'UAE',                  dial: '+971', flag: '🇦🇪' },
  { code: 'UA', name: 'Ukraine',              dial: '+380', flag: '🇺🇦' },
  { code: 'GB', name: 'United Kingdom',       dial: '+44',  flag: '🇬🇧' },
  { code: 'VN', name: 'Vietnam',              dial: '+84',  flag: '🇻🇳' },
  { code: 'AU', name: 'Australia',            dial: '+61',  flag: '🇦🇺' },
].filter((c, i, arr) => arr.findIndex(x => x.code === c.code) === i); // deduplicate

// Sorted list: priority countries first, then alphabetical
export const SORTED_COUNTRIES: Country[] = [
  ...PRIORITY.map(code => COUNTRIES.find(c => c.code === code)!).filter(Boolean),
  ...COUNTRIES.filter(c => !PRIORITY.includes(c.code)).sort((a, b) => a.name.localeCompare(b.name)),
];

function parsePhone(value: string): { dial: string; local: string } {
  if (!value) return { dial: '+255', local: '' };
  const match = SORTED_COUNTRIES.find(c => value.startsWith(c.dial));
  if (match) return { dial: match.dial, local: value.slice(match.dial.length).replace(/^\s+/, '') };
  if (value.startsWith('+')) return { dial: '+255', local: value };
  return { dial: '+255', local: value };
}

interface Props {
  value: string;
  onChange: (full: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function PhoneInput({ value, onChange, placeholder = '712 345 678', required, className = '' }: Props) {
  const { dial: initDial, local: initLocal } = parsePhone(value);
  const [dial, setDial] = useState(initDial);
  const [local, setLocal] = useState(initLocal);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Sync if value changes externally (e.g. reset)
  useEffect(() => {
    const { dial: d, local: l } = parsePhone(value);
    setDial(d);
    setLocal(l);
  }, [value]); // eslint-disable-line

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDialSelect = (country: Country) => {
    setDial(country.dial);
    setOpen(false);
    setSearch('');
    onChange(country.dial + local.replace(/\D/g, ''));
  };

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d\s\-()]/g, '');
    setLocal(raw);
    onChange(dial + raw.replace(/\D/g, ''));
  };

  const selected = SORTED_COUNTRIES.find(c => c.dial === dial) ?? SORTED_COUNTRIES[0];

  const filtered = SORTED_COUNTRIES.filter(c => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase().includes(q);
  });

  return (
    <div className={`flex gap-0 rounded-xl border border-earth-200 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 overflow-visible bg-white transition-colors ${className}`} ref={dropRef}>
      {/* Dial code button */}
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 px-3 h-full border-r border-earth-200 text-sm font-medium text-earth-700 hover:bg-earth-50 transition-colors rounded-l-xl"
        >
          <span className="text-base leading-none">{selected.flag}</span>
          <span className="text-earth-500 font-mono text-xs">{selected.dial}</span>
          <ChevronDown size={12} className={`text-earth-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-xl border border-earth-200 shadow-lg z-50 overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-earth-100">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-earth-400" />
                <input
                  ref={searchRef}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-earth-200 rounded-lg focus:outline-none focus:border-primary-400"
                  placeholder="Search country or code…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
            {/* Priority header */}
            {!search && (
              <div className="px-3 py-1.5 text-[10px] font-bold text-earth-400 uppercase tracking-wide">
                Frequently Used
              </div>
            )}
            <div className="max-h-56 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-4 py-3 text-sm text-earth-400 text-center">No results</div>
              ) : (
                filtered.map((c, idx) => {
                  const isPriorityEnd = !search && idx === PRIORITY.length - 1;
                  const isFirstNonPriority = !search && idx === PRIORITY.length;
                  return (
                    <div key={c.code + c.dial}>
                      {isFirstNonPriority && (
                        <div className="px-3 py-1.5 text-[10px] font-bold text-earth-400 uppercase tracking-wide border-t border-earth-50">
                          All Countries
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDialSelect(c)}
                        className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-primary-50 text-left transition-colors ${
                          c.dial === dial ? 'bg-primary-50 text-primary-700' : 'text-earth-700'
                        } ${isPriorityEnd ? 'border-b border-earth-100' : ''}`}
                      >
                        <span className="text-xl leading-none w-7 text-center">{c.flag}</span>
                        <span className="flex-1 text-sm truncate">{c.name}</span>
                        <span className="font-mono text-xs text-earth-400 shrink-0">{c.dial}</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Local number input */}
      <input
        type="tel"
        inputMode="tel"
        className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none rounded-r-xl text-earth-900 placeholder-earth-300 min-w-0"
        placeholder={placeholder}
        value={local}
        onChange={handleLocalChange}
        required={required}
      />
    </div>
  );
}
