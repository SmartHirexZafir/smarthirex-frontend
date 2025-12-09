// app/test/Components/DateTimePicker.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

type Props = {
  value: string; // ISO string or empty
  onChange: (isoString: string) => void;
  min?: string; // ISO string for min date
  placeholder?: string;
};

export default function DateTimePicker({ value, onChange, min, placeholder = "Select date and time" }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
  const [selectedHour, setSelectedHour] = useState<number>(value ? (new Date(value).getHours() % 12 || 12) : 12);
  const [selectedMinute, setSelectedMinute] = useState<number>(value ? new Date(value).getMinutes() : 0);
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">(value ? (new Date(value).getHours() >= 12 ? "PM" : "AM") : "PM");
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate || new Date());
  
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hourScrollRef = useRef<HTMLDivElement>(null);
  const minuteScrollRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);

  // Calculate dropdown position
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset;
      const scrollX = window.scrollX || window.pageXOffset;
      
      setDropdownPosition({
        top: rect.bottom + scrollY + 8,
        left: rect.left + scrollX,
      });
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current && 
        !pickerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Auto-scroll time selectors to selected values when opened
  useEffect(() => {
    if (isOpen) {
      // Scroll hour selector
      setTimeout(() => {
        if (hourScrollRef.current) {
          const selectedHourElement = hourScrollRef.current.querySelector(`[data-hour="${selectedHour}"]`) as HTMLElement;
          if (selectedHourElement) {
            selectedHourElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);

      // Scroll minute selector
      setTimeout(() => {
        if (minuteScrollRef.current) {
          const selectedMinuteElement = minuteScrollRef.current.querySelector(`[data-minute="${selectedMinute}"]`) as HTMLElement;
          if (selectedMinuteElement) {
            selectedMinuteElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 150);
    }
  }, [isOpen, selectedHour, selectedMinute]);

  // Update local state when value prop changes
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDate(date);
      setSelectedHour(date.getHours() % 12 || 12);
      setSelectedMinute(date.getMinutes());
      setSelectedPeriod(date.getHours() >= 12 ? "PM" : "AM");
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  const formatDisplayValue = (): string => {
    if (!selectedDate) return "";
    const date = selectedDate;
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    const hour12 = selectedHour % 12 || 12;
    const minute = String(selectedMinute).padStart(2, "0");
    return `${month}/${day}/${year} ${hour12}:${minute} ${selectedPeriod}`;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Update the combined date-time
    updateDateTime(date, selectedHour, selectedMinute, selectedPeriod);
  };

  const updateDateTime = (date: Date | null, hour: number, minute: number, period: "AM" | "PM") => {
    if (!date) return;
    
    const finalHour = period === "PM" ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);
    const newDate = new Date(date);
    newDate.setHours(finalHour, minute, 0, 0);
    
    onChange(newDate.toISOString());
  };

  const handleHourChange = (hour: number) => {
    setSelectedHour(hour);
    if (selectedDate) {
      updateDateTime(selectedDate, hour, selectedMinute, selectedPeriod);
    }
  };

  const handleMinuteChange = (minute: number) => {
    setSelectedMinute(minute);
    if (selectedDate) {
      updateDateTime(selectedDate, selectedHour, minute, selectedPeriod);
    }
  };

  const handlePeriodChange = (period: "AM" | "PM") => {
    setSelectedPeriod(period);
    if (selectedDate) {
      updateDateTime(selectedDate, selectedHour, selectedMinute, period);
    }
  };

  const handleClear = () => {
    setSelectedDate(null);
    onChange("");
    setIsOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedHour(today.getHours() % 12 || 12);
    setSelectedMinute(today.getMinutes());
    setSelectedPeriod(today.getHours() >= 12 ? "PM" : "AM");
    updateDateTime(today, today.getHours() % 12 || 12, today.getMinutes(), today.getHours() >= 12 ? "PM" : "AM");
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === "prev") {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isDisabled = (date: Date) => {
    if (!min) return false;
    const minDate = new Date(min);
    minDate.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < minDate;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const days = getDaysInMonth(currentMonth);

  const dropdownContent = isOpen && dropdownPosition ? (
    <div
      ref={dropdownRef}
      className="fixed z-[99999] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden
                  animate-fade-in backdrop-blur-sm"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        minWidth: '320px',
      }}
    >
          <div className="flex flex-col md:flex-row">
            {/* Calendar Section */}
            <div className="p-5 border-b md:border-b-0 md:border-r border-border bg-card">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => navigateMonth("prev")}
                  className="p-2 rounded-lg hover:bg-muted transition-all duration-200 hover:scale-110 active:scale-95"
                  aria-label="Previous month"
                >
                  <i className="ri-arrow-left-s-line text-lg text-foreground" />
                </button>
                <div className="flex items-center gap-2">
                  <select
                    value={currentMonth.getMonth()}
                    onChange={(e) => {
                      const newMonth = new Date(currentMonth);
                      newMonth.setMonth(parseInt(e.target.value));
                      setCurrentMonth(newMonth);
                    }}
                    className="bg-background border border-input rounded-lg px-2 py-1 text-sm font-medium text-foreground
                               focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {monthNames.map((month, idx) => (
                      <option key={idx} value={idx}>{month}</option>
                    ))}
                  </select>
                  <select
                    value={currentMonth.getFullYear()}
                    onChange={(e) => {
                      const newMonth = new Date(currentMonth);
                      newMonth.setFullYear(parseInt(e.target.value));
                      setCurrentMonth(newMonth);
                    }}
                    className="bg-background border border-input rounded-lg px-2 py-1 text-sm font-medium text-foreground
                               focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 1 + i).map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => navigateMonth("next")}
                  className="p-2 rounded-lg hover:bg-muted transition-all duration-200 hover:scale-110 active:scale-95"
                  aria-label="Next month"
                >
                  <i className="ri-arrow-right-s-line text-lg text-foreground" />
                </button>
              </div>

              {/* Day Labels */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map((day) => (
                  <div key={day} className="text-xs font-medium text-muted-foreground text-center py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((date, idx) => {
                  if (!date) {
                    return <div key={`empty-${idx}`} className="aspect-square" />;
                  }
                  const isTodayDate = isToday(date);
                  const isSelectedDate = isSelected(date);
                  const isDisabledDate = isDisabled(date);

                  return (
                    <button
                      key={date.toISOString()}
                      type="button"
                      onClick={() => !isDisabledDate && handleDateSelect(date)}
                      disabled={isDisabledDate}
                      className={`
                        aspect-square rounded-lg text-sm font-medium transition-all duration-200
                        ${isSelectedDate
                          ? "bg-primary text-primary-foreground shadow-md scale-105 ring-2 ring-primary/50"
                          : isTodayDate
                          ? "bg-info/20 text-info border-2 border-info/50 font-semibold hover:bg-info/30"
                          : isDisabledDate
                          ? "text-muted-foreground/30 cursor-not-allowed opacity-50"
                          : "text-foreground hover:bg-muted hover:scale-105 cursor-pointer active:scale-95"
                        }
                        ${!isDisabledDate && !isSelectedDate ? "hover:ring-2 hover:ring-primary/30" : ""}
                      `}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

              {/* Calendar Footer */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-muted-foreground hover:text-foreground transition-all duration-200 px-3 py-1.5 rounded-lg hover:bg-muted font-medium"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleToday}
                  className="text-xs text-primary hover:text-primary/80 transition-all duration-200 px-3 py-1.5 rounded-lg hover:bg-primary/10 font-medium hover:scale-105 active:scale-95"
                >
                  Today
                </button>
              </div>
            </div>

            {/* Time Picker Section */}
            <div className="p-5 bg-muted/30">
              <div className="text-xs font-medium text-muted-foreground mb-3 text-center">Select Time</div>
              
              <div className="flex items-center justify-center gap-2">
                {/* Hour Selector */}
                <div className="flex flex-col items-center">
                  <div className="text-xs text-muted-foreground mb-1 font-medium">Hour</div>
                  <div className="relative h-32 w-16 overflow-hidden rounded-lg border border-input bg-background shadow-inner">
                    <div 
                      ref={hourScrollRef}
                      className="absolute inset-0 flex flex-col overflow-y-auto scroll-smooth" 
                      style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--muted-foreground)) transparent' }}
                    >
                      {hours.map((hour) => (
                        <button
                          key={hour}
                          type="button"
                          data-hour={hour}
                          onClick={() => handleHourChange(hour)}
                          className={`
                            w-full py-2 text-sm font-medium transition-all duration-200
                            ${selectedHour === hour
                              ? "bg-primary text-primary-foreground scale-110 font-bold shadow-md"
                              : "text-foreground hover:bg-muted/50"
                            }
                          `}
                        >
                          {String(hour).padStart(2, "0")}
                        </button>
                      ))}
                    </div>
                    {/* Highlight overlay */}
                    <div className="absolute top-1/2 left-0 right-0 h-8 -translate-y-1/2 border-y-2 border-primary/30 pointer-events-none rounded" />
                    <div className="absolute top-1/2 left-0 right-0 h-8 -translate-y-1/2 bg-primary/5 pointer-events-none rounded" />
                  </div>
                </div>

                <div className="text-2xl font-bold text-foreground mt-6">:</div>

                {/* Minute Selector */}
                <div className="flex flex-col items-center">
                  <div className="text-xs text-muted-foreground mb-1 font-medium">Minute</div>
                  <div className="relative h-32 w-16 overflow-hidden rounded-lg border border-input bg-background shadow-inner">
                    <div 
                      ref={minuteScrollRef}
                      className="absolute inset-0 flex flex-col overflow-y-auto scroll-smooth" 
                      style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--muted-foreground)) transparent' }}
                    >
                      {minutes.map((minute) => (
                        <button
                          key={minute}
                          type="button"
                          data-minute={minute}
                          onClick={() => handleMinuteChange(minute)}
                          className={`
                            w-full py-2 text-sm font-medium transition-all duration-200
                            ${selectedMinute === minute
                              ? "bg-primary text-primary-foreground scale-110 font-bold shadow-md"
                              : "text-foreground hover:bg-muted/50"
                            }
                          `}
                        >
                          {String(minute).padStart(2, "0")}
                        </button>
                      ))}
                    </div>
                    {/* Highlight overlay */}
                    <div className="absolute top-1/2 left-0 right-0 h-8 -translate-y-1/2 border-y-2 border-primary/30 pointer-events-none rounded" />
                    <div className="absolute top-1/2 left-0 right-0 h-8 -translate-y-1/2 bg-primary/5 pointer-events-none rounded" />
                  </div>
                </div>

                {/* AM/PM Selector */}
                <div className="flex flex-col items-center">
                  <div className="text-xs text-muted-foreground mb-1 font-medium">Period</div>
                  <div className="relative h-32 w-14 overflow-hidden rounded-lg border border-input bg-background shadow-inner">
                    <div className="absolute inset-0 flex flex-col">
                      {(["AM", "PM"] as const).map((period) => (
                        <button
                          key={period}
                          type="button"
                          onClick={() => handlePeriodChange(period)}
                          className={`
                            flex-1 text-sm font-medium transition-all duration-200
                            ${selectedPeriod === period
                              ? "bg-primary text-primary-foreground scale-110 font-bold shadow-md"
                              : "text-foreground hover:bg-muted/50"
                            }
                          `}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                    {/* Highlight overlay */}
                    <div className="absolute top-1/2 left-0 right-0 h-8 -translate-y-1/2 border-y-2 border-primary/30 pointer-events-none rounded" />
                    <div className="absolute top-1/2 left-0 right-0 h-8 -translate-y-1/2 bg-primary/5 pointer-events-none rounded" />
                  </div>
                </div>
              </div>

              {/* Time Display */}
              <div className="mt-4 p-3 rounded-lg bg-background/50 border border-border text-center shadow-sm">
                <div className="text-xs text-muted-foreground mb-1 font-medium">Selected Time</div>
                <div className="text-lg font-mono font-bold text-primary">
                  {String(selectedHour).padStart(2, "0")}:{String(selectedMinute).padStart(2, "0")} {selectedPeriod}
                </div>
              </div>
            </div>
          </div>
        </div>
  ) : null;

  return (
    <>
      <div className="relative" ref={pickerRef}>
        {/* Input Field */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            readOnly
            value={formatDisplayValue()}
            placeholder={placeholder}
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-4 py-3 pr-10 rounded-xl bg-background border border-input text-foreground
                     focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                     transition-all duration-200 hover:border-primary/50 cursor-pointer
                     placeholder:text-muted-foreground"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <i className={`ri-calendar-line text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </div>
        </div>
      </div>

      {/* Picker Dropdown - Rendered via Portal */}
      {typeof window !== 'undefined' && dropdownContent && createPortal(dropdownContent, document.body)}
    </>
  );
}

