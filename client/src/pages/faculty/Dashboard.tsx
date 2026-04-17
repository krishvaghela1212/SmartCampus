import React, { useState, useEffect } from 'react';
import { Faculty, FacultyStatus, Appointment, ChatMessage, BroadcastMessage, WeeklySchedule, DateOverride } from '@/types';
import { Edit2, Megaphone, Check, Calendar, Settings, CheckCircle2, XCircle, Clock, User, Bot, Send, BrainCircuit, Trash2 } from 'lucide-react';
import { WeeklyScheduleEditor } from '@/components/WeeklyScheduleEditor';
import { DateOverridesEditor } from '@/components/DateOverridesEditor';
import { storageService } from '@/services/storageService';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useMutation } from '@apollo/client/react';
import { CHAT_MUTATION, UPDATE_APPOINTMENT_STATUS, UPDATE_FACULTY_STATUS } from '@/graphql/mutations';

interface FacultyDashboardProps {
  currentFaculty: Faculty;
  appointments: Appointment[];
  myBroadcasts: BroadcastMessage[];
  scheduleData?: {
    myWeeklySchedule: WeeklySchedule;
    myDateOverrides: DateOverride[];
    myNotes: any[];
  };
  onUpdateStatus: (id: string, status: FacultyStatus) => void; // Keeps original signature for App.tsx compatibility, but we might bypass it
  onPostBroadcast: (message: string, targetSemester: string) => void;
  onRefreshSchedule: () => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }
};

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({
  currentFaculty,
  appointments,
  myBroadcasts,
  scheduleData,
  onUpdateStatus, // We will use local mutation for expanded args
  onPostBroadcast,
  onRefreshSchedule
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'assistant' | 'schedule'>('overview');

  // Status State
  const [status, setStatus] = useState<FacultyStatus>(currentFaculty.availability?.status || FacultyStatus.AVAILABLE);
  const [nextSlot, setNextSlot] = useState(currentFaculty.availability?.nextAvailableAt ? new Date(Number(currentFaculty.availability.nextAvailableAt)).toISOString().slice(0, 16) : '');

  const [broadcastText, setBroadcastText] = useState('');
  const [targetSemester, setTargetSemester] = useState('ALL');
  const [isSaved, setIsSaved] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'model', text: `Hello ${currentFaculty.name}! I am your AI Teaching Assistant. I can help you draft emails to students, generate quiz questions, or summarize leave requests.`, timestamp: Date.now() }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Mutations
  const [updateAptMutation] = useMutation(UPDATE_APPOINTMENT_STATUS);
  const [chatMutation, { loading: isChatLoading }] = useMutation<{ chat: { text: string } }>(CHAT_MUTATION);
  const [updateStatusMutation] = useMutation(UPDATE_FACULTY_STATUS);

  // Sync state with props if they change (e.g. from subscription)
  useEffect(() => {
    if (currentFaculty.availability?.status) {
      setStatus(currentFaculty.availability.status);
    }
    if (currentFaculty.availability?.nextAvailableAt) {
      // Handle potentially different formats if server sends ISO or timestamp
      const val = currentFaculty.availability.nextAvailableAt;
      const dateVal = isNaN(Number(val)) ? new Date(val) : new Date(Number(val));
      if (!isNaN(dateVal.getTime())) {
        // For datetime-local input, we need YYYY-MM-DDTHH:mm
        // Adjust for timezone offset to show local time correct in input
        const offset = dateVal.getTimezoneOffset() * 60000; // ms
        const localISOTime = (new Date(dateVal.getTime() - offset)).toISOString().slice(0, 16);
        setNextSlot(localISOTime);
      }
    }
  }, [currentFaculty.availability]);

  const handleStatusSave = async () => {
    try {
      // Convert local datetime to UTC timestamp/ISO for server
      let nextAvailableAt = null;
      if (nextSlot) {
        nextAvailableAt = new Date(nextSlot).getTime().toString();
      }

      await updateStatusMutation({
        variables: {
          status,
          nextAvailableAt
        }
      });

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (e: any) {
      alert("Failed to update status: " + e.message);
    }
  };

  const handlePost = () => {
    if (!broadcastText.trim()) return;
    onPostBroadcast(broadcastText, targetSemester);
    setBroadcastText('');
    setTargetSemester('ALL');
    alert('Broadcast posted successfully!');
  };

  const handleDeleteBroadcast = (id: string) => {
    if (window.confirm("Remove this announcement?")) {
      alert("Deleting broadcasts is not yet supported by the server API.");
    }
  };

  const handleAppointmentAction = async (aptId: string, newStatus: 'Confirmed' | 'Cancelled' | 'Deleted') => {
    if (newStatus === 'Deleted') {
      if (window.confirm("Permanently delete this appointment record?")) {
        // Server delete not implemented in mutation yet
        alert("Deletion not supported yet.");
      }
    } else {
      try {
        // Map status to schema values (Approved/Rejected/Cancelled)
        const schemaStatus = newStatus === 'Confirmed' ? 'Approved' : 'Rejected'; // Or Cancelled
        await updateAptMutation({
          variables: { id: aptId, status: schemaStatus }
        });
      } catch (err: any) {
        alert(err.message || "Failed to update appointment");
      }
    }
  };

  const handleAssistantSend = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: chatInput,
      timestamp: Date.now()
    };

    // Format history to match GraphQL HistoryInput schema: { role, parts: [{ text }] }
    const history = chatMessages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');

    try {
      const { data } = await chatMutation({
        variables: {
          message: userMsg.text,
          history: history
        }
      });

      // Safe response handling - guard against undefined
      const responseText = data?.chat?.text || "I couldn't process that request. Please try again.";

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, botMsg]);
    } catch (error: any) {
      console.error('Chat error:', error);

      // Extract meaningful error message
      let errorMessage = "Sorry, I'm having trouble responding. Please try again.";
      if (error?.graphQLErrors?.length > 0) {
        errorMessage = error.graphQLErrors[0].message;
      } else if (error?.networkError) {
        errorMessage = "Cannot connect to server.";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: errorMessage,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, errorMsg]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-nowrap overflow-x-auto scrollbar-hide gap-1.5 bg-card w-full md:w-fit p-1 rounded-xl border border-border">
          {['overview', 'appointments', 'assistant', 'schedule'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center capitalize whitespace-nowrap shrink-0 ${activeTab === tab ? 'bg-bgPrimary text-accent shadow-md ring-1 ring-accent/20' : 'text-textSecondary hover:text-textPrimary hover:bg-white/5'
                }`}
            >
              {tab === 'overview' && <Settings className="w-4 h-4 mr-2" />}
              {tab === 'appointments' && <Calendar className="w-4 h-4 mr-2" />}
              {tab === 'assistant' && <BrainCircuit className="w-4 h-4 mr-2" />}
              {tab === 'schedule' && <Clock className="w-4 h-4 mr-2" />}
              {tab}
            </button>
          ))}
        </div>
        <button
          className="px-4 py-2 bg-card border border-border rounded-xl hover:bg-bgSecondary text-textSecondary hover:text-accent transition-all shadow-sm flex items-center justify-center gap-2 group self-end md:self-auto cursor-default"
        >
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
          <span className="text-xs font-semibold">Live Sync</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <motion.div variants={itemVariants} className="bg-card rounded-xl border border-border p-6 h-fit shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-textPrimary flex items-center">
                  <Edit2 className="w-5 h-5 mr-2 text-accent" />
                  Update Availability
                </h2>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-3">Current Status</label>
                  <div className="grid grid-cols-1 gap-3">
                    {[FacultyStatus.AVAILABLE, FacultyStatus.BUSY, FacultyStatus.NOT_AVAILABLE].map(s => (
                      <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${status === s
                          ? `bg-${s === FacultyStatus.AVAILABLE ? 'emerald' : s === FacultyStatus.BUSY ? 'amber' : 'red'}-500/10 border-${s === FacultyStatus.AVAILABLE ? 'emerald' : s === FacultyStatus.BUSY ? 'amber' : 'red'}-500 text-${s === FacultyStatus.AVAILABLE ? 'emerald' : s === FacultyStatus.BUSY ? 'amber' : 'red'}-500 ring-1 ring-${s === FacultyStatus.AVAILABLE ? 'emerald' : s === FacultyStatus.BUSY ? 'amber' : 'red'}-500`
                          : 'bg-bgSecondary border-border text-textSecondary hover:border-textPrimary'
                          }`}
                      >
                        <div className="flex items-center">
                          {s === FacultyStatus.AVAILABLE && <CheckCircle2 className="w-5 h-5 mr-3" />}
                          {s === FacultyStatus.BUSY && <Calendar className="w-5 h-5 mr-3" />}
                          {s === FacultyStatus.NOT_AVAILABLE && <XCircle className="w-5 h-5 mr-3" />}
                          <span className="font-semibold">{s}</span>
                        </div>
                        {status === s && <div className={`w-2 h-2 rounded-full bg-${s === FacultyStatus.AVAILABLE ? 'emerald' : s === FacultyStatus.BUSY ? 'amber' : 'red'}-500`}></div>}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-2">Next Available At</label>
                  <input
                    type="datetime-local"
                    value={nextSlot}
                    onChange={(e) => setNextSlot(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-bgPrimary border border-border text-textPrimary focus:ring-1 focus:ring-accent focus:border-accent outline-none"
                  />
                  <p className="text-xs text-textSecondary mt-1">Students will see this time on your profile.</p>
                </div>
                <div className="flex justify-end pt-2">
                  <button onClick={handleStatusSave} className={`flex items-center px-6 py-2.5 rounded-lg text-bgPrimary font-bold transition-all shadow-lg ${isSaved ? 'bg-emerald-500' : 'bg-accent hover:bg-accentHover shadow-accent/20'}`}>
                    {isSaved ? <><Check className="w-4 h-4 mr-2" /> Live Updated!</> : 'Publish Status'}
                  </button>
                </div>
              </div>
            </motion.div>
            <motion.div variants={itemVariants} className="bg-card rounded-xl border border-border p-6 h-fit shadow-lg flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-textPrimary flex items-center mb-4">
                  <Megaphone className="w-5 h-5 mr-2 text-warning" /> Student Broadcast
                </h2>
                <textarea value={broadcastText} onChange={(e) => setBroadcastText(e.target.value)} placeholder="e.g. BE Sem 6 Class for today is rescheduled to 2 PM in Lab 4." className="w-full h-24 p-4 bg-bgPrimary border border-border text-textPrimary rounded-lg focus:ring-1 focus:ring-warning focus:border-warning outline-none resize-none placeholder-textSecondary" />
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="w-full sm:w-48">
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-textSecondary mb-1.5 ml-1">Target Semester</label>
                    <select 
                      value={targetSemester} 
                      onChange={(e) => setTargetSemester(e.target.value)}
                      className="w-full bg-bgPrimary border border-border text-textPrimary text-xs rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-warning transition-all"
                    >
                      <option value="ALL">All Semesters</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                        <option key={s} value={s.toString()}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                  <button onClick={handlePost} disabled={!broadcastText.trim()} className="w-full sm:w-auto bg-warning text-bgPrimary px-6 py-2.5 rounded-lg font-bold hover:bg-yellow-600 disabled:opacity-50 transition-colors shadow-lg shadow-warning/10">Post Broadcast</button>
                </div>
              </div>
              {myBroadcasts.length > 0 && (
                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-bold text-textPrimary mb-3">Your Active Announcements</h3>
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                    {myBroadcasts.map(b => (
                      <div key={b.id} className="bg-bgSecondary p-3 rounded-lg text-sm flex justify-between items-start group">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="text-textPrimary leading-snug">{b.message}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border border-warning/30 bg-warning/10 text-warning font-bold`}>
                              {b.targetSemester === 'ALL' ? 'ALL SEM' : `SEM ${b.targetSemester}`}
                            </span>
                          </div>
                          <p className="text-xs text-textSecondary mt-1">{new Date(Number(b.createdAt)).toLocaleString()}</p>
                        </div>
                        <button onClick={() => handleDeleteBroadcast(b.id)} className="text-textSecondary hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'appointments' && (
          <motion.div
            key="appointments"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-textPrimary">Student Appointments</h2>
            </div>
            {appointments.length === 0 ? (
              <motion.div variants={itemVariants} className="bg-card border border-border rounded-xl p-12 text-center">
                <Calendar className="w-16 h-16 text-textSecondary mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-semibold text-textPrimary">No appointments requests</h3>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {appointments.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((apt) => (
                  <motion.div key={apt.id} variants={itemVariants} className="bg-card border border-border rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-textSecondary">
                    <div className="flex items-start space-x-4">
                      <div className="bg-bgSecondary p-3 rounded-xl text-center min-w-[60px] border border-border">
                        <span className="block text-xs text-textSecondary font-bold uppercase">{new Date(apt.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                        <span className="block text-xl font-bold text-textPrimary">{new Date(apt.date).getDate()}</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-bold text-lg text-textPrimary">{apt.subject || apt.purpose}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${apt.status === 'Pending' ? 'bg-warning/10 text-warning border-warning' : apt.status === 'Confirmed' || apt.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500' : 'bg-red-500/10 text-red-500 border-red-500'}`}>{apt.status}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-textSecondary"><span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {apt.startTime} - {apt.endTime}</span><span className="flex items-center"><User className="w-3 h-3 mr-1" /> Student: {apt.studentName || 'Unknown'}</span></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {apt.status === 'Pending' && (
                        <><button onClick={() => handleAppointmentAction(apt.id, 'Cancelled')} className="px-4 py-2 border border-border text-textSecondary rounded-lg hover:border-red-500 transition-colors text-sm font-medium">Reject</button><button onClick={() => handleAppointmentAction(apt.id, 'Confirmed')} className="px-4 py-2 bg-accent text-bgPrimary rounded-lg hover:bg-accentHover transition-colors text-sm font-bold shadow-lg shadow-accent/20">Confirm Slot</button></>
                      )}
                      {(apt.status === 'Confirmed' || apt.status === 'Approved') && (
                        <button onClick={() => handleAppointmentAction(apt.id, 'Cancelled')} className="px-4 py-2 bg-bgSecondary text-textSecondary border border-border rounded-lg text-sm hover:text-error transition-colors">Cancel Appointment</button>
                      )}
                      {(apt.status === 'Cancelled' || apt.status === 'Rejected' || apt.status === 'Completed') && (
                        <button onClick={() => handleAppointmentAction(apt.id, 'Deleted')} className="p-2 text-textSecondary hover:text-error transition-colors"><Trash2 className="w-5 h-5" /></button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'assistant' && (
          <motion.div
            key="assistant"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]"
          >
            <div className="lg:col-span-2 bg-card rounded-xl border border-border overflow-hidden flex flex-col shadow-xl">
              <div className="bg-bgSecondary p-4 border-b border-border flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center"><BrainCircuit className="w-5 h-5 text-accent" /></div>
                <div><h3 className="font-bold text-textPrimary">Faculty AI Companion</h3><p className="text-xs text-textSecondary">Powered by Gemini 3 Flash</p></div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'model' && (<div className="w-8 h-8 rounded-full bg-bgSecondary flex items-center justify-center mr-2 border border-border flex-shrink-0"><Bot className="w-4 h-4 text-textSecondary" /></div>)}
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-accent text-bgPrimary rounded-br-none shadow-lg shadow-accent/10' : 'bg-bgSecondary border border-border text-textPrimary rounded-bl-none'}`}>{msg.text.split('\n').map((line, i) => <p key={i} className="mb-1 last:mb-0">{line}</p>)}</div>
                  </div>
                ))}
                {isChatLoading && <div className="flex justify-start"><div className="bg-bgSecondary px-4 py-2 rounded-2xl rounded-bl-none text-textSecondary text-xs border border-border animate-pulse">Generating response...</div></div>}
              </div>
              <div className="p-4 bg-bgSecondary/50 border-t border-border"><div className="flex space-x-2"><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAssistantSend()} placeholder="Ask something..." className="flex-1 bg-bgPrimary border border-border rounded-xl px-4 py-3 text-sm text-textPrimary focus:ring-1 focus:ring-accent outline-none" /><button onClick={handleAssistantSend} disabled={!chatInput.trim() || isChatLoading} className="p-3 bg-accent text-bgPrimary rounded-xl hover:bg-accentHover disabled:opacity-50 transition-colors shadow-lg"><Send className="w-5 h-5" /></button></div></div>
            </div>
          </motion.div>
        )}

        {activeTab === 'schedule' && (
          <motion.div
            key="schedule"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2">
              <WeeklyScheduleEditor schedule={scheduleData?.myWeeklySchedule} onRefresh={onRefreshSchedule} />
            </div>
            <div className="space-y-6">
              <DateOverridesEditor overrides={scheduleData?.myDateOverrides} onRefresh={onRefreshSchedule} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};