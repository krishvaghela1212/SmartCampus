import React from 'react';
import { Faculty, FacultyStatus } from '../types';
import { Clock, CheckCircle2, XCircle, MinusCircle, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface FacultyCardProps {
  faculty: Faculty;
  onNotify: (id: string) => void;
  onRequest: (id: string) => void;
  onViewProfile?: (faculty: Faculty) => void;
}

export const FacultyCard: React.FC<FacultyCardProps> = ({ faculty, onNotify, onRequest, onViewProfile }) => {
  const currentStatus = faculty.availability?.status || FacultyStatus.AVAILABLE;
  const nextAvailable = faculty.availability?.nextAvailableAt
    ? new Date(Number(faculty.availability.nextAvailableAt)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Unknown';

  const getStatusStyles = (status: FacultyStatus) => {
    switch (status) {
      case FacultyStatus.AVAILABLE:
        return {
          container: 'bg-emerald-500/10 border-emerald-500/20',
          badge: 'bg-emerald-100/10 text-emerald-400 border-emerald-500/20',
          glow: 'group-hover:shadow-emerald-500/10',
          icon: <CheckCircle2 className="w-4 h-4 mr-1.5" />
        };
      case FacultyStatus.BUSY:
        return {
          container: 'bg-amber-500/10 border-amber-500/20',
          badge: 'bg-amber-100/10 text-amber-400 border-amber-500/20',
          glow: 'group-hover:shadow-amber-500/10',
          icon: <MinusCircle className="w-4 h-4 mr-1.5" />
        };
      case FacultyStatus.NOT_AVAILABLE:
        return {
          container: 'bg-red-500/10 border-red-500/20',
          badge: 'bg-red-100/10 text-red-400 border-red-500/20',
          glow: 'group-hover:shadow-red-500/10',
          icon: <XCircle className="w-4 h-4 mr-1.5" />
        };
      default:
        return {
          container: 'bg-bgSecondary',
          badge: 'bg-gray-100/10 text-gray-400 border-gray-200/20',
          glow: 'group-hover:shadow-white/5',
          icon: <Clock className="w-4 h-4 mr-1.5" />
        };
    }
  };

  const styles = getStatusStyles(currentStatus);

  return (
    <motion.div
      whileHover={{
        y: -12,
        scale: 1.04,
        backgroundColor: "rgba(38, 38, 38, 1)",
        borderColor: "rgba(46, 204, 113, 0.5)",
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`bg-card rounded-2xl border border-border p-6 transition-all group relative overflow-hidden hover:shadow-2xl ${styles.glow}`}
    >
      {/* Decorative gradient corner */}
      <div className={`absolute -top-12 -right-12 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-40 transition-opacity ${currentStatus === FacultyStatus.AVAILABLE ? 'bg-emerald-500' :
        currentStatus === FacultyStatus.BUSY ? 'bg-amber-500' : 'bg-red-500'
        }`}></div>

      <div className="flex items-start space-x-4 cursor-pointer relative z-10" onClick={() => onViewProfile && onViewProfile(faculty)}>
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-bgSecondary border-2 border-border group-hover:border-accent flex items-center justify-center text-textSecondary group-hover:text-accent transition-all">
            <User className="w-8 h-8" />
          </div>
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-card ${currentStatus === FacultyStatus.AVAILABLE ? 'bg-emerald-500' :
            currentStatus === FacultyStatus.BUSY ? 'bg-amber-500' : 'bg-red-500'
            }`}></div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-textPrimary truncate leading-tight mb-1 group-hover:text-accent transition-colors">{faculty.name}</h3>
          <p className="text-xs text-textSecondary uppercase tracking-widest font-semibold mb-3">{faculty.designation || faculty.role}</p>

          <div className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold border ${styles.badge}`}>
            {styles.icon}
            {currentStatus}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-white/5 relative z-10">
        <div className="flex items-center justify-between text-xs mb-4 bg-bgSecondary/80 px-4 py-2 rounded-xl border border-white/5">
          <span className="text-textSecondary flex items-center font-medium"><Clock className="w-3.5 h-3.5 mr-2 text-accent" />Next Available:</span>
          <span className="font-bold text-textPrimary">{nextAvailable}</span>
        </div>

        <div className="flex space-x-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onRequest(faculty.id)}
            className="flex-1 bg-accent text-bgPrimary text-sm py-2.5 rounded-xl font-bold hover:bg-accentHover transition-all shadow-lg shadow-accent/20"
          >
            Request
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onViewProfile && onViewProfile(faculty)}
            className="flex items-center justify-center px-3.5 bg-bgSecondary text-textSecondary rounded-xl hover:bg-white/5 hover:text-textPrimary transition-all border border-white/5"
            title="View Profile"
          >
            <User className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};