
import Appointment from '../../models/Appointment.model.js';
import User from '../../models/User.model.js';
import { sendEmail } from '../../services/email.service.js';

const DOMAIN_RESTRICTION = '@ldce.ac.in';

export const bookAppointment = async (studentId, facultyId, date, startTime, endTime, subject) => {
    const student = await User.findById(studentId);
    const faculty = await User.findById(facultyId);
    
    if (!student || !faculty) throw new Error('User not found');

    const appointment = await Appointment.create({
        studentId,
        facultyId,
        date,
        startTime,
        endTime,
        subject,
        status: 'Pending'
    });

    // Send notification to faculty if student has correct domain
    if (student.email.endsWith(DOMAIN_RESTRICTION)) {
        try {
            await sendEmail(
                faculty.email,
                `New Appointment Request: ${subject}`,
                `Dear Prof. ${faculty.name},\n\nYou have a new appointment request from ${student.name} for ${date} at ${startTime}.\n\nPlease login to Smart Campus to approve or reject this request.\n\nBest regards,\nSmart Campus Team`
            );
        } catch (error) {
            console.error('Failed to send appointment notification to faculty:', error);
        }
    }

    return appointment;
};

export const getMyAppointments = async (userId, role) => {
    if (role === 'STUDENT') {
        return await Appointment.find({ studentId: userId }).populate(['studentId', 'facultyId']);
    } else {
        return await Appointment.find({ facultyId: userId }).populate(['studentId', 'facultyId']);
    }
};

export const updateAppointmentStatus = async (id, status, facultyId) => {
    const appointment = await Appointment.findById(id).populate(['studentId', 'facultyId']);
    if (!appointment) throw new Error('Appointment not found');

    if (appointment.facultyId._id.toString() !== facultyId) {
        throw new Error('Unauthorized');
    }

    appointment.status = status;
    await appointment.save();

    const student = appointment.studentId;
    const faculty = appointment.facultyId;

    // Notify student if they have correct domain
    if (student.email.endsWith(DOMAIN_RESTRICTION)) {
        try {
            await sendEmail(
                student.email,
                `Appointment Update: ${status}`,
                `Dear ${student.name},\n\nYour appointment request with Prof. ${faculty.name} for ${appointment.date} has been ${status.toUpperCase()}.\n\nLog in to Smart Campus for more details.\n\nBest regards,\nSmart Campus Team`
            );
        } catch (error) {
            console.error('Failed to send status update notification to student:', error);
        }
    }

    return appointment;
};
