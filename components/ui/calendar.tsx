"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, DropdownProps as RDPDropdownProps, ChevronProps as DayPickerChevronProps } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  month: controlledMonth,
  onMonthChange: parentOnMonthChange,
  defaultMonth,
  ...props
}: CalendarProps) {
  const initialDate = controlledMonth || defaultMonth || new Date();
  const [currentDisplayMonth, setCurrentDisplayMonth] = React.useState<Date>(initialDate);

  React.useEffect(() => {
    if (controlledMonth) {
      setCurrentDisplayMonth(controlledMonth);
    }
  }, [controlledMonth]);

  const handleMonthChange = (newMonth: Date) => {
    if (!controlledMonth) {
      setCurrentDisplayMonth(newMonth);
    }
    if (parentOnMonthChange) {
      parentOnMonthChange(newMonth);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 + 11 }, (_, i) => currentYear + 10 - i);
  const localeForMonthNames = typeof props.locale === 'string' ? props.locale : undefined;
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: new Date(2000, i, 15).toLocaleString(localeForMonthNames, { month: 'long' }),
  }));

  return (
    <DayPicker
      month={currentDisplayMonth}
      onMonthChange={handleMonthChange}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        caption_dropdowns: "flex justify-center gap-1",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
        day_range_end: "day-range-end",
        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        vhidden: "hidden",
        dropdown: "rdp-dropdown",
        dropdown_month: "rdp-dropdown_month mx-1",
        dropdown_year: "rdp-dropdown_year mx-1",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...chevronProps }: DayPickerChevronProps) => {
          if (orientation === 'left') return <ChevronLeft className="h-4 w-4" {...chevronProps} />
          if (orientation === 'right') return <ChevronRight className="h-4 w-4" {...chevronProps} />
          return <></>
        },
        Dropdown: (dropdownProps: RDPDropdownProps) => {
          const { name, options, value } = dropdownProps; 

          const displayMonthToUse = currentDisplayMonth;
          const commonSelectClasses = cn(buttonVariants({ variant: "ghost" }), "h-auto px-2 py-1.5 font-medium");

          if (!displayMonthToUse) {
            const fallbackDropdownClasses = cn(
              classNames?.dropdown,
              name === 'months' ? classNames?.dropdown_month : classNames?.dropdown_year
            );
            return <div className={fallbackDropdownClasses} />;
          }

          if (name === "months") {
            const monthTriggerLabel = displayMonthToUse.toLocaleString(localeForMonthNames, { month: 'long' });
            return (
              <Select
                value={String(value ?? displayMonthToUse.getMonth())}
                onValueChange={(newMonthValue) => {
                  const newDate = new Date(displayMonthToUse);
                  newDate.setMonth(parseInt(newMonthValue, 10));
                  handleMonthChange(newDate);
                }}
                disabled={dropdownProps.disabled}
              >
                <SelectTrigger className={cn(commonSelectClasses, classNames?.dropdown_month)}>
                  <SelectValue>{monthTriggerLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <ScrollArea className="h-full">
                    {(options && options.length > 0 ? options : months).map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={String(opt.value)}
                        className="cursor-pointer"
                        aria-label={opt.label}
                        disabled={(opt as any).disabled}
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            );
          }

          if (name === "years") {
            const yearTriggerLabel = String(displayMonthToUse.getFullYear());
            return (
              <Select
                value={String(value ?? displayMonthToUse.getFullYear())}
                onValueChange={(newYearValue) => {
                  const newDate = new Date(displayMonthToUse);
                  newDate.setFullYear(parseInt(newYearValue, 10));
                  handleMonthChange(newDate);
                }}
                disabled={dropdownProps.disabled}
              >
                <SelectTrigger className={cn(commonSelectClasses, classNames?.dropdown_year)}>
                  <SelectValue>{yearTriggerLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <ScrollArea className="h-full">
                    {(options && options.length > 0 ? options : years.map(y => ({ value: y, label: String(y) }))).map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={String(opt.value)}
                        className="cursor-pointer"
                        aria-label={String(opt.label)}
                        disabled={(opt as any).disabled}
                      >
                        {String(opt.label)}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            );
          }

          return <></>;
        },
      }}
      // MODIFIED: Changed "dropdown-buttons" to "dropdown"
      captionLayout="dropdown"
      fromYear={1900}
      toYear={currentYear + 10}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar"
export { Calendar }