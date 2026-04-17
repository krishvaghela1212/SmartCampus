import { gql } from '@apollo/client';

export const GET_FACULTIES = gql`
  query GetFaculties {
    faculties {
      id
      name
      email
      department
      role
      image
      designation
      currentStatus
      nextAvailableAt
      lastUpdated
      availability {
        status
        nextAvailableAt
        lastUpdated
      }
      weeklySchedule {
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
      dateOverrides {
        date
        slots {
          startTime
          endTime
          label
        }
        isDayOff
        note
      }
    }
  }
`;

export const GET_FACULTY = gql`
  query GetFaculty($id: ID!) {
    faculty(id: $id) {
      id
      name
      email
      department
      image
      designation
      currentStatus
      nextAvailableAt
      availability {
        status
        nextAvailableAt
        lastUpdated
      }
      weeklySchedule {
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
      dateOverrides {
        date
        slots {
          startTime
          endTime
          label
        }
        isDayOff
        note
      }
    }
  }
`;

export const GET_MY_APPOINTMENTS = gql`
  query GetMyAppointments {
    myAppointments {
      id
      date
      startTime
      endTime
      subject
      status
      student {
        id
        name
        email
        enrollmentNo
      }
      faculty {
        id
        name
      }
    }
  }
`;

export const GET_BROADCASTS = gql`
  query GetBroadcasts {
    broadcasts {
      id
      message
      department
      targetSemester
      createdAt
      faculty {
        id
        name
        image
      }
    }
  }
`;

export const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    getCurrentUser {
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
`;

export const GET_MY_SCHEDULE = gql`
  query GetMySchedule {
    myWeeklySchedule {
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
    myDateOverrides {
      id
      date
      slots {
        startTime
        endTime
        label
      }
      isDayOff
      note
    }
    myNotes {
      id
      date
      content
    }
  }
`;

export const FACULTY_STATUS_UPDATED = gql`
  subscription OnFacultyStatusUpdated {
    facultyStatusUpdated {
      id
      name
      email
      department
      designation
      image
      currentStatus
      nextAvailableAt
      lastUpdated
      availability {
        status
        nextAvailableAt
        lastUpdated
      }
    }
  }
`;

export const BROADCAST_ADDED = gql`
  subscription OnBroadcastAdded {
    broadcastAdded {
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

export const APPOINTMENT_UPDATED = gql`
  subscription OnAppointmentUpdated {
    appointmentUpdated {
      id
      date
      startTime
      endTime
      subject
      status
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
