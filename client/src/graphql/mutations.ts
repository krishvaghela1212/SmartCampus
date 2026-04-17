import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        name
        email
        role
        department
        enrollmentNo
        facultyId
        designation
        semester
        image
      }
    }
  }
`;

export const REGISTER_STUDENT_MUTATION = gql`
  mutation RegisterStudent($input: StudentRegisterInput!) {
    registerStudent(input: $input) {
      token
      user {
        id
        name
        email
        role
      }
    }
  }
`;

export const REGISTER_FACULTY_MUTATION = gql`
  mutation RegisterFaculty($input: FacultyRegisterInput!) {
    registerFaculty(input: $input) {
      token
      user {
        id
        name
        email
        role
        department
      }
    }
  }
`;

export const BOOK_APPOINTMENT = gql`
  mutation BookAppointment($facultyId: ID!, $date: String!, $startTime: String!, $endTime: String!, $subject: String!) {
    bookAppointment(facultyId: $facultyId, date: $date, startTime: $startTime, endTime: $endTime, subject: $subject) {
      id
      date
      startTime
      endTime
      status
      subject
      student {
        id
        name
      }
      faculty {
        id
        name
      }
    }
  }
`;

export const UPDATE_APPOINTMENT_STATUS = gql`
  mutation UpdateAppointmentStatus($id: ID!, $status: String!) {
    updateAppointmentStatus(id: $id, status: $status) {
      id
      status
      date
      startTime
      endTime
      subject
      student {
        id
        name
      }
      faculty {
        id
        name
      }
    }
  }
`;

export const SEND_BROADCAST = gql`
  mutation SendBroadcast($message: String!, $department: String, $targetSemester: String) {
    sendBroadcast(message: $message, department: $department, targetSemester: $targetSemester) {
      id
      message
      department
      targetSemester
      createdAt
      faculty {
        id
        name
      }
    }
  }
`;

export const CHAT_MUTATION = gql`
  mutation Chat($message: String!, $history: [HistoryInput]) {
    chat(message: $message, history: $history) {
      text
    }
  }
`;

export const UPDATE_FACULTY_STATUS = gql`
  mutation UpdateFacultyStatus($status: FacultyStatusEnum!, $nextAvailableAt: String) {
    updateFacultyStatus(status: $status, nextAvailableAt: $nextAvailableAt) {
      status
      nextAvailableAt
      lastUpdated
    }
  }
`;

export const UPDATE_WEEKLY_SCHEDULE = gql`
  mutation UpdateWeeklySchedule($days: [DayScheduleInput]!) {
    updateWeeklySchedule(days: $days) {
      id
      days {
        day
        slots {
          startTime
          endTime
          label
        }
        isDayOff
      }
    }
  }
`;

export const UPSERT_DATE_OVERRIDE = gql`
  mutation UpsertDateOverride($date: String!, $slots: [TimeSlotInput], $isDayOff: Boolean, $note: String) {
    upsertDateOverride(date: $date, slots: $slots, isDayOff: $isDayOff, note: $note) {
      date
      slots {
        startTime
        endTime
      }
      isDayOff
      note
    }
  }
`;

export const SAVE_FACULTY_NOTE = gql`
  mutation SaveFacultyNote($date: String!, $content: String!) {
    saveFacultyNote(date: $date, content: $content) {
      id
      date
      content
    }
  }
`;

export const REQUEST_NOTIFICATION = gql`
  mutation RequestNotification($facultyId: ID!) {
    requestNotification(facultyId: $facultyId)
  }
`;
