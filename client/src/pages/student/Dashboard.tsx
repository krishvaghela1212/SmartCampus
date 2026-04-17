import React, { useState, useMemo, useEffect } from 'react';
import { Faculty, BroadcastMessage, DashboardView, FacultyStatus, Appointment, StudentProfile, StudentNotification } from '@/types';
import { FacultyCard } from '@/components/FacultyCard';
import { BroadcastBoard } from '@/components/BroadcastBoard';
import { Chatbot } from '@/components/Chatbot';
import { BookingModal } from '@/components/BookingModal';
import { StudentProfileView } from '@/components/StudentProfile';

import { FacultyProfilePage } from '@/pages/common/FacultyProfile';
import { storageService } from '@/services/storageService';
import { useAuth } from '@/context/AuthContext';
import { LoadingFallback } from '@/App';
import { useMutation } from '@apollo/client/react';
import { BOOK_APPOINTMENT, REQUEST_NOTIFICATION } from '@/graphql/mutations';
import {
    Search, LayoutDashboard, Users, MessageCircle, Radio, LogOut,
    CheckCircle2, MinusCircle, Clock,
    User, ExternalLink, FileText,
    Bell, Mail, Sun, Moon, List, Calendar as CalendarIcon,
    ChevronLeft, ChevronRight, XCircle
} from 'lucide-react';
import { motion, Variants } from 'framer-motion';

const DEPARTMENTS = [
    'Computer Engineering',
    'Information Technology',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Chemical Engineering',
    'Electrical Engineering'
];

interface StudentDashboardProps {
    facultyList: Faculty[];
    broadcasts: BroadcastMessage[];
    appointments: Appointment[];
    onLogout: () => void;
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ facultyList, broadcasts, appointments, onLogout }) => {
    const { currentStudent, token, isLoading: authLoading } = useAuth();
    const [currentView, setCurrentView] = useState<DashboardView>(DashboardView.OVERVIEW);
    const [selectedDept, setSelectedDept] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isCalendarView, setIsCalendarView] = useState(false);
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const profile = currentStudent;

    const [notifications] = useState<StudentNotification[]>([]);
    const [bookingFaculty, setBookingFaculty] = useState<Faculty | null>(null);
    const [viewingFaculty, setViewingFaculty] = useState<Faculty | null>(null);

    useEffect(() => {
        // Initial theme check
        if (document.documentElement.classList.contains('light')) {
            setIsDarkMode(false);
        }
    }, []);

    if ((authLoading || !profile) && token) {
        return <LoadingFallback />;
    }

    if (!profile) return null;

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
        document.documentElement.classList.toggle('light');
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;
    const availableCount = facultyList.filter(f => f.availability?.status === FacultyStatus.AVAILABLE).length;
    const busyCount = facultyList.filter(f => f.availability?.status === FacultyStatus.BUSY).length;

    const filteredFaculty = useMemo(() => {
        const query = searchTerm.toLowerCase().trim();
        return facultyList.filter(f => {
            const matchesDept = selectedDept === 'All' || f.department === selectedDept;
            if (!matchesDept) return false;
            if (!query) return true;
            return (
                (f.name || '').toLowerCase().includes(query) ||
                (f.department || '').toLowerCase().includes(query) ||
                (f.designation || '').toLowerCase().includes(query) ||
                (f.email || '').toLowerCase().includes(query)
            );
        });
    }, [facultyList, selectedDept, searchTerm]);
    
    const filteredBroadcasts = useMemo(() => {
        return broadcasts.filter(b => 
            b.targetSemester === 'ALL' || 
            b.targetSemester === profile.semester?.toString()
        );
    }, [broadcasts, profile.semester]);

    const [bookAppointmentMutation] = useMutation(BOOK_APPOINTMENT);
    const [requestNotificationMutation] = useMutation(REQUEST_NOTIFICATION);

    const handleNotify = async (id: string) => {
        try {
            await requestNotificationMutation({
                variables: { facultyId: id }
            });
            alert(`Success: You will receive an email notification when this faculty becomes AVAILABLE.`);
        } catch (err: any) {
            alert(err.message || "Failed to request notification");
        }
    };

    const handleRequest = (id: string) => {
        const faculty = facultyList.find(f => f.id === id);
        if (faculty) setBookingFaculty(faculty);
    };

    const handleViewProfile = (faculty: Faculty) => {
        setViewingFaculty(faculty);
        setCurrentView(DashboardView.FACULTY_PROFILE);
    };

    const handleBookingConfirm = async (data: { date: Date; time: string; purpose: string }) => {
        if (bookingFaculty) {
            try {
                // Calculate endTime as 30 minutes after startTime
                const [hours, minutes] = data.time.split(':').map(Number);
                const endDate = new Date();
                endDate.setHours(hours, minutes + 30, 0, 0);
                const endTime = endDate.toTimeString().slice(0, 5); // "HH:MM"

                await bookAppointmentMutation({
                    variables: {
                        facultyId: bookingFaculty.id,
                        date: data.date.toISOString().split('T')[0],
                        startTime: data.time,
                        endTime: endTime,
                        subject: data.purpose || 'General Discussion'
                    }
                });
                setBookingFaculty(null);
                setCurrentView(DashboardView.APPOINTMENTS);
            } catch (err: any) {
                alert(err.message || "Failed to book appointment");
            }
        }
    };

    const handleDeleteAppointment = (id: string) => {
        if (window.confirm("Are you sure you want to cancel this appointment?")) {
            storageService.deleteAppointment(id);
        }
    };

    const handleProfileUpdate = (updatedProfile: StudentProfile) => {
        storageService.saveProfile(updatedProfile);
    };

    const handleOpenNotifications = () => {
        setCurrentView(DashboardView.NOTIFICATIONS);
        setTimeout(() => {
            storageService.markNotificationsRead();
        }, 1000);
    };

    const SidebarItem = ({ view, icon: Icon, label, badge }: { view: DashboardView, icon: any, label: string, badge?: number }) => (
        <button
            onClick={() => setCurrentView(view)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all mb-1 relative group ${currentView === view || (view === DashboardView.FACULTY_LIST && currentView === DashboardView.FACULTY_PROFILE)
                ? 'bg-accent text-bgPrimary font-bold shadow-lg shadow-accent/20'
                : 'text-textSecondary hover:text-textPrimary hover:bg-card'
                }`}
        >
            <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${currentView === view || (view === DashboardView.FACULTY_LIST && currentView === DashboardView.FACULTY_PROFILE)
                ? 'text-bgPrimary' : 'text-textSecondary'
                }`} />
            <span>{label}</span>
            {badge && badge > 0 && (
                <span className="absolute right-4 bg-error text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-bgSecondary">
                    {badge}
                </span>
            )}
        </button>
    );

    // Calendar Helper Logic
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const days = new Date(year, month + 1, 0).getDate();
        return { firstDay, days };
    };

    const { firstDay, days } = getDaysInMonth(calendarDate);
    const calendarGrid = useMemo(() => {
        const grid = [];
        for (let i = 0; i < firstDay; i++) grid.push(null);
        for (let i = 1; i <= days; i++) grid.push(i);
        return grid;
    }, [firstDay, days]);

    const appointmentsForDay = (day: number) => {
        return appointments.filter(apt => {
            const d = new Date(apt.date);
            return d.getDate() === day && d.getMonth() === calendarDate.getMonth() && d.getFullYear() === calendarDate.getFullYear();
        });
    };

    return (
        <div className="flex h-screen bg-bgPrimary overflow-hidden relative">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-bgSecondary border-b border-border flex items-center justify-between px-4 z-40">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center rotate-3">
                        <span className="text-bgPrimary font-bold text-lg -rotate-3">L</span>
                    </div>
                    <span className="text-sm font-bold text-textPrimary uppercase">SmartCampus</span>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 text-textSecondary hover:text-accent transition-colors"
                >
                  <List className="w-6 h-6" />
                </button>
            </div>

            {/* Mobile Sidebar Overlay */}
            <motion.div 
               initial={{ opacity: 0, x: -300 }}
               animate={{ opacity: isSidebarOpen ? 1 : 0, x: isSidebarOpen ? 0 : -300 }}
               className={`fixed inset-0 z-50 md:hidden ${isSidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
            >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
                <div className="absolute top-0 left-0 w-72 h-full bg-bgSecondary p-6 shadow-2xl border-r border-border">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center space-x-2">
                             <img src="/favicon.png" alt="Logo" className="w-6 h-6 object-contain" />
                             <span className="text-white font-bold">SmartCampus</span>
                        </div>
                        <button onClick={() => setIsSidebarOpen(false)}><XCircle className="text-textSecondary w-6 h-6" /></button>
                    </div>
                    
                    <nav className="space-y-2">
                        <SidebarItem view={DashboardView.OVERVIEW} icon={LayoutDashboard} label="Overview" onClick={() => setIsSidebarOpen(false)} />
                        <SidebarItem view={DashboardView.NOTIFICATIONS} icon={Bell} label="Inbox" badge={unreadCount} onClick={() => setIsSidebarOpen(false)} />
                        <SidebarItem view={DashboardView.FACULTY_LIST} icon={Users} label="Faculty Status" onClick={() => setIsSidebarOpen(false)} />
                        <SidebarItem view={DashboardView.FACULTY_FEED} icon={Radio} label="Live Feed" onClick={() => setIsSidebarOpen(false)} />
                        <SidebarItem view={DashboardView.PROFILE} icon={User} label="My Profile" onClick={() => setIsSidebarOpen(false)} />
                        
                        <div className="pt-6 mt-6 border-t border-border">
                            <button 
                              onClick={onLogout}
                              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-error hover:bg-error/10 transition-all font-medium"
                            >
                                <LogOut className="w-5 h-5" />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </nav>
                </div>
            </motion.div>

            {/* Desktop Sidebar */}
            <div className="w-64 bg-bgSecondary border-r border-border hidden md:flex flex-col p-4 shrink-0">
                <div className="flex items-center space-x-3 px-2 mb-8">
                    <div className="w-10 h-10 bg-white/5 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/10 transition-transform hover:scale-105">
                        <img src="/favicon.png" alt="Logo" className="w-7 h-7 object-contain" />
                    </div>
                    <div>
                        <span className="block text-base font-bold text-textPrimary tracking-tight leading-none">SmartCampus</span>
                        <span className="text-[10px] text-accent uppercase tracking-widest font-bold">L.D.C.E.</span>
                    </div>
                </div>

                <div className="mb-6 px-2 flex items-center space-x-3 pb-6 border-b border-border">
                    <div className="relative group cursor-pointer" onClick={() => setCurrentView(DashboardView.PROFILE)}>
                        <div className="w-12 h-12 rounded-2xl bg-bgPrimary border-2 border-border group-hover:border-accent flex items-center justify-center text-textSecondary group-hover:text-accent transition-all shadow-sm">
                            <User className="w-6 h-6" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent rounded-full border-2 border-bgSecondary shadow-sm"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-textPrimary truncate">{profile.name}</p>
                        <p className="text-[10px] text-textSecondary truncate font-mono tracking-tighter opacity-70 px-1 bg-bgPrimary/50 rounded inline-block">{profile.enrollmentNo}</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-hide pr-1">
                    <SidebarItem view={DashboardView.OVERVIEW} icon={LayoutDashboard} label="Overview" />
                    <SidebarItem view={DashboardView.NOTIFICATIONS} icon={Bell} label="Inbox" badge={unreadCount} />
                    <SidebarItem view={DashboardView.FACULTY_LIST} icon={Users} label="Faculty Status" />
                    <SidebarItem view={DashboardView.APPOINTMENTS} icon={CalendarIcon} label="Appointments" />

                    <SidebarItem view={DashboardView.PROFILE} icon={User} label="My Profile" />
                    <SidebarItem view={DashboardView.CHATBOT} icon={MessageCircle} label="AI Assistant" />
                    <SidebarItem view={DashboardView.BROADCASTS} icon={Radio} label="Broadcasts" />
                </nav>

                <div className="border-t border-border pt-4 mt-2 space-y-2">
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-textSecondary hover:text-textPrimary hover:bg-card rounded-xl transition-all"
                    >
                        {isDarkMode ? <Sun className="w-5 h-5 text-warning" /> : <Moon className="w-5 h-5 text-indigo-500" />}
                        <span className="text-sm font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>

                    <button
                        onClick={onLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-textSecondary hover:text-error hover:bg-error/5 rounded-xl transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm font-medium">Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative pt-16 md:pt-0">
                {/* Desktop Top Actions */}
                <div className="absolute top-4 right-8 z-40 hidden md:flex items-center space-x-4">
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 glass-dark rounded-xl border border-white/5 hover:border-accent/40 transition-all group shadow-xl"
                    >
                        {isDarkMode ? <Sun className="w-5 h-5 text-warning group-hover:rotate-45 transition-transform" /> : <Moon className="w-5 h-5 text-indigo-500 group-hover:-rotate-12 transition-transform" />}
                    </button>
                    <button
                        onClick={() => setCurrentView(DashboardView.NOTIFICATIONS)}
                        className="relative p-2.5 glass-dark rounded-xl border border-white/5 hover:border-accent/40 transition-all group shadow-xl"
                    >
                        <Bell className="w-5 h-5 text-textSecondary group-hover:text-accent transition-colors" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full pointer-events-none ring-2 ring-bgSecondary animate-pulse"></span>
                        )}
                    </button>
                </div>
                    <div
                        className="p-2.5 bg-card border border-border rounded-2xl text-textSecondary shadow-xl flex items-center gap-2 backdrop-blur-md cursor-default"
                        title="Data is updating live"
                    >
                        <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                        <span className="text-xs font-bold pr-1">Live Sync</span>
                    </div>
                <main className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">

                    {currentView === DashboardView.OVERVIEW && (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="space-y-8 max-w-5xl mx-auto"
                        >
                            <motion.div variants={itemVariants} className="relative overflow-hidden bg-gradient-to-br from-accent/20 via-bgSecondary to-bgSecondary p-8 rounded-3xl border border-border flex justify-between items-center">
                                <div className="relative z-10">
                                    <h1 className="text-3xl font-extrabold text-textPrimary mb-2 leading-tight">Welcome back, <span className="text-accent">{profile.name?.split(' ')[0]}!</span></h1>
                                    <p className="text-textSecondary text-sm flex items-center">
                                        <img src="/favicon.png" alt="Logo" className="w-4 h-4 mr-2" />
                                        {profile.department} • Semester {profile.semester}
                                    </p>
                                </div>
                                <div className="absolute right-0 top-0 h-full opacity-5 -rotate-12 translate-x-12 pointer-events-none will-change-transform">
                                    <img src="/favicon.png" alt="decor" className="h-48 w-48 object-contain" />
                                </div>
                            </motion.div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <motion.div variants={itemVariants} className="bg-card border border-border p-6 rounded-2xl flex items-center justify-between group hover:border-accent transition-all shadow-sm">
                                    <div>
                                        <p className="text-textSecondary text-[10px] font-bold uppercase tracking-widest mb-1">Faculty Available</p>
                                        <p className="text-3xl font-bold text-accent">{availableCount}</p>
                                    </div>
                                    <CheckCircle2 className="w-10 h-10 text-accent opacity-20 group-hover:opacity-40 transition-opacity" />
                                </motion.div>
                                <motion.div variants={itemVariants} className="bg-card border border-border p-6 rounded-2xl flex items-center justify-between group hover:border-warning transition-all shadow-sm">
                                    <div>
                                        <p className="text-textSecondary text-[10px] font-bold uppercase tracking-widest mb-1">Faculty Busy</p>
                                        <p className="text-3xl font-bold text-warning">{busyCount}</p>
                                    </div>
                                    <MinusCircle className="w-10 h-10 text-warning opacity-20 group-hover:opacity-40 transition-opacity" />
                                </motion.div>
                                <motion.div
                                    variants={itemVariants}
                                    onClick={handleOpenNotifications}
                                    className="bg-card border border-border p-6 rounded-2xl flex items-center justify-between cursor-pointer group hover:border-textPrimary transition-all relative overflow-hidden shadow-sm"
                                >
                                    <div>
                                        <p className="text-textSecondary text-[10px] font-bold uppercase tracking-widest mb-1">New Notifications</p>
                                        <p className="text-3xl font-bold text-textPrimary">{unreadCount}</p>
                                    </div>
                                    <Bell className="w-10 h-10 text-textPrimary opacity-20 group-hover:opacity-40 transition-opacity" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-4 right-4 w-3 h-3 bg-error rounded-full animate-pulse border-2 border-card"></span>
                                    )}
                                </motion.div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    <motion.div variants={itemVariants}>
                                        <div className="flex justify-between items-center mb-4 px-1">
                                            <h2 className="text-lg font-bold text-textPrimary flex items-center">
                                                <Radio className="w-4 h-4 mr-2 text-error" />
                                                Recent Announcements
                                            </h2>
                                            <button onClick={() => setCurrentView(DashboardView.BROADCASTS)} className="text-xs font-bold text-accent hover:underline">View Feed</button>
                                        </div>
                                        <BroadcastBoard broadcasts={filteredBroadcasts.slice(0, 2)} />
                                    </motion.div>

                                    <motion.div variants={itemVariants}>
                                        <h2 className="text-lg font-bold text-textPrimary mb-4 px-1">Academic Shortcuts</h2>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            <a href="https://www.gtu.ac.in/result.aspx" target="_blank" rel="noreferrer" className="bg-card p-5 rounded-2xl border border-border hover:border-accent hover:shadow-lg hover:shadow-accent/5 group transition-all">
                                                <ExternalLink className="w-8 h-8 text-accent mb-4 group-hover:scale-110 transition-transform" />
                                                <span className="text-sm font-bold text-textPrimary block mb-1">GTU Results</span>
                                                <span className="text-[10px] text-textSecondary uppercase font-medium">GTU.AC.IN</span>
                                            </a>
                                            <a href="#" className="bg-card p-5 rounded-2xl border border-border hover:border-accent hover:shadow-lg hover:shadow-accent/5 group transition-all">
                                                <FileText className="w-8 h-8 text-accent mb-4 group-hover:scale-110 transition-transform" />
                                                <span className="text-sm font-bold text-textPrimary block mb-1">Syllabus</span>
                                                <span className="text-[10px] text-textSecondary uppercase font-medium">2024 Revised</span>
                                            </a>
                                            <a href="#" className="bg-card p-5 rounded-2xl border border-border hover:border-accent hover:shadow-lg hover:shadow-accent/5 group transition-all">
                                                <Clock className="w-8 h-8 text-accent mb-4 group-hover:scale-110 transition-transform" />
                                                <span className="text-sm font-bold text-textPrimary block mb-1">Exam Table</span>
                                                <span className="text-[10px] text-textSecondary uppercase font-medium">Winter 2024</span>
                                            </a>
                                        </div>
                                    </motion.div>
                                </div>

                                <div className="space-y-6">
                                    <motion.div variants={itemVariants}>
                                        <div className="flex justify-between items-center mb-4 px-1">
                                            <h2 className="text-lg font-bold text-textPrimary">Upcoming Visits</h2>
                                        </div>
                                        <div className="space-y-3">
                                            {appointments.filter(a => new Date(a.date) >= new Date()).slice(0, 3).map(apt => (
                                                <div key={apt.id} className="bg-card border border-border rounded-2xl p-4 flex items-center space-x-4 hover:border-accent transition-colors">
                                                    <div className="bg-bgSecondary p-3 rounded-xl text-center min-w-[55px] border border-border">
                                                        <span className="block text-[10px] text-accent font-black uppercase leading-none">{new Date(apt.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                                                        <span className="block text-xl font-black text-textPrimary mt-1">{new Date(apt.date).getDate()}</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-textPrimary truncate">{apt.facultyName}</p>
                                                        <div className="flex items-center text-[10px] text-textSecondary mt-1">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            {apt.time}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {appointments.length === 0 && (
                                                <div className="text-center py-10 bg-card/50 border border-border border-dashed rounded-2xl text-textSecondary text-xs">
                                                    <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-10" />
                                                    No upcoming visits scheduled.
                                                </div>
                                            )}
                                            <button onClick={() => setCurrentView(DashboardView.FACULTY_LIST)} className="w-full py-3 text-xs font-bold bg-bgSecondary text-accent rounded-xl hover:bg-card border border-border transition-all">
                                                + Book New Slot
                                            </button>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {currentView === DashboardView.FACULTY_LIST && (
                        <div className="max-w-6xl mx-auto space-y-6">
                            <h2 className="text-2xl font-black text-textPrimary mb-6">Explore Faculty</h2>

                            <div className="bg-card/80 backdrop-blur-md p-5 rounded-3xl border border-border mb-6 sticky top-0 z-20 shadow-2xl">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-textSecondary w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder="Search name, position, cabin..."
                                            className="w-full pl-12 pr-4 py-3 bg-bgPrimary border border-border rounded-2xl text-sm text-textPrimary focus:outline-none focus:border-accent transition-all"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                                        <button
                                            onClick={() => setSelectedDept('All')}
                                            className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${selectedDept === 'All' ? 'bg-accent text-bgPrimary border-accent shadow-lg shadow-accent/20' : 'bg-bgPrimary text-textSecondary border-border hover:border-accent'
                                                }`}
                                        >
                                            All Depts
                                        </button>
                                        {DEPARTMENTS.map(dept => (
                                            <button
                                                key={dept}
                                                onClick={() => setSelectedDept(dept)}
                                                className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${selectedDept === dept ? 'bg-accent text-bgPrimary border-accent shadow-lg shadow-accent/20' : 'bg-bgPrimary text-textSecondary border-border hover:border-accent'
                                                    }`}
                                            >
                                                {dept}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {filteredFaculty.length === 0 ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 bg-card rounded-3xl border border-border border-dashed">
                                    <Search className="w-16 h-16 text-textSecondary mx-auto mb-4 opacity-10" />
                                    <h3 className="text-xl font-bold text-textPrimary">No results matched</h3>
                                    <p className="text-textSecondary text-sm">Try using simpler keywords or different department filters.</p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    variants={containerVariants}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                >
                                    {filteredFaculty.map(faculty => (
                                        <motion.div key={faculty.id} variants={itemVariants}>
                                            <FacultyCard
                                                faculty={faculty}
                                                onNotify={handleNotify}
                                                onRequest={handleRequest}
                                                onViewProfile={handleViewProfile}
                                            />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </div>
                    )}

                    {currentView === DashboardView.FACULTY_PROFILE && viewingFaculty && (
                        <FacultyProfilePage
                            faculty={viewingFaculty}
                            onBack={() => setCurrentView(DashboardView.FACULTY_LIST)}
                            onRequestAppointment={handleRequest}
                        />
                    )}

                    {currentView === DashboardView.PROFILE && (
                        <StudentProfileView profile={profile} onUpdate={handleProfileUpdate} />
                    )}

                    {currentView === DashboardView.APPOINTMENTS && (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="max-w-5xl mx-auto space-y-6"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
                                <h2 className="text-2xl font-black text-textPrimary">My Schedule</h2>
                                <div className="flex items-center space-x-2 bg-bgSecondary p-1 rounded-2xl border border-border">
                                    <button
                                        onClick={() => setIsCalendarView(false)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${!isCalendarView ? 'bg-accent text-bgPrimary shadow-lg shadow-accent/20' : 'text-textSecondary hover:text-textPrimary'}`}
                                    >
                                        <List className="w-3.5 h-3.5" />
                                        List
                                    </button>
                                    <button
                                        onClick={() => setIsCalendarView(true)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${isCalendarView ? 'bg-accent text-bgPrimary shadow-lg shadow-accent/20' : 'text-textSecondary hover:text-textPrimary'}`}
                                    >
                                        <CalendarIcon className="w-3.5 h-3.5" />
                                        Calendar
                                    </button>
                                </div>
                            </div>

                            {isCalendarView ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-card border border-border rounded-3xl p-6 shadow-2xl"
                                >
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-xl font-black text-textPrimary uppercase tracking-widest">
                                            {calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                        </h3>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                                                className="p-2.5 bg-bgSecondary border border-border rounded-xl text-textSecondary hover:text-accent transition-colors"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => setCalendarDate(new Date())}
                                                className="px-4 py-1.5 bg-bgSecondary border border-border rounded-xl text-xs font-bold text-textSecondary hover:text-textPrimary transition-colors"
                                            >
                                                Today
                                            </button>
                                            <button
                                                onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                                                className="p-2.5 bg-bgSecondary border border-border rounded-xl text-textSecondary hover:text-accent transition-colors"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-7 gap-px bg-border border border-border rounded-2xl overflow-hidden mb-8">
                                        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                                            <div key={d} className="bg-bgSecondary py-3 text-center text-[10px] font-black text-accent tracking-[0.2em]">{d}</div>
                                        ))}
                                        {calendarGrid.map((day, idx) => {
                                            const dayApts = day ? appointmentsForDay(day) : [];
                                            const isCurrentDay = day === new Date().getDate() && calendarDate.getMonth() === new Date().getMonth() && calendarDate.getFullYear() === new Date().getFullYear();

                                            return (
                                                <div
                                                    key={idx}
                                                    className={`min-h-[100px] md:min-h-[120px] bg-card p-2 border-b border-border transition-colors hover:bg-bgSecondary/30 relative flex flex-col ${day === null ? 'bg-bgSecondary/20' : ''}`}
                                                >
                                                    {day && (
                                                        <>
                                                            <span className={`text-xs font-bold mb-2 w-6 h-6 flex items-center justify-center rounded-lg ${isCurrentDay ? 'bg-accent text-bgPrimary shadow-lg shadow-accent/20' : 'text-textSecondary'}`}>
                                                                {day}
                                                            </span>
                                                            <div className="space-y-1">
                                                                {dayApts.map(apt => (
                                                                    <div
                                                                        key={apt.id}
                                                                        className={`text-[9px] font-bold p-1 rounded border leading-none truncate ${apt.status === 'Pending' ? 'bg-warning/10 border-warning/30 text-warning' : 'bg-accent/10 border-accent/30 text-accent'
                                                                            }`}
                                                                        title={`${apt.time} - ${apt.facultyName}`}
                                                                    >
                                                                        {apt.time} {apt.facultyName}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="space-y-4">
                                    {appointments.length === 0 ? (
                                        <motion.div variants={itemVariants} className="text-center py-32 bg-card rounded-3xl border border-border border-dashed">
                                            <CalendarIcon className="w-16 h-16 text-textSecondary mx-auto mb-4 opacity-10" />
                                            <h3 className="text-xl font-bold text-textPrimary">No appointments yet</h3>
                                            <p className="text-textSecondary text-sm mb-8">Ready to clear your doubts? Book a session with a professor.</p>
                                            <button
                                                onClick={() => setCurrentView(DashboardView.FACULTY_LIST)}
                                                className="text-accent font-black uppercase text-[10px] tracking-widest hover:underline"
                                            >
                                                Browse Professors &rarr;
                                            </button>
                                        </motion.div>
                                    ) : (
                                        appointments.map(apt => (
                                            <motion.div key={apt.id} variants={itemVariants} className="bg-card border border-border rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-accent transition-all shadow-sm">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-14 h-14 rounded-2xl bg-bgSecondary flex items-center justify-center border-2 border-border text-textSecondary uppercase font-black text-xl">
                                                        {apt.facultyName?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-lg text-textPrimary leading-tight">{apt.facultyName}</h4>
                                                        <p className="text-sm text-textSecondary mt-0.5">{apt.purpose}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between w-full md:w-auto gap-8">
                                                    <div className="text-right">
                                                        <div className="flex items-center text-sm text-textPrimary font-bold">
                                                            <CalendarIcon className="w-3.5 h-3.5 mr-2 text-accent" />
                                                            {new Date(apt.date).toLocaleDateString()}
                                                        </div>
                                                        <div className="flex items-center text-xs text-textSecondary mt-1 justify-end">
                                                            <Clock className="w-3.5 h-3.5 mr-2" />
                                                            {apt.time}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-3">
                                                        <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${apt.status === 'Pending' ? 'text-warning bg-warning/10 border-warning/30' :
                                                            apt.status === 'Confirmed' ? 'text-accent bg-accent/10 border-accent/30' :
                                                                'text-textSecondary bg-bgSecondary border-border'
                                                            }`}>
                                                            {apt.status}
                                                        </div>
                                                        {apt.status === 'Pending' && (
                                                            <button
                                                                onClick={() => handleDeleteAppointment(apt.id)}
                                                                className="text-xs text-error font-bold hover:underline flex items-center"
                                                            >
                                                                <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {currentView === DashboardView.NOTIFICATIONS && (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto space-y-6">
                            <div className="flex justify-between items-center mb-6 px-1">
                                <h2 className="text-2xl font-black text-textPrimary">Inbox</h2>
                                <button onClick={() => storageService.markNotificationsRead()} className="text-xs font-bold text-accent hover:underline">Mark all as read</button>
                            </div>

                            {notifications.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="relative overflow-hidden bg-card border border-border border-dashed rounded-[2rem] py-24 text-center group"
                                >
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/5 blur-[100px] rounded-full group-hover:bg-accent/10 transition-colors"></div>

                                    <div className="relative z-10">
                                        <div className="w-20 h-20 bg-bgSecondary rounded-full flex items-center justify-center mx-auto mb-6 border border-border group-hover:scale-110 transition-transform duration-500">
                                            <CheckCircle2 className="w-10 h-10 text-accent opacity-40" />
                                        </div>
                                        <h3 className="text-xl font-bold text-textPrimary mb-2">Inbox Zero!</h3>
                                        <p className="text-textSecondary text-sm max-w-xs mx-auto mb-8">
                                            You're all caught up. No new alerts or appointment updates at the moment.
                                        </p>

                                        <div className="flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => setCurrentView(DashboardView.FACULTY_LIST)}
                                                className="px-6 py-2.5 bg-accent text-bgPrimary text-xs font-black rounded-xl hover:bg-accentHover shadow-lg shadow-accent/20 transition-all font-outfit"
                                            >
                                                Book a Visit
                                            </button>
                                            <button
                                                onClick={() => setCurrentView(DashboardView.CHATBOT)}
                                                className="px-6 py-2.5 bg-bgSecondary text-textPrimary text-xs font-black border border-border rounded-xl hover:bg-card transition-all font-outfit"
                                            >
                                                Ask AI Assistant
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="space-y-4">
                                    {notifications.map(notif => (
                                        <motion.div
                                            key={notif.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`p-5 rounded-2xl border flex items-start gap-4 transition-all hover:translate-x-1 ${!notif.isRead ? 'bg-accent/5 border-accent/20' : 'bg-card border-border opacity-70'
                                                }`}
                                        >
                                            <div className={`p-3 rounded-xl ${notif.type === 'APPOINTMENT' ? 'bg-accent/10 text-accent' : 'bg-warning/10 text-warning'}`}>
                                                {notif.type === 'APPOINTMENT' ? <CalendarIcon className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold text-textPrimary mb-1">{notif.title}</h4>
                                                <p className="text-xs text-textSecondary leading-relaxed mb-2">{notif.message}</p>
                                                <span className="text-[10px] text-textSecondary/60 font-medium">
                                                    {new Date(notif.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {currentView === DashboardView.CHATBOT && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="h-full max-w-4xl mx-auto flex flex-col">
                            <h2 className="text-2xl font-black text-textPrimary mb-6">AI Academic Assistant</h2>
                            <div className="flex-1 min-h-[500px]">
                                <Chatbot facultyData={facultyList} embedded={true} />
                            </div>
                        </motion.div>
                    )}

                    {currentView === DashboardView.BROADCASTS && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-4xl mx-auto space-y-6">
                            <h2 className="text-2xl font-black text-textPrimary mb-6 px-1">Global Broadcast Feed</h2>
                            <BroadcastBoard broadcasts={filteredBroadcasts} />
                        </motion.div>
                    )}

                </main>
                {currentView !== DashboardView.CHATBOT && <Chatbot facultyData={facultyList} />}

                {/* Mobile Navigation */}
                <div className="md:hidden bg-bgSecondary border-t border-border p-2 flex justify-around backdrop-blur-lg">
                    <button onClick={() => setCurrentView(DashboardView.OVERVIEW)} className={`p-3 rounded-2xl transition-all ${currentView === DashboardView.OVERVIEW ? 'text-accent bg-accent/10' : 'text-textSecondary'}`}><LayoutDashboard className="w-6 h-6" /></button>
                    <button onClick={() => setCurrentView(DashboardView.FACULTY_LIST)} className={`p-3 rounded-2xl transition-all ${currentView === DashboardView.FACULTY_LIST ? 'text-accent bg-accent/10' : 'text-textSecondary'}`}><Users className="w-6 h-6" /></button>
                    <button onClick={() => setCurrentView(DashboardView.NOTIFICATIONS)} className={`p-3 rounded-2xl relative transition-all ${currentView === DashboardView.NOTIFICATIONS ? 'text-accent bg-accent/10' : 'text-textSecondary'}`}>
                        <Bell className="w-6 h-6" />
                        {unreadCount > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full border-2 border-bgSecondary"></span>}
                    </button>
                    <button onClick={() => setCurrentView(DashboardView.APPOINTMENTS)} className={`p-3 rounded-2xl transition-all ${currentView === DashboardView.APPOINTMENTS ? 'text-accent bg-accent/10' : 'text-textSecondary'}`}><CalendarIcon className="w-6 h-6" /></button>
                </div>

                {bookingFaculty && (
                    <BookingModal
                        faculty={bookingFaculty}
                        isOpen={true}
                        onClose={() => setBookingFaculty(null)}
                        onConfirm={handleBookingConfirm}
                    />
                )}

            </div>
        </div>
    );
};
