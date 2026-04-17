import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, UserCircle, ChevronRight, ArrowLeft } from 'lucide-react';
import { UserRole } from '@/types';
import { useAuth } from '@/context/AuthContext';

export const RegisterSelectionPage: React.FC = () => {
    const navigate = useNavigate();
    const { token, userRole } = useAuth();

    useEffect(() => {
        if (token) {
            if (userRole === UserRole.FACULTY) {
                navigate('/faculty-dashboard', { replace: true });
            } else {
                navigate('/student-dashboard', { replace: true });
            }
        }
    }, [token, userRole, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-bgPrimary p-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/3 rounded-full blur-[80px] pointer-events-none will-change-transform"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/3 rounded-full blur-[80px] pointer-events-none will-change-transform"></div>

            <div className="w-full max-w-md bg-card/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden relative z-10">

                {/* Header */}
                <div className="p-8 text-center border-b border-white/5 bg-black/20">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Create Account</h2>
                    <p className="text-textSecondary mt-2 text-sm">Select your role to continue</p>
                </div>

                <div className="p-8 space-y-4">
                    <button
                        onClick={() => navigate('/register/student')}
                        className="w-full group relative flex items-center p-4 border border-white/10 rounded-2xl text-white bg-white/5 hover:bg-accent hover:border-accent transition-all duration-300"
                    >
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mr-4 group-hover:bg-white/20 transition-colors">
                            <GraduationCap className="h-6 w-6" />
                        </div>
                        <div className="text-left flex-1">
                            <span className="block font-bold text-lg">Student</span>
                            <span className="text-xs text-textSecondary group-hover:text-white/80">Register as LDCE student</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-textSecondary group-hover:text-white opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
                    </button>

                    <button
                        onClick={() => navigate('/register/faculty')}
                        className="w-full group relative flex items-center p-4 border border-white/10 rounded-2xl text-white bg-white/5 hover:bg-blue-600 hover:border-blue-500 transition-all duration-300"
                    >
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mr-4 group-hover:bg-white/20 transition-colors">
                            <UserCircle className="h-6 w-6" />
                        </div>
                        <div className="text-left flex-1">
                            <span className="block font-bold text-lg">Faculty</span>
                            <span className="text-xs text-textSecondary group-hover:text-white/80">Register as department faculty</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-textSecondary group-hover:text-white opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
                    </button>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <Link
                            to="/login"
                            className="text-sm font-medium text-textSecondary hover:text-white transition-colors flex items-center justify-center mx-auto space-x-2 group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span>Back to Login</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
