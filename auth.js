/**
 * Authentication Module
 * =====================
 * Handles student login, password management, and session security
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isFirstLogin = false;
        this.inactivityTimer = null;
        this.INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    }

    /**
     * Validates roll number format
     * @param {string} - Student roll number
     * @returns {boolean}
     */
    validateRollNumber(rollNumber) {
        if (!rollNumber || typeof rollNumber !== 'string') return false;
        
        // Remove whitespace
        const cleaned = rollNumber.trim().toUpperCase();
        
        // Standard university roll number patterns
        // Adjust regex based on your institution's format
        // Example formats: CSE001, CSE-2022-001, etc.
        const rollNumberRegex = /^[A-Z]{2,4}\d{3,6}$/;
        
        return rollNumber.length >= 3 && rollNumber.length <= 20 && cleaned === rollNumber.trim().toUpperCase();
    }

    /**
     * Validates date of birth format
     * @param {string} dateOfBirth - DOB in YYYY-MM-DD format
     * @returns {boolean}
     */
    validateDateOfBirth(dateOfBirth) {
        if (!dateOfBirth) return false;
        
        const date = new Date(dateOfBirth);
        
        // Check if valid date
        if (isNaN(date.getTime())) return false;
        
        // Check if DOB is not in future
        if (date > new Date()) return false;
        
        // Check if age is reasonable (at least 15, not more than 80)
        const age = this.calculateAge(date);
        return age >= 15 && age <= 80;
    }

    /**
     * Calculates age from date of birth
     * @param {Date} dateOfBirth
     * @returns {number}
     */
    calculateAge(dateOfBirth) {
        const today = new Date();
        let age = today.getFullYear() - dateOfBirth.getFullYear();
        const monthDiff = today.getMonth() - dateOfBirth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
            age--;
        }
        
        return age;
    }

    /**
     * Validates password strength
     * @param {string} password - Password to validate
     * @returns {Object} - { isValid: boolean, strength: string, errors: [] }
     */
    validatePasswordStrength(password) {
        const errors = [];
        let strength = 'weak';
        
        if (!password) {
            return { isValid: false, strength, errors: ['Password is required'] };
        }
        
        // Length check
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters');
        }
        
        // Uppercase check
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain uppercase letter');
        }
        
        // Lowercase check
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain lowercase letter');
        }
        
        // Number check
        if (!/\d/.test(password)) {
            errors.push('Password must contain number');
        }
        
        // Special character check
        if (!/[!@#$%^&*()_+\-=\[\]{};:'",.<>?\/\\|`~]/.test(password)) {
            errors.push('Password must contain special character (!@#$%^&*)');
        }
        
        // Determine strength
        if (errors.length === 0) {
            strength = 'strong';
        } else if (errors.length <= 2) {
            strength = 'good';
        } else if (errors.length <= 4) {
            strength = 'fair';
        }
        
        return {
            isValid: errors.length === 0,
            strength,
            errors
        };
    }

    /**
     * Gets password strength score for UI
     * @param {string} password
     * @returns {number} 0-4
     */
    getPasswordStrengthScore(password) {
        const { strength } = this.validatePasswordStrength(password);
        const scores = {
            'weak': 1,
            'fair': 2,
            'good': 3,
            'strong': 4
        };
        return scores[strength] || 0;
    }

    /**
     * Simulates login authentication
     * PLACEHOLDER: Replace with actual Firebase authentication
     * 
     * @param {string} rollNumber - Student roll number
     * @param {string} dateOfBirth - Date of birth (YYYY-MM-DD)
     * @returns {Promise<Object>} - { success: boolean, user: Object, firstLogin: boolean, error: string }
     */
   async login(rollNumber, dateOfBirth) {
    try {
        if (!this.validateRollNumber(rollNumber)) {
            throw new Error('Invalid roll number format');
        }

        if (!this.validateDateOfBirth(dateOfBirth)) {
            throw new Error('Invalid date of birth');
        }

        const db = firebase.firestore();

        const snapshot = await db.collection('students')
            .where('rollNo', '==', rollNumber.trim().toUpperCase())
            .where('dateOfBirth', '==', dateOfBirth)
            .limit(1)
            .get();

        if (snapshot.empty) {
            throw new Error('Invalid roll number or date of birth');
        }

        const doc = snapshot.docs[0];
        const student = doc.data();

        const user = {
            id: doc.id,
            ...student
        };

        this.currentUser = user;
        this.isFirstLogin = false;

        this.storeSession(user);
        this.resetInactivityTimer();

        return {
            success: true,
            user: user,
            firstLogin: false,
            error: null
        };

    } catch (error) {
        console.error('Login error:', error);

        return {
            success: false,
            user: null,
            firstLogin: false,
            error: error.message
        };
    }
}

    /**
     * Updates password on first login
     * PLACEHOLDER: Replace with Firebase function
     * 
     * @param {string} tempPassword - Current password (DOB)
     * @param {string} newPassword - New password
     * @returns {Promise<Object>} - { success: boolean, error: string }
     */
    async updatePasswordFirstLogin(tempPassword, newPassword) {
        try {
            if (!this.currentUser) {
                throw new Error('No user logged in');
            }
            
            // Verify temp password matches DOB
            const dateOfBirth = new Date(tempPassword);
            if (dateOfBirth.toISOString().split('T')[0] !== tempPassword) {
                throw new Error('Temporary password incorrect');
            }
            
            // Validate new password
            const validation = this.validatePasswordStrength(newPassword);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }
            
            // PLACEHOLDER: Firebase Update
            console.log('Updating password for:', this.currentUser.rollNumber);
            
            await this.simulateDelay(800);
            
            // Update current user object
            this.currentUser.passwordChanged = true;
            this.isFirstLogin = false;
            
            // Update session storage
            this.storeSession(this.currentUser);
            
            return {
                success: true,
                error: null
            };
            
        } catch (error) {
            console.error('Password update error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Stores user session in local storage
     * Security Note: In production, use httpOnly cookies for sensitive data
     * 
     * @param {Object} user - User object
     */
    storeSession(user) {
        const sessionData = {
            userId: user.id || user.rollNumber,
            rollNumber: user.rollNumber,
            name: `${user.firstName} ${user.lastName}`,
            loginTime: new Date().getTime(),
            sessionId: this.generateSessionId()
        };
        
        sessionStorage.setItem('studentSession', JSON.stringify(sessionData));
        localStorage.setItem('lastLogin', user.rollNumber);
        
        // Mark as authenticated
        sessionStorage.setItem('isAuthenticated', 'true');
    }

    /**
     * Retrieves current session
     * @returns {Object|null}
     */
    getSession() {
        const session = sessionStorage.getItem('studentSession');
        return session ? JSON.parse(session) : null;
    }

    /**
     * Checks if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return sessionStorage.getItem('isAuthenticated') === 'true';
    }

    /**
     * Logout current user
     * PLACEHOLDER: Firebase sign out
     */
    logout() {
        try {
            // PLACEHOLDER: Firebase signOut
            console.log('Logging out user:', this.currentUser?.rollNumber);
            
            // Clear session
            sessionStorage.removeItem('studentSession');
            sessionStorage.removeItem('isAuthenticated');
            
            // Clear timers
            if (this.inactivityTimer) {
                clearTimeout(this.inactivityTimer);
            }
            
            this.currentUser = null;
            this.isFirstLogin = false;
            
            return true;
        } catch (error) {
            console.error('Logout error:', error);
            return false;
        }
    }

    /**
     * Resets inactivity timer
     */
    resetInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }
        
        this.inactivityTimer = setTimeout(() => {
            console.log('Session expired due to inactivity');
            this.logout();
            // Trigger UI to show login page
            window.dispatchEvent(new CustomEvent('sessionExpired'));
        }, this.INACTIVITY_TIMEOUT);
    }

    /**
     * Generates unique session ID
     * @returns {string}
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * PLACEHOLDER: Mock data for development
     * Replace with Firebase Firestore query
     * 
     * @param {string} rollNumber
     * @returns {Promise<Object>}
     */
    async getMockUserData(rollNumber) {
        // Simulate database query
        const mockDatabase = {
            'CSE001': {
                id: 'user_cse001',
                rollNumber: 'CSE001',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@university.edu',
                phone: '+91-9876543210',
                dateOfBirth: '1998-05-15',
                semester: 4,
                department: 'Computer Science',
                enrollmentDate: '2022-08-15',
                gpa: 3.75,
                status: 'active',
                address: '123 Main Street, Tech City',
                passwordChanged: false,
                createdAt: '2022-08-15T10:00:00Z',
                updatedAt: '2024-08-08T10:00:00Z'
            },
            'ECE002': {
                id: 'user_ece002',
                rollNumber: 'ECE002',
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane.smith@university.edu',
                phone: '+91-9876543211',
                dateOfBirth: '1999-03-22',
                semester: 3,
                department: 'Electronics & Communication',
                enrollmentDate: '2023-08-15',
                gpa: 3.85,
                status: 'active',
                address: '456 Oak Avenue, Tech City',
                passwordChanged: true,
                createdAt: '2023-08-15T10:00:00Z',
                updatedAt: '2024-08-08T10:00:00Z'
            }
        };
        
        return mockDatabase[rollNumber.toUpperCase()] || null;
    }

    /**
     * Simulates delay for development
     * Remove in production when using real Firebase
     * 
     * @param {number} ms
     * @returns {Promise}
     */
    simulateDelay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Gets current user data
     * @returns {Object|null}
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Checks if current login is first login
     * @returns {boolean}
     */
    isFirstLoginSession() {
        return this.isFirstLogin;
    }
}

// Create global instance
const authManager = new AuthManager();
