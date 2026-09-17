import { Label, Select } from "@/components/ui";
import { currentPeriod, parsePeriod, periodYearOptions } from "@/lib/scoring";

export function PeriodFields({
  period,
  idPrefix = "",
}: {
  period?: string | null;
  idPrefix?: string;
}) {
  const now = new Date();
  const parsed = parsePeriod(period) ?? parsePeriod(currentPeriod(now))!;
  const years = periodYearOptions(now);
  if (!years.includes(parsed.year)) {
    years.push(parsed.year);
    years.sort((a, b) => a - b);
  }

  const yearId = `${idPrefix}year`;
  const quarterId = `${idPrefix}quarter`;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <Label htmlFor={yearId}>Year</Label>
        <Select id={yearId} name="year" defaultValue={String(parsed.year)} required>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor={quarterId}>Quarter</Label>
        <Select id={quarterId} name="quarter" defaultValue={String(parsed.quarter)} required>
          {[1, 2, 3, 4].map((quarter) => (
            <option key={quarter} value={quarter}>
              Q{quarter}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
