
export enum FacultyStatus {
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  ON_LEAVE = 'ON_LEAVE'
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  label?: string;
}

export interface DaySchedule {
  day: string;
  slots: TimeSlot[];
  isDayOff?: boolean;
}

export interface WeeklySchedule {
  id?: string;
  days: DaySchedule[];
}

export interface DateOverride {
  id?: string;
  date: string;
  slots: TimeSlot[];
  isDayOff?: boolean;
  note?: string;
}

export interface FacultyAvailability {
  status: FacultyStatus;
  nextAvailableAt?: string;
  lastUpdated?: string;
}

export interface Experience {
  role: string;
  years: string;
  institution: string;
}

export interface Publication {
  title: string;
  isbn?: string;
  date: string;
}

export interface Faculty {
  id: string;
  name: string;
  email: string;
  department?: string;
  designation?: string;
  role: string;
  image: string;

  // Real-time Availability
  availability?: FacultyAvailability;

  // Schedules
  weeklySchedule?: WeeklySchedule;
  dateOverrides?: DateOverride[];

  // Legacy/Profile Fields
  bio?: string;
  researchInterests?: string[];
  education?: string;
  experience?: Experience[];
  publications?: Publication[];
}

export interface BroadcastMessage {
  id: string;
  faculty?: {
    id: string;
    name: string;
    image?: string;
  };
  facultyName?: string; // Legacy
  message: string;
  department?: string;
  targetSemester?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Appointment {
  id: string;
  student?: {
    id: string;
    name: string;
    email?: string;
    enrollmentNo?: string;
  };
  faculty?: {
    id: string;
    name: string;
  };
  // Flattened for easy access if needed, but nested preferred
  facultyId?: string;
  studentId?: string;
  facultyName?: string;
  studentName?: string;

  date: string;
  startTime: string;
  endTime: string;
  subject: string;

  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed' | 'Cancelled';
  reason?: string; // Alias for subject or legacy
}

export interface StudentProfile {
  name: string;
  email: string;
  enrollmentNo: string;
  department: string;
  semester: number;
  phone: string;
  avatar: string;
}

export interface LeaveRequest {
  id: string;
  type: 'Medical' | 'Personal' | 'Academic' | 'Other';
  startDate: Date;
  endDate: Date;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  timestamp: number;
}

export interface StudentNotification {
  id: string;
  title: string;
  message: string;
  type: 'AVAILABILITY' | 'SYSTEM' | 'APPOINTMENT';
  timestamp: number;
  isRead: boolean;
  facultyImage?: string;
}

export enum UserRole {
  STUDENT = 'STUDENT',
  FACULTY = 'FACULTY',
}

export enum DashboardView {
  OVERVIEW = 'OVERVIEW',
  FACULTY_LIST = 'FACULTY_LIST',
  APPOINTMENTS = 'APPOINTMENTS',
  PROFILE = 'PROFILE',
  LEAVE_REQUEST = 'LEAVE_REQUEST',
  CHATBOT = 'CHATBOT',
  BROADCASTS = 'BROADCASTS',
  FACULTY_PROFILE = 'FACULTY_PROFILE',
  NOTIFICATIONS = 'NOTIFICATIONS',
  SCHEDULE = 'SCHEDULE', // New View
  NOTES = 'NOTES', // New View
}

export interface NotificationRequest {
  id: string;
  studentId: string;
  facultyId: string;
  facultyName: string;
  timestamp: number;
}
