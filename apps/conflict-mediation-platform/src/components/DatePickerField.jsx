import React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Calendar } from './ui/calendar';

const DatePickerField = ({ id, label, value, onChange, error, description }) => {
  const selected = value ? new Date(value) : undefined;
  
  return (
    <div className="form-field">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`
              date-picker-button w-full justify-start text-left font-normal h-11 px-3 py-2
              border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground
              focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
              focus-visible:border-primary transition-all duration-200
              ${!selected ? 'text-muted-foreground' : 'text-foreground'}
              ${error ? 'border-destructive focus-visible:ring-destructive' : ''}
              ${selected ? 'border-primary/60 bg-primary/5' : ''}
            `}
          >
            <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
            {selected ? format(selected, 'PPP') : 'Select date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 w-72 border-2 border-border shadow-xl backdrop-blur-sm"
          align="start"
          sideOffset={4}
        >
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => onChange(date ? format(date, 'yyyy-MM-dd') : '')}
            initialFocus
            className="rounded-lg w-full"
          />
        </PopoverContent>
      </Popover>
      {description && (
        <p className="form-description">{description}</p>
      )}
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
    </div>
  );
};

export default DatePickerField;
