import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ApolloProvider } from '@apollo/client/react';
import { client } from '@/graphql/client';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThreeDShapes } from '@/components/ThreeDShapes';
import { ParticleField } from '@/components/ParticleField';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Loader2, User } from 'lucide-react';
import { UserRole, FacultyStatus, BroadcastMessage, Faculty, Appointment } from '@/types';
import { storageService } from '@/services/storageService';

// Lazy Load Pages
const LandingPage = lazy(() => import('@/pages/Landing').then(module => ({ default: module.LandingPage })));
const LoginPage = lazy(() => import('@/pages/Login').then(module => ({ default: module.LoginPage })));
const RegisterSelectionPage = lazy(() => import('@/pages/RegisterSelection').then(module => ({ default: module.RegisterSelectionPage })));
const RegisterStudentPage = lazy(() => import('@/pages/RegisterStudent').then(module => ({ default: module.RegisterStudentPage })));
const RegisterFacultyPage = lazy(() => import('@/pages/RegisterFaculty').then(module => ({ default: module.RegisterFacultyPage })));
const StudentDashboard = lazy(() => import('@/pages/student/Dashboard').then(module => ({ default: module.StudentDashboard })));
const FacultyDashboard = lazy(() => import('@/pages/faculty/Dashboard').then(module => ({ default: module.FacultyDashboard })));
const FacultyProfilePage = lazy(() => import('@/pages/common/FacultyProfile').then(module => ({ default: module.FacultyProfilePage })));

export const LoadingFallback = () => (
    <div className="min-h-screen flex items-center justify-center bg-bgPrimary">
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
    </div>
);

import { useQuery, useMutation } from '@apollo/client/react';
import { GET_FACULTIES, GET_BROADCASTS, GET_MY_APPOINTMENTS, FACULTY_STATUS_UPDATED, BROADCAST_ADDED, APPOINTMENT_UPDATED, GET_MY_SCHEDULE, GET_FACULTY } from '@/graphql/queries';
import { UPDATE_FACULTY_STATUS, SEND_BROADCAST } from '@/graphql/mutations';

// Wrappers for Dashboard Logic
const StudentDashboardWrapper = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const { data: facultyData, loading: facultyLoading, error: facultyError, subscribeToMore: subscribeToFaculties } = useQuery<{ faculties: Faculty[] }>(GET_FACULTIES);
    const { data: broadcastData, loading: broadcastLoading, error: broadcastError, subscribeToMore: subscribeToBroadcasts } = useQuery<{ broadcasts: BroadcastMessage[] }>(GET_BROADCASTS);
    const { data: appointmentData, loading: appointmentLoading, error: appointmentError, subscribeToMore: subscribeToAppointments } = useQuery<{ myAppointments: Appointment[] }>(GET_MY_APPOINTMENTS);

    useEffect(() => {
        if (facultyError) console.error("Faculty Query Error:", facultyError);
        if (facultyData) console.log("Faculty Data Received:", facultyData);
    }, [facultyData, facultyError]);

    useEffect(() => {
        subscribeToFaculties({
            document: FACULTY_STATUS_UPDATED,
            updateQuery: (prev, { subscriptionData }) => {
                if (!subscriptionData.data) return prev;
                const updatedFaculty = (subscriptionData.data as any).facultyStatusUpdated;

                return {
                    ...prev,
                    faculties: prev.faculties.map(f => f.id === updatedFaculty.id ? { ...f, availability: updatedFaculty.availability } : f)
                } as any;
            }
        });

        subscribeToBroadcasts({
            document: BROADCAST_ADDED,
            updateQuery: (prev, { subscriptionData }) => {
                if (!subscriptionData.data) return prev;
                const newBroadcast = (subscriptionData.data as any).broadcastAdded;
                // Check if already exists just in case
                if (prev.broadcasts.find(b => b.id === newBroadcast.id)) return prev;
                return {
                    ...prev,
                    broadcasts: [newBroadcast, ...prev.broadcasts]
                } as any;
            }
        });

        subscribeToAppointments({
            document: APPOINTMENT_UPDATED,
            updateQuery: (prev, { subscriptionData }) => {
                if (!subscriptionData.data) return prev;
                const updatedApt = (subscriptionData.data as any).appointmentUpdated;
                // Check if update or new
                const exists = prev.myAppointments.find(a => a.id === updatedApt.id);
                if (exists) {
                    return {
                        ...prev,
                        myAppointments: prev.myAppointments.map(a => a.id === updatedApt.id ? updatedApt : a)
                    } as any;
                } else {
                    return {
                        ...prev,
                        myAppointments: [updatedApt, ...prev.myAppointments]
                    } as any;
                }
            }
        });
    }, [subscribeToFaculties, subscribeToBroadcasts, subscribeToAppointments]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const mapError = (error: any) => !!error;

    if (mapError(facultyError) || mapError(broadcastError) || mapError(appointmentError)) {
        const err = (facultyError || broadcastError || appointmentError) as any;
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-bgPrimary text-textPrimary p-4">
                <div className="bg-card border border-error/50 p-6 rounded-2xl max-w-md w-full shadow-2xl">
                    <h3 className="text-xl font-bold text-error mb-2">Connection Issue</h3>
                    <p className="text-sm text-textSecondary mb-4">We couldn't load some data. Please check your connection.</p>
                    <div className="bg-bgSecondary p-3 rounded-lg overflow-auto max-h-40 text-[10px] font-mono mb-4 text-error">
                        {err?.message || "Unknown Error"}
                        {err?.graphQLErrors?.map((e: any, i: number) => <div key={i} className="mt-1">GraphQL: {e.message}</div>)}
                        {err?.networkError && <div className="mt-1">Network: {err.networkError.message}</div>}
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3 bg-accent text-bgPrimary font-bold rounded-xl hover:opacity-90 transition-opacity"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    if (facultyLoading || broadcastLoading || appointmentLoading) return <LoadingFallback />;

    // Map GraphQL data to flat structure required by components
    const mappedAppointments = appointmentData?.myAppointments.map((apt: any) => ({
        ...apt,
        facultyName: apt.faculty?.name || 'Unknown Faculty',
        facultyImage: apt.faculty?.image || ''
    })) || [];

    const mappedBroadcasts = broadcastData?.broadcasts.map((msg: any) => ({
        ...msg,
        facultyName: msg.faculty?.name || 'Unknown Faculty'
    })) || [];

    return (
        <StudentDashboard
            facultyList={facultyData?.faculties || []}
            broadcasts={mappedBroadcasts}
            appointments={mappedAppointments}
            onLogout={handleLogout}
        />
    );
};

const FacultyDashboardWrapper = () => {
    const { currentFaculty, logout } = useAuth();
    const navigate = useNavigate();
    const [showProfile, setShowProfile] = useState(false);

    const [updateStatusMutation] = useMutation(UPDATE_FACULTY_STATUS);
    const [sendBroadcastMutation] = useMutation(SEND_BROADCAST);

    const { data: broadcastData, subscribeToMore: subscribeToBroadcasts } = useQuery<{ broadcasts: BroadcastMessage[] }>(GET_BROADCASTS);
    const { data: appointmentData, subscribeToMore: subscribeToAppointments } = useQuery<{ myAppointments: Appointment[] }>(GET_MY_APPOINTMENTS);
    const { data: scheduleData, refetch: refetchSchedule } = useQuery(GET_MY_SCHEDULE);
    const { data: facultyDetailsData } = useQuery(GET_FACULTY, {
        variables: { id: currentFaculty?.id },
        skip: !currentFaculty?.id
    });

    useEffect(() => {
        subscribeToBroadcasts({
            document: BROADCAST_ADDED,
            updateQuery: (prev, { subscriptionData }) => {
                if (!subscriptionData.data) return prev;
                const newBroadcast = (subscriptionData.data as any).broadcastAdded;
                if (prev.broadcasts.find(b => b.id === newBroadcast.id)) return prev;
                return {
                    ...prev,
                    broadcasts: [newBroadcast, ...prev.broadcasts]
                } as any;
            }
        });

        subscribeToAppointments({
            document: APPOINTMENT_UPDATED,
            updateQuery: (prev, { subscriptionData }) => {
                if (!subscriptionData.data) return prev;
                const updatedApt = (subscriptionData.data as any).appointmentUpdated;
                const exists = prev.myAppointments.find(a => a.id === updatedApt.id);
                if (exists) {
                    return {
                        ...prev,
                        myAppointments: prev.myAppointments.map(a => a.id === updatedApt.id ? updatedApt : a)
                    } as any;
                } else {
                    return {
                        ...prev,
                        myAppointments: [updatedApt, ...prev.myAppointments]
                    } as any;
                }
            }
        });
    }, [subscribeToBroadcasts, subscribeToAppointments]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleUpdateStatus = async (id: string, status: FacultyStatus) => {
        try {
            await updateStatusMutation({
                variables: { status }
            });
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const handlePostBroadcast = async (message: string, targetSemester: string) => {
        try {
            await sendBroadcastMutation({
                variables: { message, targetSemester }
            });
        } catch (err) {
            console.error('Error posting broadcast:', err);
        }
    };

    // Map GraphQL data
    const mappedAppointments = appointmentData?.myAppointments.map((apt: any) => ({
        ...apt,
        studentName: apt.student?.name || 'Unknown Student',
        facultyName: apt.faculty?.name // Keep for consistency if needed
    })) || [];

    const mappedBroadcasts = broadcastData?.broadcasts.map((msg: any) => ({
        ...msg,
        facultyName: msg.faculty?.name || 'Unknown Faculty'
    })) || [];

    const myBroadcasts = mappedBroadcasts.filter((b: any) => b.facultyId === currentFaculty?.id);

    if (!currentFaculty) return <LoadingFallback />;

    return (
        <div className="min-h-screen">
            {/* Faculty Header */}
            <div className="bg-bgSecondary/80 backdrop-blur-md border-b border-white/5 p-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setShowProfile(false)}>
                    <span className="font-bold text-xl tracking-tight text-textPrimary">SmartCampus</span>
                    <span className="text-[10px] bg-accent/20 text-accent px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border border-accent/30">Faculty Portal</span>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setShowProfile(true)}
                        className="flex items-center space-x-3 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 transition-colors"
                    >
                        <div className="text-right hidden md:block">
                            <span className="block text-sm font-bold text-textPrimary">{currentFaculty.name}</span>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
                            <User className="w-5 h-5" />
                        </div>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-white/5 hover:bg-error/10 text-textSecondary hover:text-error border border-white/10 hover:border-error/30 rounded-xl text-sm font-semibold transition-all"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <main className="p-4 md:p-8">
                {showProfile ? (
                    <FacultyProfilePage
                        faculty={{
                            ...currentFaculty,
                            // Use fetched details if available to ensure schedule and availability data is present
                            ...(facultyDetailsData as any)?.faculty
                        }}
                        onBack={() => setShowProfile(false)}
                        isSelfView={true}
                    />
                ) : (
                    <FacultyDashboard
                        currentFaculty={(facultyDetailsData as any)?.faculty || currentFaculty}
                        appointments={mappedAppointments}
                        myBroadcasts={myBroadcasts}
                        scheduleData={scheduleData}
                        onUpdateStatus={handleUpdateStatus}
                        onPostBroadcast={handlePostBroadcast}
                        onRefreshSchedule={refetchSchedule}
                    />
                )}
            </main>
        </div>
    );
};

const DashboardRedirect = () => {
    const { userRole, isLoading } = useAuth();
    if (isLoading) return <LoadingFallback />;
    if (userRole === UserRole.FACULTY) return <Navigate to="/faculty-dashboard" replace />;
    return <Navigate to="/student-dashboard" replace />;
};

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: UserRole[] }) => {
    const { userRole, currentFacultyId, token, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) return <LoadingFallback />;

    // No token? Not logged in.
    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check if role is allowed for this route
    if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
        return <Navigate to="/dashboard" replace />;
    }

    // Faculty specific check (ensures currentFacultyId is present if logged in as FACULTY)
    if (userRole === UserRole.FACULTY && !currentFacultyId) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

const AnimatedRoutes = () => {
    const location = useLocation();

    return (
        <AnimatePresence mode="popLayout">
            <motion.div
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="relative z-10"
            >
                {/* Background effects only on non-dashboard routes */}
                {!location.pathname.includes('dashboard') && (
                    <>
                        <ThreeDShapes />
                        <ParticleField />
                    </>
                )}
                <Routes location={location}>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterSelectionPage />} />
                    <Route path="/register/student" element={<RegisterStudentPage />} />
                    <Route path="/register/faculty" element={<RegisterFacultyPage />} />
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <DashboardRedirect />
                        </ProtectedRoute>
                    } />
                    <Route path="/student-dashboard" element={
                        <ProtectedRoute allowedRoles={[UserRole.STUDENT]}>
                            <StudentDashboardWrapper />
                        </ProtectedRoute>
                    } />
                    <Route path="/faculty-dashboard" element={
                        <ProtectedRoute allowedRoles={[UserRole.FACULTY]}>
                            <FacultyDashboardWrapper />
                        </ProtectedRoute>
                    } />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </motion.div>
        </AnimatePresence>
    );
};

function App() {
    return (
        <ApolloProvider client={client}>
            <ErrorBoundary>
                <AuthProvider>
                    <Router>
                        <div className="min-h-screen relative overflow-x-hidden text-textPrimary bg-bgPrimary">
                            <Suspense fallback={<LoadingFallback />}>
                                <AnimatedRoutes />
                            </Suspense>
                        </div>
                    </Router>
                </AuthProvider>
            </ErrorBoundary>
        </ApolloProvider>
    );
}

export default App;
