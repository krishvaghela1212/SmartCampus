import React, { useState, useEffect } from 'react';
import { Faculty } from '../types';
import { X, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, CheckCircle2, User, Mail, FileText, Users, Plus, CalendarPlus } from 'lucide-react';

interface BookingModalProps {
  faculty: Faculty;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (appointmentData: { date: Date; time: string; purpose: string }) => void;
}

// Helper to generate calendar days
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const BookingModal: React.FC<BookingModalProps> = ({ faculty, isOpen, onClose, onConfirm }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    reason: ''
  });
  const [guestInput, setGuestInput] = useState('');
  const [guests, setGuests] = useState<string[]>([]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedDate(null);
      setSelectedTime(null);
      setFormData({ name: '', email: '', reason: '' });
      setGuests([]);
      setGuestInput('');
    }
  }, [isOpen]);

  // Generate Time Slots based on Faculty Schedule & Overrides
  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([]);
      return;
    }

    // Use local date parts to avoid UTC shift issues
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    let slotsFound: string[] = [];
    
    // 1. Check for specific date override first
    const override = faculty.dateOverrides?.find(o => {
      const oDateVal = typeof o.date === 'string' ? o.date : new Date(o.date).toISOString();
      const oDateParts = oDateVal.split('T')[0];
      return oDateParts === dateStr;
    });

    if (override) {
      if (!override.isDayOff) {
        override.slots.forEach(slot => {
          let current = new Date(`2000-01-01T${slot.startTime}`);
          const end = new Date(`2000-01-01T${slot.endTime}`);
          while (current < end) {
            slotsFound.push(current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
            current.setMinutes(current.getMinutes() + 30);
          }
        });
      }
    } else if (faculty.weeklySchedule?.days) {
      // 2. Fallback to weekly schedule
      const dayName = DAYS[selectedDate.getDay()];
      const daySchedule = faculty.weeklySchedule.days.find(s => s.day.toUpperCase().startsWith(dayName.toUpperCase()));

      if (daySchedule && !daySchedule.isDayOff) {
        daySchedule.slots.forEach(slot => {
          let current = new Date(`2000-01-01T${slot.startTime}`);
          const end = new Date(`2000-01-01T${slot.endTime}`);
          while (current < end) {
            slotsFound.push(current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
            current.setMinutes(current.getMinutes() + 30);
          }
        });
      }
    }

    // 3. Smart Fallback: If no slots in schedule/overrides but status is AVAILABLE
    if (slotsFound.length === 0 && (faculty.availability?.status === 'AVAILABLE' || (faculty as any).currentStatus === 'AVAILABLE')) {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      if (dateStr === todayStr) {
        const nextAt = faculty.availability?.nextAvailableAt || (faculty as any).nextAvailableAt;
        let startTime = '09:00'; 
        
        if (nextAt) {
          const nextDate = isNaN(Number(nextAt)) ? new Date(nextAt) : new Date(Number(nextAt));
          if (!isNaN(nextDate.getTime())) {
            // Check if nextAvailable is actually in the future
            if (nextDate.getTime() > now.getTime()) {
              startTime = nextDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            } else {
              now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30);
              startTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            }
          }
        } else {
          now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30);
          startTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        }

        let current = new Date(`2000-01-01T${startTime}`);
        for (let i = 0; i < 4; i++) {
          slotsFound.push(current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
          current.setMinutes(current.getMinutes() + 30);
        }
      }
    }

    setAvailableSlots(slotsFound);
  }, [selectedDate, faculty.weeklySchedule, faculty.dateOverrides, faculty.availability]);

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear();
  };

  const isSelected = (day: number) => {
    return selectedDate?.getDate() === day &&
      selectedDate?.getMonth() === currentDate.getMonth() &&
      selectedDate?.getFullYear() === currentDate.getFullYear();
  };

  const handleAddGuest = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && guestInput.trim()) {
      e.preventDefault();
      if (!guests.includes(guestInput.trim())) {
        setGuests([...guests, guestInput.trim()]);
      }
      setGuestInput('');
    }
  };

  const removeGuest = (guest: string) => {
    setGuests(guests.filter(g => g !== guest));
  };

  const handleSubmit = () => {
    if (selectedDate && selectedTime) {
      onConfirm({
        date: selectedDate,
        time: selectedTime,
        purpose: formData.reason
      });
      setStep(3);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-bgPrimary w-full max-w-lg rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-5 border-b border-border flex justify-between items-center bg-bgSecondary/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-accent shadow-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-textPrimary">Book Appointment</h2>
              <p className="text-xs text-textSecondary">{faculty.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bgSecondary rounded-full text-textSecondary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">

          {/* STEP 1: CALENDAR & TIME */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Calendar Control */}
              <div className="bg-card/50 rounded-2xl p-4 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-textPrimary text-lg">
                    {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h3>
                  <div className="flex space-x-1">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-bgSecondary rounded-lg text-textSecondary transition-colors">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-bgSecondary rounded-lg text-textSecondary transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {DAYS.map(day => (
                    <div key={day} className="text-[10px] font-bold text-textSecondary uppercase tracking-wider py-2">{day}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, i) => {
                    const day = i + 1;
                    const selected = isSelected(day);
                    const today = isToday(day);

                    return (
                      <button
                        key={day}
                        onClick={() => {
                          setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
                          setSelectedTime(null);
                        }}
                        className={`
                          h-10 w-10 mx-auto rounded-full flex items-center justify-center text-sm transition-all duration-200
                          ${selected
                            ? 'bg-accent text-bgPrimary font-bold shadow-lg shadow-accent/20 scale-110'
                            : 'text-textPrimary hover:bg-bgSecondary'}
                          ${today && !selected ? 'ring-1 ring-accent text-accent' : ''}
                        `}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div className="animate-in slide-in-from-bottom-2 duration-300">
                  <h3 className="text-sm font-semibold text-textPrimary mb-3 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-accent" />
                    Available Slots
                  </h3>

                  {availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {availableSlots.map(time => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`
                            py-3 px-2 text-sm rounded-xl border transition-all duration-200
                            ${selectedTime === time
                              ? 'bg-accent border-accent text-bgPrimary font-bold shadow-md'
                              : 'bg-bgSecondary/30 border-border text-textSecondary hover:border-textPrimary hover:text-textPrimary hover:bg-bgSecondary'}
                          `}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 bg-bgSecondary/30 rounded-2xl border border-border border-dashed">
                      <Clock className="w-8 h-8 text-textSecondary mb-2 opacity-50" />
                      <p className="text-sm text-textSecondary font-medium">No slots available</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: DETAILS FORM */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              {/* Summary Header */}
              <div className="bg-bgSecondary/50 p-5 rounded-2xl border border-border flex justify-between items-center">
                <div>
                  <div className="flex items-center text-sm text-textSecondary mb-1">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {selectedDate?.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                  </div>
                  <div className="flex items-center text-xl font-bold text-accent">
                    <Clock className="w-5 h-5 mr-2" />
                    {selectedTime}
                  </div>
                </div>
                <div className="text-xs text-textSecondary bg-bgPrimary px-3 py-1 rounded-full border border-border">
                  {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </div>
              </div>

              <div className="space-y-5">
                <div className="group">
                  <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-textSecondary group-focus-within:text-accent transition-colors" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-12 pr-4 py-3.5 bg-card border border-border rounded-xl text-sm text-textPrimary focus:ring-1 focus:ring-accent focus:border-accent outline-none transition-all"
                      placeholder="Mark Kim Jun"
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-textSecondary group-focus-within:text-accent transition-colors" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-12 pr-4 py-3.5 bg-card border border-border rounded-xl text-sm text-textPrimary focus:ring-1 focus:ring-accent focus:border-accent outline-none transition-all"
                      placeholder="kimjun@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">Guests (Optional)</label>
                  <div className="bg-card border border-border rounded-xl p-2 focus-within:ring-1 focus-within:ring-accent focus-within:border-accent transition-all">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {guests.map((guest, idx) => (
                        <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-bgSecondary text-textPrimary border border-border">
                          {guest}
                          <button onClick={() => removeGuest(guest)} className="ml-1.5 hover:text-error"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                    <div className="relative">
                      <Users className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-textSecondary" />
                      <input
                        type="text"
                        value={guestInput}
                        onChange={(e) => setGuestInput(e.target.value)}
                        onKeyDown={handleAddGuest}
                        className="w-full pl-9 pr-4 py-1.5 bg-transparent border-none text-sm text-textPrimary focus:ring-0 placeholder:text-textSecondary/50"
                        placeholder="Type email & hit Enter"
                      />
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">Description (Optional)</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-4 w-5 h-5 text-textSecondary group-focus-within:text-accent transition-colors" />
                    <textarea
                      value={formData.reason}
                      onChange={e => setFormData({ ...formData, reason: e.target.value })}
                      className="w-full pl-12 pr-4 py-3.5 bg-card border border-border rounded-xl text-sm text-textPrimary focus:ring-1 focus:ring-accent focus:border-accent outline-none transition-all min-h-[100px]"
                      placeholder="Project requirements..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-8 animate-in zoom-in-95 duration-300">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full"></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-accent to-accentHover rounded-full flex items-center justify-center shadow-2xl shadow-accent/30">
                  <CheckCircle2 className="w-12 h-12 text-bgPrimary" />
                </div>
              </div>

              <h3 className="text-2xl font-bold text-textPrimary mb-2">Confirmed</h3>
              <p className="text-textSecondary text-sm mb-8 text-center">
                You are scheduled with <span className="text-textPrimary font-semibold">{faculty.name}</span>
              </p>

              <button className="flex items-center space-x-2 px-5 py-2.5 bg-bgSecondary hover:bg-card border border-border rounded-xl text-sm font-medium text-textPrimary transition-all mb-8">
                <CalendarPlus className="w-4 h-4 text-accent" />
                <span>Add to Calendar</span>
              </button>

              <div className="w-full bg-card rounded-2xl border border-border p-6 shadow-lg">
                <h4 className="text-sm font-bold text-textPrimary mb-4 border-b border-border pb-2">30 Minute Meeting</h4>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 text-accent mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-semibold text-textPrimary">{selectedTime} - {selectedTime?.split(':')[0]}:30</p>
                      <p className="text-xs text-textSecondary">{selectedDate?.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <User className="w-5 h-5 text-textSecondary mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-textPrimary">{formData.name}</p>
                      <p className="text-xs text-textSecondary">{formData.email}</p>
                    </div>
                  </div>

                  {guests.length > 0 && (
                    <div className="flex items-start">
                      <Users className="w-5 h-5 text-textSecondary mt-0.5 mr-3" />
                      <div className="flex flex-wrap gap-1">
                        {guests.map((g, i) => (
                          <div key={i} className="w-6 h-6 rounded-full bg-bgSecondary border border-border flex items-center justify-center text-[10px] text-textSecondary" title={g}>
                            {g.charAt(0).toUpperCase()}
                          </div>
                        ))}
                        <span className="text-xs text-textSecondary self-center ml-1">{guests.length} Guests</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-border bg-bgSecondary/30 backdrop-blur-sm">
          {step === 1 && (
            <button
              onClick={() => setStep(2)}
              disabled={!selectedTime}
              className="w-full py-3.5 bg-accent text-bgPrimary rounded-xl font-bold hover:bg-accentHover disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.01] shadow-lg shadow-accent/20"
            >
              Continue
            </button>
          )}
          {step === 2 && (
            <div className="flex space-x-3">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 py-3.5 bg-transparent border border-border text-textSecondary rounded-xl font-semibold hover:bg-bgSecondary hover:text-textPrimary transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.name || !formData.email}
                className="flex-1 py-3.5 bg-accent text-bgPrimary rounded-xl font-bold hover:bg-accentHover disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.01] shadow-lg shadow-accent/20"
              >
                Confirm Booking
              </button>
            </div>
          )}
          {step === 3 && (
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-accent text-bgPrimary rounded-xl font-bold hover:bg-accentHover transition-all shadow-lg shadow-accent/20"
            >
              Back to Home
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
