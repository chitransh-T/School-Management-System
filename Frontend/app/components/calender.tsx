"use client";
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Calendar = () => {
  // State for tracking current date and displayed month
  const [currentDate, setCurrentDate] = useState(new Date());
  const [displayedMonth, setDisplayedMonth] = useState(new Date());

  // Update current date every minute to ensure it stays current
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, []);

  // Get month and year strings
  const monthNames = ["January", "February", "March", "April", "May", "June", 
                      "July", "August", "September", "October", "November", "December"];
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  
  const month = monthNames[displayedMonth.getMonth()];
  const year = displayedMonth.getFullYear();

  // Navigation functions
  const goToPreviousMonth = () => {
    setDisplayedMonth(new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setDisplayedMonth(new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 1));
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), 1).getDay();
    
    // Get days from previous month to fill the first row
    const daysInPreviousMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), 0).getDate();
    const previousMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) => ({
      day: daysInPreviousMonth - firstDayOfMonth + i + 1,
      currentMonth: false,
      previousMonth: true,
      nextMonth: false
    }));
    
    // Current month days
    const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      currentMonth: true,
      previousMonth: false,
      nextMonth: false
    }));
    
    // Combine days and add days from next month if needed to complete the grid
    const totalDaysShown = 42; // 6 rows of 7 days
    const allDays = [...previousMonthDays, ...currentMonthDays];
    const nextMonthDays = Array.from({ length: totalDaysShown - allDays.length }, (_, i) => ({
      day: i + 1,
      currentMonth: false,
      previousMonth: false,
      nextMonth: true
    }));
    
    return [...allDays, ...nextMonthDays];
  };

  // Check if a day is today
  const isToday = (day: number, isCurrentMonth: boolean) => {
    return (
      isCurrentMonth &&
      day === currentDate.getDate() &&
      displayedMonth.getMonth() === currentDate.getMonth() &&
      displayedMonth.getFullYear() === currentDate.getFullYear()
    );
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="bg-white rounded-lg  p-4 aspect-square w-full h-full flex flex-col">
      {/* Calendar Header */}
      <div className="text-center mb-2">
        <div className="text-xl font-bold text-blue-500">
          {month.toUpperCase()} , {year}
        </div>
        <div className="text-xs text-gray-500">
          {month.toUpperCase()} {currentDate.getDate()} {year}
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between text-gray-500 items-center mb-2">
        <button 
          onClick={goToPreviousMonth}
          className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <button 
          onClick={goToNextMonth}
          className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      
      {/* Days of Week */}
      <div className="grid grid-cols-7 text-center mb-1">
        {dayNames.map((day, index) => (
          <div 
            key={index} 
            className={`py-1 text-xs font-medium ${index === 0 || index === 6 ? 'text-blue-500' : 'text-gray-700'}`}
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 flex-1">
        {calendarDays.map((dayObj, index) => (
          <div 
            key={index} 
            className={`
              flex items-center justify-center text-xs rounded-md
              ${isToday(dayObj.day, dayObj.currentMonth) 
                ? 'bg-pink-100 border border-pink-500 text-pink-500 font-bold' 
                : dayObj.currentMonth 
                  ? 'text-blue-500 hover:bg-gray-100' 
                  : 'text-gray-400'
              }
            `}
          >
            {dayObj.day}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;