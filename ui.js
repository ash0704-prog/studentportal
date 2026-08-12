/**
 * UI Controller Module
 * ====================
 * Manages all user interface interactions and page transitions
 */

class UIController {
    constructor() {
        this.currentPage = 'login';
        this.isLoading = false;
    }

    /**
     * Shows loading spinner
     */
    showLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.classList.remove('hidden');
        }
        this.isLoading = true;
    }

    /**
     * Hides loading spinner
     */
    hideLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.classList.add('hidden');
        }
        this.isLoading = false;
    }

    /**
     * Navigates to a specific page
     * @param {string} pageName - login, password, dashboard
     */
    navigateTo(pageName) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show target page
        const targetPage = document.getElementById(pageName + 'Page');
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageName;
            this.hideLoading();
        }
    }

    /**
     * Shows error alert with message
     * @param {string} elementId - Target alert element
     * @param {string} message - Error message
     */
    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    /**
     * Hides error alert
     * @param {string} elementId - Target alert element
     */
    hideError(elementId) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    /**
     * Updates password strength indicator
     * @param {string} password - Password to evaluate
     */
    updatePasswordStrength(password) {
        const strengthBar = document.getElementById('strengthBar');
        const strengthText = document.getElementById('strengthText');

        if (!password) {
            strengthBar.className = 'strength-bar';
            if (strengthText) strengthText.textContent = 'Password strength: Weak';
            return;
        }

        const score = authManager.getPasswordStrengthScore(password);
        const strengths = ['', 'weak', 'fair', 'good', 'strong'];
        const strength = strengths[score];

        // Update strength bar
        strengthBar.className = `strength-bar ${strength}`;

        // Update strength text
        if (strengthText) {
            strengthText.textContent = `Password strength: ${strength.charAt(0).toUpperCase() + strength.slice(1)}`;
        }

        // Update requirements
        this.updatePasswordRequirements(password);
    }

    /**
     * Updates password requirements checklist
     * @param {string} password
     */
    updatePasswordRequirements(password) {
        const requirements = [
            { id: 'req-length', regex: /.{8,}/, text: 'At least 8 characters' },
            { id: 'req-uppercase', regex: /[A-Z]/, text: 'Contains uppercase letter' },
            { id: 'req-lowercase', regex: /[a-z]/, text: 'Contains lowercase letter' },
            { id: 'req-number', regex: /\d/, text: 'Contains number' },
            { id: 'req-special', regex: /[!@#$%^&*()_+\-=\[\]{};:'",.<>?\/\\|`~]/, text: 'Contains special character' }
        ];

        requirements.forEach(req => {
            const element = document.getElementById(req.id);
            if (element) {
                if (req.regex.test(password)) {
                    element.classList.add('valid');
                    element.innerHTML = '✓ ' + req.text;
                } else {
                    element.classList.remove('valid');
                    element.innerHTML = '✗ ' + req.text;
                }
            }
        });
    }

    /**
     * Populates student profile in dashboard
     * @param {Object} studentData - Student information
     */
    populateStudentProfile(studentData) {

    const fullName =
        studentData.firstName ||
        studentData.name ||
        "Student";

    const rollNumber =
        studentData.rollNumber ||
        studentData.rollNo ||
        "Not available";

    const email =
        studentData.email ||
        "Not provided";

    const phone =
        studentData.phone ||
        "Not provided";

    const dob =
        studentData.dateOfBirth ||
        "Not provided";

    const semester =
        studentData.semester ||
        studentData.year ||
        "Not available";

    const department =
        studentData.department ||
        "Not available";

    const enrollmentDate =
        studentData.enrollmentDate ||
        "Not available";

    const gpa =
        studentData.gpa !== null &&
        studentData.gpa !== undefined
            ? Number(studentData.gpa).toFixed(2)
            : "Not available";

    const status =
        studentData.status ||
        "Active";

    const mappings = {

        // Welcome
        studentName: fullName,

        // Personal information
        profileRollNumber: rollNumber,
        profileFullName: fullName,
        profileEmail: email,
        profilePhone: phone,
        profileDOB:
            dob === "Not provided"
                ? dob
                : this.formatDate(dob),

        // Academic information
        profileSemester: semester,
        profileDepartment: department,
        profileEnrollmentDate:
            enrollmentDate === "Not available"
                ? enrollmentDate
                : this.formatDate(enrollmentDate),

        profileGPA: gpa,

        profileStatus:
            status.charAt(0).toUpperCase() +
            status.slice(1)
    };

    Object.entries(mappings).forEach(
        ([elementId, value]) => {

            const element =
                document.getElementById(elementId);

            if (element) {
                element.textContent =
                    value || "Not available";
            }
        }
    );
}
    /**
     * Populates attendance data in dashboard
     * @param {Array} attendanceByCourse - Attendance records grouped by course
     * @param {Object} stats - Attendance statistics
     */
    populateAttendanceData(attendanceByCourse, stats) {
        // Update statistics boxes
        document.getElementById('totalAttendance').textContent = stats.attendancePercentage + '%';
        document.getElementById('classesPresent').textContent = stats.classesPresent;
        document.getElementById('classesAbsent').textContent = stats.classesAbsent;
        document.getElementById('classesLeave').textContent = stats.classesLeave;

        // Populate attendance table
        const tbody = document.getElementById('attendanceTableBody');
        if (!tbody) return;

        if (attendanceByCourse.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No attendance records found</td></tr>';
            return;
        }

        tbody.innerHTML = attendanceByCourse.map(course => `
            <tr>
                <td>${this.escapeHtml(course.courseName)}</td>
                <td>${course.totalClasses}</td>
                <td>${course.present}</td>
                <td>${course.absent}</td>
                <td>${course.leave}</td>
                <td>
                    <strong>${course.percentage}%</strong>
                    <div class="progress-bar" style="background: ${this.getAttendanceColor(course.percentage)};"></div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Populates grades data in dashboard
     * @param {Array} gradesData - Grade records
     * @param {Object} gpaStats - GPA statistics
     */
    populateGradesData(gradesData, gpaStats) {
        // Update GPA summary
        document.getElementById('cumulativeGPA').textContent = gpaStats.cumulativeGPA.toFixed(2);
        document.getElementById('semesterGPA').textContent = gpaStats.semesterGPA.toFixed(2);
        document.getElementById('totalCredits').textContent = gpaStats.totalCredits;

        // Populate grades table
        const tbody = document.getElementById('gradesTableBody');
        if (!tbody) return;

        if (gradesData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No grades available</td></tr>';
            return;
        }

        tbody.innerHTML = gradesData.map(grade => `
            <tr>
                <td>${this.escapeHtml(grade.courseCode)}</td>
                <td>${this.escapeHtml(grade.courseName)}</td>
                <td>${grade.credits}</td>
                <td>
                    <span class="badge ${this.getGradeColor(grade.grade)}">${grade.grade}</span>
                </td>
                <td>${grade.gradePoints.toFixed(1)}</td>
            </tr>
        `).join('');
    }

    /**
     * Switches between dashboard tabs
     * @param {string} tabName - Profile, attendance, grades
     */
    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Show target tab
        const targetTab = document.getElementById(tabName + 'Tab');
        if (targetTab) {
            targetTab.classList.add('active');
        }

        // Update nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        const activeLink = document.getElementById(tabName + 'Btn');
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    /**
     * Opens edit profile modal
     * @param {Object} studentData - Current student data
     */
    openEditProfileModal(studentData) {
        const modal = document.getElementById('editProfileModal');
        if (modal) {
            modal.classList.add('active');

            // Populate form with current data
            document.getElementById('editEmail').value = studentData.email || '';
            document.getElementById('editPhone').value = studentData.phone || '';
            document.getElementById('editAddress').value = studentData.address || '';
        }
    }

    /**
     * Closes edit profile modal
     */
    closeEditProfileModal() {
        const modal = document.getElementById('editProfileModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    /**
     * Shows notification/toast message
     * @param {string} message - Message to display
     * @param {string} type - success, error, info
     * @param {number} duration - Duration in ms
     */
    showNotification(message, type = 'info', duration = 3000) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `alert alert-${type}`;
        toast.textContent = message;
        toast.style.position = 'fixed';
        toast.style.top = '20px';
        toast.style.right = '20px';
        toast.style.zIndex = '9999';

        document.body.appendChild(toast);

        // Auto-remove after duration
        setTimeout(() => {
            toast.remove();
        }, duration);
    }

    /**
     * Helper: Formats date string to readable format
     * @param {string} dateString - ISO date string
     * @returns {string}
     */
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Helper: Gets attendance color based on percentage
     * @param {number} percentage
     * @returns {string}
     */
    getAttendanceColor(percentage) {
        if (percentage >= 85) return '#28a745'; // Green
        if (percentage >= 75) return '#17a2b8'; // Blue
        if (percentage >= 65) return '#ffc107'; // Yellow
        return '#dc3545'; // Red
    }

    /**
     * Helper: Gets badge color for grade
     * @param {string} grade
     * @returns {string}
     */
    getGradeColor(grade) {
        const grades = {
            'A': 'badge-success',
            'A-': 'badge-success',
            'B+': 'badge-success',
            'B': 'badge-info',
            'B-': 'badge-info',
            'C+': 'badge-warning',
            'C': 'badge-warning',
            'D': 'badge-danger',
            'F': 'badge-danger'
        };
        return grades[grade] || 'badge-info';
    }

    /**
     * Helper: Escapes HTML special characters
     * Security: Prevents XSS attacks
     * 
     * @param {string} text
     * @returns {string}
     */
    escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * Helper: Validates email format
     * @param {string} email
     * @returns {boolean}
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Helper: Validates phone number
     * @param {string} phone
     * @returns {boolean}
     */
    validatePhone(phone) {
        const phoneRegex = /^[\d+\-\s()]+$/;
        return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
    }
}

// Create global instance
const uiController = new UIController();
