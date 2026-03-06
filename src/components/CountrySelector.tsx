import { Tables } from '@/integrations/supabase/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Country = Tables<'countries'>;

interface CountrySelectorProps {
  label: string;
  value: string | null;
  onChange: (value: string) => void;
  countries: Country[];
  disabledIds: (string | null)[];
  disabled?: boolean;
  badge?: string;
}

export function CountrySelector({
  label,
  value,
  onChange,
  countries,
  disabledIds,
  disabled = false,
  badge,
}: CountrySelectorProps) {
  const availableCountries = countries.filter(
    (c) => c.id === value || !disabledIds.includes(c.id)
  );

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg gradient-eurovision text-primary-foreground font-display font-bold text-sm shrink-0">
        {badge}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <Select value={value ?? ''} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger className="bg-secondary border-0 h-9">
            <SelectValue placeholder="Välj land..." />
          </SelectTrigger>
          <SelectContent>
            {availableCountries.map((country) => (
              <SelectItem key={country.id} value={country.id}>
                <span className="flex items-center gap-2">
                  <span className="text-lg">{country.flag_emoji}</span>
                  <span>{country.country_name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
