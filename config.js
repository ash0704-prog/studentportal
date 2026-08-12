/**
 * Firebase Configuration
 * =====================
 * This file contains Firebase project configuration.
 * Replace the placeholder values with your actual Firebase credentials.
 * 
 * DO NOT commit this file with real credentials to version control.
 * Consider using environment variables in production.
 */

// ============================================
// FIREBASE CONFIGURATION
// ============================================
// Get these values from Firebase Console > Project Settings > General

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDjRaqpEMA9PdYMpkTdvo2qeyr0UsyDPi0",
  authDomain: "college-attendance-syste-3ce1d.firebaseapp.com",
  projectId: "college-attendance-syste-3ce1d",
  storageBucket: "college-attendance-syste-3ce1d.firebasestorage.app",
  messagingSenderId: "800122622361",
  appId: "1:800122622361:web:0d96dc4210e919ce84c308",
  measurementId: "G-1WYTCPE2YJ"
};

// ============================================
// FIREBASE COLLECTIONS & REFERENCES
// ============================================
// Define Firestore collection paths and database references

const DATABASE_CONFIG = {
    // Firestore Collections
    COLLECTIONS: {
        STUDENTS: 'students',           // Student profile data
        ATTENDANCE: 'attendance',       // Attendance records
        GRADES: 'grades',              // Grade records
        COURSES: 'courses',            // Course information
        SESSIONS: 'sessions'           // Login sessions for security
    },

    // Realtime Database paths (if using)
    PATHS: {
        STUDENTS: '/students',
        ATTENDANCE: '/attendance',
        GRADES: '/grades'
    },

    // Firestore subcollections
    SUBCOLLECTIONS: {
        ATTENDANCE_RECORDS: 'records',  // Under students/{studentId}/attendance
        GRADE_RECORDS: 'records'       // Under students/{studentId}/grades
    },

    // Authentication settings
    AUTH: {
        SIGN_OUT_ON_INACTIVE: true,    // Auto sign out on inactivity
        INACTIVE_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
        PASSWORD_MIN_LENGTH: 8,
        PASSWORD_REQUIRE_UPPERCASE: true,
        PASSWORD_REQUIRE_LOWERCASE: true,
        PASSWORD_REQUIRE_NUMBERS: true,
        PASSWORD_REQUIRE_SPECIAL: true
    },

    // Data retention
    DATA_RETENTION: {
        SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
        REMEMBER_ME_DURATION: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
};

// ============================================
// PLACEHOLDER DATABASE DOCUMENT STRUCTURES
// ============================================

/**
 * STUDENTS Collection Document Structure:
 * 
 * {
 *   rollNumber: "CSE001",
 *   firstName: "John",
 *   lastName: "Doe",
 *   dateOfBirth: "1998-05-15",
 *   email: "john.doe@university.edu",
 *   phone: "+91-9876543210",
 *   password: "hashed_password",
 *   passwordChanged: true,
 *   firstLoginAt: timestamp,
 *   lastLoginAt: timestamp,
 *   semester: 4,
 *   department: "Computer Science",
 *   enrollmentDate: "2022-08-15",
 *   gpa: 3.75,
 *   status: "active",
 *   address: "123 Main St, City",
 *   createdAt: timestamp,
 *   updatedAt: timestamp,
 *   profileComplete: true
 * }
 */

/**
 * ATTENDANCE Collection Document Structure:
 * 
 * {
 *   studentId: "docId",
 *   rollNumber: "CSE001",
 *   courseId: "CS101",
 *   courseName: "Data Structures",
 *   semester: 4,
 *   date: "2024-08-08",
 *   status: "present", // "present", "absent", "leave"
 *   markedBy: "faculty_email",
 *   markedAt: timestamp,
 *   remarks: ""
 * }
 */

/**
 * GRADES Collection Document Structure:
 * 
 * {
 *   studentId: "docId",
 *   rollNumber: "CSE001",
 *   courseId: "CS101",
 *   courseCode: "CS101",
 *   courseName: "Data Structures",
 *   credits: 4,
 *   semester: 4,
 *   internalMarks: 35,
 *   externalMarks: 45,
 *   totalMarks: 80,
 *   grade: "A",
 *   gradePoints: 4.0,
 *   publishedAt: timestamp
 * }
 */

/**
 * COURSES Collection Document Structure:
 * 
 * {
 *   courseCode: "CS101",
 *   courseName: "Data Structures",
 *   credits: 4,
 *   semester: 4,
 *   department: "Computer Science",
 *   faculty: "Dr. John Smith",
 *   description: "...",
 *   startDate: "2024-08-01",
 *   endDate: "2024-12-31"
 * }
 */

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validates Firebase configuration
 * @returns {boolean} True if all required fields are present
 */
function validateFirebaseConfig() {
    const requiredFields = [
        'apiKey', 'authDomain', 'projectId', 
        'storageBucket', 'messagingSenderId', 'appId'
    ];
    
    for (const field of requiredFields) {
        if (!firebaseConfig[field] || 
            firebaseConfig[field].includes('YOUR_') ||
            firebaseConfig[field] === '') {
            console.error(`Firebase configuration incomplete: ${field}`);
            return false;
        }
    }
    
    return true;
}

/**
 * Gets the configured Firebase app
 * Note: This will be implemented after Firebase Admin SDK is initialized
 * 
 * @returns {Object} Firebase app instance
 */
function getFirebaseApp() {
    // PLACEHOLDER: Firebase app initialization
    // This will be replaced with actual Firebase initialization in main.js
    console.log('Firebase app placeholder - configure in main.js');
    return null;
}

/**
 * Gets Firestore database instance
 * PLACEHOLDER: Will be implemented when Firebase is initialized
 * 
 * @returns {Object} Firestore database instance
 */
function getFirestore() {
    // PLACEHOLDER: Firestore instance
    console.log('Firestore placeholder - configure in main.js');
    return null;
}

/**
 * Gets Authentication instance
 * PLACEHOLDER: Will be implemented when Firebase is initialized
 * 
 * @returns {Object} Firebase Auth instance
 */
function getAuth() {
    // PLACEHOLDER: Auth instance
    console.log('Auth placeholder - configure in main.js');
    return null;
}

// ============================================
// EXPORT CONFIGURATION
// ============================================

const StudentPortalConfig = {
    firebase: firebaseConfig,
    database: DATABASE_CONFIG,
    validate: validateFirebaseConfig,
    getApp: getFirebaseApp,
    getFirestore: getFirestore,
    getAuth: getAuth
};
