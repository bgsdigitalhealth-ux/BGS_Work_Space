// Calendar & Real Date Scan Utilities

export interface CalendarDay {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasAppointments: boolean;
  appointmentCount: number;
}

export const normalizeDateStr = (raw?: string | null): string | null => {
  if (!raw) return null;
  const s = String(raw).trim();
  // Match standard YYYY-MM-DD
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  }
  // Try Date parsing
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${da}`;
  }
  return null;
};

export const getMonthName = (monthIndex: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthIndex] || '';
};

export const formatDateDisplay = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  const normalized = normalizeDateStr(dateStr);
  if (!normalized) return dateStr;
  const [y, m, d] = normalized.split('-');
  const monthName = getMonthName(parseInt(m, 10) - 1).slice(0, 3);
  return `${parseInt(d, 10)} ${monthName} ${y}`;
};

export const generateCalendarMonth = (
  year: number,
  monthIndex: number, // 0 - 11
  appointmentDates: Set<string>,
  appointmentCounts?: Map<string, number>
): {
  paddingDays: number;
  days: CalendarDay[];
  monthName: string;
  year: number;
} => {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const firstDayOfWeek = new Date(year, monthIndex, 1).getDay(); // 0 (Sun) to 6 (Sat)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const days: CalendarDay[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dateObj = new Date(year, monthIndex, d);
    const hasEvents = appointmentDates.has(dateStr);
    const count = appointmentCounts?.get(dateStr) || (hasEvents ? 1 : 0);

    days.push({
      date: dateObj,
      dateStr,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      hasAppointments: hasEvents,
      appointmentCount: count
    });
  }

  return {
    paddingDays: firstDayOfWeek,
    days,
    monthName: getMonthName(monthIndex),
    year
  };
};
