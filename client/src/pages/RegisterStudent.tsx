import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useMutation } from '@apollo/client/react';
import { REGISTER_STUDENT_MUTATION } from '@/graphql/mutations';
import { UserRole } from '@/types';
import { Loader2, AlertCircle, User, Mail, Hash, BookOpen, Layers, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';

export const RegisterStudentPage: React.FC = () => {
    const navigate = useNavigate();
    const { login, token, userRole } = useAuth();

    useEffect(() => {
        if (token) {
            if (userRole === UserRole.FACULTY) {
                navigate('/faculty-dashboard', { replace: true });
            } else {
                navigate('/student-dashboard', { replace: true });
            }
        }
    }, [token, userRole, navigate]);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        enrollmentNo: '',
        department: '',
        semester: 1,
        password: '',
        confirmPassword: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const [registerMutation, { loading: isLoading }] = useMutation<{ registerStudent: { token: string; user: any } }>(REGISTER_STUDENT_MUTATION, {
        onCompleted: (data) => {
            const { token, user } = data.registerStudent;
            login(user.role as UserRole, token, user);
            navigate('/student-dashboard');
        },
        onError: (err: any) => {
            setError(err.message || 'Registration failed');
        }
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'semester' ? parseInt(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.email.toLowerCase().endsWith('@ldce.ac.in')) {
            setError('Email must be an @ldce.ac.in address');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        const { confirmPassword, ...input } = formData;

        registerMutation({
            variables: {
                input: {
                    ...input,
                    email: input.email.trim().toLowerCase(),
                    enrollmentNo: input.enrollmentNo.trim()
                }
            }
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bgPrimary p-4 relative overflow-hidden py-12">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/3 rounded-full blur-[80px] pointer-events-none will-change-transform"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/3 rounded-full blur-[80px] pointer-events-none will-change-transform"></div>

            <div className="w-full max-w-2xl bg-card/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden relative z-10">
                <div className="p-8 text-center border-b border-white/5 bg-black/20">
                    <div className="w-16 h-16 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl border border-white/10">
                        <img src="/favicon.png" alt="EasyConnect Logo" className="w-10 h-10 object-contain" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-textPrimary tracking-tight">Create Account</h1>
                    <p className="text-textSecondary mt-2 text-sm">Join the EasyConnect network</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">Full Name</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-3.5 h-5 w-5 text-textSecondary group-focus-within:text-accent transition-colors" />
                                    <input
                                        name="name"
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-textSecondary/50 focus:outline-none focus:border-accent transition-all"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">LDCE Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-textSecondary group-focus-within:text-accent transition-colors" />
                                    <input
                                        name="email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-textSecondary/50 focus:outline-none focus:border-accent transition-all"
                                        placeholder="example@ldce.ac.in"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">Enrollment No</label>
                                <div className="relative group">
                                    <Hash className="absolute left-4 top-3.5 h-5 w-5 text-textSecondary group-focus-within:text-accent transition-colors" />
                                    <input
                                        name="enrollmentNo"
                                        type="text"
                                        required
                                        value={formData.enrollmentNo}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-textSecondary/50 focus:outline-none focus:border-accent transition-all"
                                        placeholder="230280..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">Department</label>
                                <div className="relative group">
                                    <BookOpen className="absolute left-4 top-3.5 h-5 w-5 text-textSecondary group-focus-within:text-accent transition-colors" />
                                    <select
                                        name="department"
                                        required
                                        value={formData.department}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white appearance-none focus:outline-none focus:border-accent transition-all"
                                    >
                                        <option value="" disabled className="bg-bgPrimary">Select Department</option>
                                        <option value="Computer Engineering" className="bg-bgPrimary">Computer Engineering</option>
                                        <option value="Information Technology" className="bg-bgPrimary">Information Technology</option>
                                        <option value="Mechanical Engineering" className="bg-bgPrimary">Mechanical Engineering</option>
                                        <option value="Civil Engineering" className="bg-bgPrimary">Civil Engineering</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">Semester</label>
                                <div className="relative group">
                                    <Layers className="absolute left-4 top-3.5 h-5 w-5 text-textSecondary group-focus-within:text-accent transition-colors" />
                                    <select
                                        name="semester"
                                        required
                                        value={formData.semester}
                                        onChange={handleChange}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white appearance-none focus:outline-none focus:border-accent transition-all"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                            <option key={s} value={s} className="bg-bgPrimary">Semester {s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-3.5 h-5 w-5 text-textSecondary group-focus-within:text-accent transition-colors" />
                                        <input
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-textSecondary/50 focus:outline-none focus:border-accent transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">Confirm</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-3.5 h-5 w-5 text-textSecondary group-focus-within:text-accent transition-colors" />
                                        <input
                                            name="confirmPassword"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-textSecondary/50 focus:outline-none focus:border-accent transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-xs font-medium text-textSecondary hover:text-white transition-colors"
                        >
                            {showPassword ? "Hide Passwords" : "Show Passwords"}
                        </button>
                    </div>

                    {error && (
                        <div className="flex items-center space-x-2 text-error text-sm p-4 bg-error/10 border border-error/20 rounded-xl animate-pulse">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-accent hover:bg-accent/90 text-bgPrimary font-bold rounded-xl shadow-lg shadow-accent/20 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Registering...</span>
                            </>
                        ) : (
                            <span>Create Student Account</span>
                        )}
                    </button>

                    <p className="text-center text-sm text-textSecondary mt-6">
                        Already have an account? <Link to="/login" className="text-accent hover:underline font-bold">Sign In</Link>
                    </p>

                    <Link to="/register" className="flex items-center justify-center space-x-2 text-sm text-textSecondary hover:text-white transition-colors mt-4">
                        <ArrowLeft className="w-4 h-4" />
                        <span>Change Role</span>
                    </Link>
                </form>
            </div>
        </div>
    );
};
