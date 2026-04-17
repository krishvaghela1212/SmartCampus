import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, Variants } from 'framer-motion';
import {
  ArrowRight, Bot, Users, Calendar, Radio, CheckCircle, Smartphone, Shield, Zap, MousePointer2,
  Clock, MessageCircle, Megaphone, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, userRole, logout } = useAuth();
  const { scrollY } = useScroll();
  const yHero = useTransform(scrollY, [0, 800], [0, -60]);
  const opacityHero = useTransform(scrollY, [0, 600], [1, 0.15]);

  const handleLoginNavigation = () => {
    navigate('/dashboard');
  };

  const handleFacultyPortal = () => {
    if (token && userRole === UserRole.STUDENT) {
      // If a student tries to access faculty portal, we log them out first 
      // so they can actually see the login page for faculty instead of getting bounced.
      logout();
      navigate('/login');
    } else if (token && userRole === UserRole.FACULTY) {
      navigate('/faculty-dashboard');
    } else {
      navigate('/login');
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
    }
  };

  const features = [
    {
      icon: <Clock className="w-7 h-7" />,
      title: "Real-Time Tracking",
      desc: "Instant faculty availability status. Knowledge is power—know their status before you even head to their cabin."
    },
    {
      icon: <MessageCircle className="w-7 h-7" />,
      title: "AI Assistant",
      desc: "Powered by Gemini 3 Flash. Get instant answers to complex academic queries, policy summaries, and more."
    },
    {
      icon: <Megaphone className="w-7 h-7" />,
      title: "Smart Broadcasts",
      desc: "Real-time alerts for class cancellations, events, or deadlines directly from the HOD and professors."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-bgPrimary overflow-x-hidden">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-accent/3 rounded-full blur-[80px] will-change-transform"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-emerald-500/3 rounded-full blur-[80px] will-change-transform"></div>
      </div>

      {/* Persistent Dark Glass Navbar */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-bgPrimary/80 border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center space-x-2 sm:space-x-3 cursor-pointer"
            onClick={() => window.location.reload()}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg border border-white/10 transition-transform">
              <img src="/favicon.jpeg" alt="EasyConnect Logo" className="w-6 h-6 sm:w-7 sm:h-7 object-contain" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-bold tracking-tight text-white">EasyConnect</span>
              <span className="text-[8px] sm:text-[10px] block text-accent tracking-widest uppercase font-bold text-glow">L.D.C.E.</span>
            </div>
          </motion.div>

          <div className="flex items-center space-x-3 sm:space-x-8">
            <button
              onClick={handleFacultyPortal}
              className="text-xs sm:text-sm font-medium text-textSecondary hover:text-white transition-colors hidden sm:block"
            >
              Faculty Portal
            </button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(46, 204, 113, 0.2)' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLoginNavigation}
              className="px-4 py-2 sm:px-6 sm:py-2.5 bg-accent/10 border border-accent/30 text-accent rounded-full text-[10px] sm:text-sm font-bold transition-all hover:bg-accent hover:text-bgPrimary"
            >
              Get Started
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Hero Content Area */}
      <main className="flex-1 relative">
        <motion.div
          style={{ y: yHero, opacity: opacityHero }}
          className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-20 sm:pb-32 flex flex-col items-center text-center relative z-10"
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-5xl"
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-wider mb-8 glow-accent"
            >
              <Zap className="w-3.5 h-3.5 animate-pulse" />
              <span>Transforming Campus Connectivity</span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-6xl md:text-8xl font-extrabold tracking-tight text-white mb-6 sm:mb-8 leading-[1.2] sm:leading-[1.1] text-center px-2"
            >
              Bridging the Gap
              <br />
              between
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-emerald-400 to-accent">
                Faculty & Students.
              </span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-lg md:text-2xl text-textSecondary mb-12 max-w-3xl mx-auto leading-relaxed font-light"
            >
              Ditch the office-hopping. Experience seamless faculty tracking, automated appointment booking, and AI-powered support in one futuristic hub.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full max-w-md sm:max-w-none">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 20px 30px -10px rgba(46, 204, 113, 0.4)" }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLoginNavigation}
                className="w-full sm:w-auto px-10 py-4 sm:py-5 bg-gradient-to-r from-accent to-emerald-600 text-bgPrimary rounded-2xl font-bold text-base sm:text-lg transition-all flex items-center justify-center shadow-xl group"
              >
                Launch Dashboard
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.05)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-10 py-4 sm:py-5 bg-transparent border border-white/10 text-white rounded-2xl font-semibold text-base sm:text-lg transition-all"
              >
                See Features
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Stat Cards */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full max-w-5xl"
          >
            {[
              { label: "Faculty Members", value: "50+" },
              { label: "Active Students", value: "2K+" },
              { label: "AI Requests", value: "10K+" },
              { label: "Uptime", value: "99.9%" }
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5, borderColor: 'rgba(46, 204, 113, 0.3)' }}
                className="bg-card/30 border border-white/5 p-6 rounded-2xl backdrop-blur-sm transition-all"
              >
                <span className="block text-4xl font-bold text-white mb-2">{stat.value}</span>
                <span className="text-xs text-textSecondary uppercase tracking-[0.2em] font-bold">{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Features Section */}
        <section id="features" className="py-20 sm:py-32 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              className="text-center mb-16 sm:mb-20"
            >
              <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4 sm:mb-6">Built for Excellence</h2>
              <p className="text-textSecondary text-base sm:text-lg max-w-2xl mx-auto px-2">Modern problems require modern solutions. Here's how we're changing the campus experience.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 40, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: idx * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                  viewport={{ once: true }}
                  whileHover={{ y: -10, rotateY: 5, rotateX: 5 }}
                  className="p-10 rounded-3xl glass border border-white/10 relative group overflow-hidden preserve-3d"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    {React.cloneElement(feature.icon as React.ReactElement, { size: 100 } as any)}
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-bgSecondary to-black rounded-2xl border border-white/10 flex items-center justify-center mb-8 group-hover:border-accent/40 group-hover:glow-accent transition-all duration-500">
                    <div className="text-accent group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-textSecondary leading-relaxed text-lg">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Dynamic CTA */}
        <section className="py-32 px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-6xl mx-auto rounded-[40px] bg-gradient-to-br from-accent/10 via-bgSecondary to-emerald-950/20 border border-white/5 p-12 md:p-24 text-center relative overflow-hidden group shadow-2xl"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(46,204,113,0.1)_0,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

            <div className="relative z-10">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-6xl font-bold text-white mb-8"
              >
                Ready to experience the <br />
                <span className="text-accent text-glow">Future of Campus life?</span>
              </motion.h2>
              <p className="text-xl text-textSecondary mb-12 max-w-2xl mx-auto">Join the digital revolution at L.D. College of Engineering today.</p>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(46, 204, 113, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLoginNavigation}
                className="px-12 py-6 bg-white text-bgPrimary rounded-2xl font-extrabold text-xl hover:bg-accent transition-all shadow-2xl"
              >
                Get Early Access
              </motion.button>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black/40 border-t border-white/5 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-20">
            <div className="max-w-md">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                  <img src="/favicon.jpeg" alt="EasyConnect Logo" className="w-6 h-6 object-contain" />
                </div>
                <span className="text-2xl font-bold text-white tracking-tight">EasyConnect</span>
              </div>
              <p className="text-textSecondary text-lg leading-relaxed">
                Empowering the legacy of L.D. College of Engineering with state-of-the-art interaction technology. Built by students, for the campus.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-20">
              <div>
                <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Platform</h4>
                <ul className="space-y-4 text-textSecondary">
                  <li onClick={handleFacultyPortal} className="hover:text-accent cursor-pointer transition-colors">Faculty Portal</li>
                  <li onClick={handleLoginNavigation} className="hover:text-accent cursor-pointer transition-colors">Student Portal</li>
                  <li className="hover:text-accent cursor-pointer transition-colors">Support</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">Connect</h4>
                <ul className="space-y-4 text-textSecondary">
                  <li className="hover:text-accent cursor-pointer transition-colors">Twitter</li>
                  <li className="hover:text-accent cursor-pointer transition-colors">LinkedIn</li>
                  <li className="hover:text-accent cursor-pointer transition-colors">GitHub</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center text-sm text-textSecondary gap-6">
            <p>&copy; {new Date().getFullYear()} EasyConnect LDCE. Built with precision and passion.</p>

            <div className="flex items-center space-x-6">
              <span className="font-medium text-white/40">The Team:</span>
              <div className="flex space-x-4 text-accent font-semibold">
                <span className="hover:text-white transition-colors cursor-default">Krish Vaghela</span>
                <span className="hover:text-white transition-colors cursor-default">Riya Nandasana</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
