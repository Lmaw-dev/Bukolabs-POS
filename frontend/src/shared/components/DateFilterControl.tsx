import { useRef } from 'react';

export type DateFilterMode = 'date' | 'week' | 'month' | 'year';

interface DateFilterControlProps {
  mode: DateFilterMode;
  selectedDate: string;
  onModeChange: (mode: DateFilterMode) => void;
  onDateChange: (date: string) => void;
  className?: string;
}

export function DateFilterControl({
  mode,
  selectedDate,
  onModeChange,
  onDateChange,
  className = '',
}: DateFilterControlProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const openDatePicker = () => {
    onModeChange('date');
    const input = dateInputRef.current;
    if (!input) return;

    if (typeof input.showPicker === 'function') {
      input.showPicker();
    } else {
      input.click();
    }
  };

  return (
    <div className="relative inline-flex">
      <select
        value={mode}
        onChange={(event) => {
          const nextMode = event.target.value as DateFilterMode;
          if (nextMode === 'date') {
            openDatePicker();
            return;
          }
          onModeChange(nextMode);
        }}
        className={className}
      >
        <option value="date">Selected Date</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
        <option value="year">This Year</option>
      </select>
      <input
        ref={dateInputRef}
        type="date"
        value={selectedDate}
        onChange={(event) => {
          onDateChange(event.target.value);
          onModeChange('date');
        }}
        className="pointer-events-none absolute left-0 top-full h-px w-px opacity-0"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
