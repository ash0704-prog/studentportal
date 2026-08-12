/**
 * Student Portal - Main Application File
 * =======================================
 * Initializes and coordinates all modules
 */

// ============================================
// APPLICATION STATE
// ============================================

let appState = {
    isInitialized: false,
    currentUser: null,
    studentProfile: null,
    attendanceData: [],
    gradesData: [],
    isFirstLogin: false
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Application initializing...');
    
    // Check if already authenticated
    if (authManager.isAuthenticated()) {
        const session = authManager.getSession();
        if (session) {
            loadDashboard();
        }
    }
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

console.log('Firebase initialized successfully');
    
    appState.isInitialized = true;
    console.log('Application ready');
    uiController.hideLoading();
});

// ============================================
// EVENT LISTENERS - LOGIN PAGE
// ============================================

function initializeEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Password form
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordChange);
    }

    // Password strength indicator
    const newPasswordInput = document.getElementById('newPassword');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function() {
            uiController.updatePasswordStrength(this.value);
        });
    }

    // Dashboard navigation
    const profileBtn = document.getElementById('profileBtn');
    const attendanceBtn = document.getElementById('attendanceBtn');
    const gradesBtn = document.getElementById('gradesBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (profileBtn) profileBtn.addEventListener('click', (e) => { e.preventDefault(); uiController.switchTab('profile'); });
    if (attendanceBtn) attendanceBtn.addEventListener('click', (e) => { e.preventDefault(); uiController.switchTab('attendance'); });
    if (gradesBtn) gradesBtn.addEventListener('click', (e) => { e.preventDefault(); uiController.switchTab('grades'); });
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    // Edit profile button
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', handleEditProfileOpen);
    }

    // Edit profile form
    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', handleEditProfileSave);
    }

    // Modal close buttons
    document.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => uiController.closeEditProfileModal());
    });

    // Tab filters
    const attendanceFilter = document.getElementById('attendanceFilter');
    const semesterFilter = document.getElementById('semesterFilter');

    if (attendanceFilter) {
        attendanceFilter.addEventListener('change', () => loadAttendanceData());
    }

    if (semesterFilter) {
        semesterFilter.addEventListener('change', () => loadGradesData());
    }

    // Session expiry event
    window.addEventListener('sessionExpired', () => {
        uiController.showNotification('Your session has expired. Please log in again.', 'info');
        handleLogout();
    });

    // Reset inactivity timer on user interaction
    document.addEventListener('click', () => {
        if (authManager.isAuthenticated()) {
            authManager.resetInactivityTimer();
        }
    });

    document.addEventListener('keypress', () => {
        if (authManager.isAuthenticated()) {
            authManager.resetInactivityTimer();
        }
    });
}

// ============================================
// LOGIN HANDLERS
// ============================================

async function handleLogin(e) {
    e.preventDefault();
    
    uiController.showLoading();
    uiController.hideError('loginError');

    try {
        const rollNumber = document.getElementById('rollNumber').value.trim();
        const dateOfBirth = document.getElementById('dateOfBirth').value;

        // Validate inputs
        if (!authManager.validateRollNumber(rollNumber)) {
            throw new Error('Please enter a valid roll number (e.g., CSE001)');
        }

        if (!authManager.validateDateOfBirth(dateOfBirth)) {
            throw new Error('Please enter a valid date of birth');
        }

        // Attempt login
        const loginResult = await authManager.login(rollNumber, dateOfBirth);

        if (!loginResult.success) {
            throw new Error(loginResult.error || 'Login failed');
        }

        appState.currentUser = loginResult.user;
        appState.isFirstLogin = loginResult.firstLogin;

        // Route to appropriate page
        if (loginResult.firstLogin) {
            // Set temporary password
            document.getElementById('tempPassword').value = dateOfBirth;
            uiController.navigateTo('password');
            uiController.showNotification('Welcome! Please create a secure password.', 'info');
        } else {
            loadDashboard();
        }

    } catch (error) {
        console.error('Login error:', error);
        uiController.showError('loginError', error.message);
    } finally {
        uiController.hideLoading();
    }
}

// ============================================
// PASSWORD MANAGEMENT HANDLERS
// ============================================

async function handlePasswordChange(e) {
    e.preventDefault();

    uiController.showLoading();
    uiController.hideError('passwordError');

    try {
        const tempPassword = document.getElementById('tempPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            throw new Error('Passwords do not match');
        }

        // Validate password strength
        const validation = authManager.validatePasswordStrength(newPassword);
        if (!validation.isValid) {
            throw new Error(validation.errors[0] || 'Password does not meet requirements');
        }

        // Update password
        const updateResult = await authManager.updatePasswordFirstLogin(tempPassword, newPassword);

        if (!updateResult.success) {
            throw new Error(updateResult.error || 'Failed to update password');
        }

        appState.isFirstLogin = false;
        uiController.showNotification('Password updated successfully!', 'success');
        
        // Load dashboard
        await loadDashboard();

    } catch (error) {
        console.error('Password update error:', error);
        uiController.showError('passwordError', error.message);
    } finally {
        uiController.hideLoading();
    }
}

// ============================================
// DASHBOARD HANDLERS
// ============================================

async function loadDashboard() {
    uiController.showLoading();

    try {
        const currentUser = authManager.getCurrentUser();
        
        if (!currentUser) {
            throw new Error('User not authenticated');
        }

        appState.currentUser = currentUser;

        // Populate profile
        appState.currentUser = currentUser;



// Load student data
await loadStudentData();

        // Load student data
       
        await loadAttendanceData();

        // Load grades data
        await loadGradesData();

        // Navigate to dashboard
        uiController.navigateTo('dashboard');

    } catch (error) {
        console.error('Dashboard load error:', error);
        uiController.showNotification('Error loading dashboard: ' + error.message, 'error');
        handleLogout();
    } finally {
        uiController.hideLoading();
    }
}

async function loadStudentData() {
    try {
        const currentUser = appState.currentUser;

        if (!currentUser) {
            throw new Error("Student is not logged in");
        }

        // Get roll number from login session
        const rollNumber =
            currentUser.rollNumber ||
            currentUser.studentId ||
            currentUser.id;

        console.log("Loading student profile for:", rollNumber);

        // Get real student document from Firestore
        const studentDoc = await firebase
            .firestore()
            .collection("students")
            .doc(rollNumber)
            .get();

        if (!studentDoc.exists) {
            throw new Error(
                "Student profile not found for " + rollNumber
            );
        }

        const data = studentDoc.data();

        console.log("REAL STUDENT PROFILE:", data);

        // Convert YOUR Firestore fields
        // into the fields used by the Student Portal UI
        const profile = {
            id: studentDoc.id,

            rollNumber: data.rollNo || rollNumber,

            firstName: data.name || "Student",
            lastName: "",

            email: data.email || "Not provided",

            phone: data.phone || "Not provided",

            dateOfBirth: data.dateOfBirth || "Not provided",

            semester: data.year || "Not available",

            department: data.department || "Not available",

            enrollmentDate:
                data.enrollmentDate || "Not available",

            gpa:
                data.gpa !== undefined && data.gpa !== null
                    ? Number(data.gpa)
                    : null,

            status: data.status || "Active",

            section: data.section || "Not available",

            year: data.year || "Not available"
        };

        // Save real profile
        appState.studentProfile = profile;

        // Display real profile
        uiController.populateStudentProfile(profile);

        console.log("FINAL STUDENT PROFILE:", profile);

    } catch (error) {
        console.error(
            "Error loading student profile:",
            error
        );

        uiController.showNotification(
            "Unable to load student profile: " + error.message,
            "error"
        );
    }
}
        
async function loadAttendanceData() {
    try {
        const currentUser = appState.currentUser;
        const filterValue = document.getElementById('attendanceFilter')?.value || 'all';

        if (!currentUser) return;

        const filters = {};
        if (filterValue === 'current') {
            filters.semester = currentUser.semester;
        }

        // PLACEHOLDER: Fetch from Firebase
        // appState.attendanceData = await studentDataManager.getAttendanceData(
        //     currentUser.id,
        //     currentUser.rollNumber,
        //     filters
        // );

        // For now, get mock data
        appState.attendanceData = await studentDataManager.getAttendanceData(
            currentUser.id,
            currentUser.rollNumber,
            filters
        );

        // Verify data ownership
          // Verify attendance data belongs to the logged-in student
const isDataValid = appState.attendanceData.every(record => {
    const recordStudentId = record.studentId;
    const currentStudentId = currentUser.id;

    return recordStudentId === currentStudentId;
});

if (!isDataValid) {
    throw new Error('Data ownership validation failed - student ID mismatch');
}

        if (!isDataValid) {
            throw new Error('Data ownership validation failed - security breach detected');
        }

        // Calculate statistics
        const stats = studentDataManager.calculateAttendanceStats(appState.attendanceData);
        const attendanceByCourse = studentDataManager.calculateAttendanceByCourse(appState.attendanceData);

        // Update UI
        uiController.populateAttendanceData(attendanceByCourse, stats);

    } catch (error) {
        console.error('Error loading attendance data:', error);
        uiController.showNotification('Error loading attendance: ' + error.message, 'error');
    }
}

async function loadGradesData() {
    try {
        const currentUser = appState.currentUser;
        const filterValue = document.getElementById('semesterFilter')?.value || 'all';

        if (!currentUser) return;

        const filters = {};
        if (filterValue !== 'all') {
            filters.semester = filterValue;
        }

        // PLACEHOLDER: Fetch from Firebase
        // appState.gradesData = await studentDataManager.getGradesData(
        //     currentUser.id,
        //     currentUser.rollNumber,
        //     filters
        // );

        // For now, get mock data
        appState.gradesData = await studentDataManager.getGradesData(
            currentUser.id,
            currentUser.rollNumber,
            filters
        );

        // Verify data ownership
        const isDataValid = appState.gradesData.every(grade => 
            studentDataManager.validateDataOwnership(grade.rollNumber || currentUser.rollNumber, currentUser.rollNumber)
        );

        if (!isDataValid) {
            throw new Error('Data ownership validation failed - security breach detected');
        }

        // Calculate statistics
        const gpaStats = studentDataManager.calculateGPAStats(appState.gradesData);

        // Update UI
        uiController.populateGradesData(appState.gradesData, gpaStats);

    } catch (error) {
        console.error('Error loading grades data:', error);
        uiController.showNotification('Error loading grades: ' + error.message, 'error');
    }
}

// ============================================
// PROFILE MANAGEMENT HANDLERS
// ============================================

function handleEditProfileOpen() {
    if (appState.studentProfile) {
        uiController.openEditProfileModal(appState.studentProfile);
    }
}

async function handleEditProfileSave(e) {
    e.preventDefault();

    uiController.showLoading();

    try {
        const email = document.getElementById('editEmail').value.trim();
        const phone = document.getElementById('editPhone').value.trim();
        const address = document.getElementById('editAddress').value.trim();

        // Validate email
        if (email && !uiController.validateEmail(email)) {
            throw new Error('Invalid email format');
        }

        // Validate phone
        if (phone && !uiController.validatePhone(phone)) {
            throw new Error('Invalid phone number format');
        }

        const updates = {
            email: email || appState.studentProfile.email,
            phone: phone || appState.studentProfile.phone,
            address: address || appState.studentProfile.address
        };

        // PLACEHOLDER: Update in Firebase
        // await studentDataManager.updateStudentProfile(
        //     appState.currentUser.id,
        //     updates
        // );

        // Simulate update
        await studentDataManager.updateStudentProfile(
            appState.currentUser.id,
            updates
        );

        // Update local data
        appState.studentProfile = { ...appState.studentProfile, ...updates };

        uiController.closeEditProfileModal();
        uiController.showNotification('Profile updated successfully!', 'success');

        // Refresh profile display
        uiController.populateStudentProfile(appState.studentProfile);

    } catch (error) {
        console.error('Profile update error:', error);
        uiController.showNotification('Error updating profile: ' + error.message, 'error');
    } finally {
        uiController.hideLoading();
    }
}

// ============================================
// LOGOUT HANDLER
// ============================================

function handleLogout(e) {
    if (e) e.preventDefault();

    try {
        // Clear app state
        appState = {
            isInitialized: true,
            currentUser: null,
            studentProfile: null,
            attendanceData: [],
            gradesData: [],
            isFirstLogin: false
        };

        // Clear auth session
        authManager.logout();

        // Reset forms
        document.getElementById('loginForm').reset();
        document.getElementById('passwordForm').reset();
        document.getElementById('editProfileForm').reset();

        // Navigate to login
        uiController.navigateTo('login');
        uiController.showNotification('Logged out successfully', 'info');

    } catch (error) {
        console.error('Logout error:', error);
    }
}

// ============================================
// FIREBASE INITIALIZATION (PLACEHOLDER)
// ============================================

/**
 * PLACEHOLDER: Initialize Firebase
 * This function will be implemented when Firebase SDK is added
 * 
 * To integrate Firebase:
 * 1. Add Firebase SDK script tags to HTML
 * 2. Replace placeholder functions in config.js
 * 3. Implement Firestore queries to replace mock data
 * 4. Set up Firebase Security Rules to enforce data ownership
 */
function initializeFirebase() {
    console.log('Firebase initialization placeholder');
    console.log('See README.md for integration instructions');
    
    // PLACEHOLDER: Firebase setup code
    // if (!StudentPortalConfig.validate()) {
    //     console.error('Firebase configuration invalid');
    //     uiController.showNotification('Configuration error', 'error');
    //     return;
    // }
    // 
    // const app = initializeApp(firebaseConfig);
    // const auth = getAuth(app);
    // const db = getFirestore(app);
    // 
    // // Replace placeholder functions
    // authManager.firebaseAuth = auth;
    // studentDataManager.firestore = db;
}

// ============================================
// ERROR HANDLING
// ============================================

window.addEventListener('error', function(event) {
    console.error('Unhandled error:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
});

// ============================================
// EXPORT FOR TESTING
// ============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        appState,
        handleLogin,
        handleLogout,
        loadDashboard
    };
}
