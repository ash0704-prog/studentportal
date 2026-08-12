/**
 * Student Data Management Module
 * ===============================
 * Handles fetching and managing student-specific data
 * Only shows data for logged-in student
 */

class StudentDataManager {
    constructor() {
        this.studentData = null;
        this.attendanceData = [];
        this.gradesData = [];
        this.coursesData = [];
    }

    /**
     * Fetches complete student profile
     * PLACEHOLDER: Replace with Firestore query
     * 
     * @param {string} studentId - Student document ID
     * @param {string} rollNumber - Student roll number
     * @returns {Promise<Object>}
     */
    async getStudentProfile(studentId, rollNumber) {
    try {
        console.log("Fetching REAL student profile:", {
            studentId,
            rollNumber
        });

        const db = firebase.firestore();

        // Student document ID is the roll number
        const studentDoc = await db
            .collection("students")
            .doc(rollNumber)
            .get();

        if (!studentDoc.exists) {
            throw new Error(
                `Student profile not found for ${rollNumber}`
            );
        }

        const data = studentDoc.data();

        console.log("REAL student profile:", data);

        return {
            id: studentDoc.id,

            // Your actual Firestore fields
            rollNumber: data.rollNo || studentDoc.id,
            name: data.name || "",
            email: data.email || "",
            dateOfBirth: data.dateOfBirth || "",
            department: data.department || "",
            section: data.section || "",
            semester: data.year || "",

            // Keep original data too
            ...data
        };

    } catch (error) {
        console.error(
            "Error fetching REAL student profile:",
            error
        );
        throw error;
    }
}
    /**
     * Fetches attendance records for logged-in student only
     * PLACEHOLDER: Replace with Firestore query with rollNumber filter
     * 
     * @param {string} studentId - Student document ID
     * @param {string} rollNumber - Student roll number
     * @param {Object} filters - { semester: string, startDate: string, endDate: string }
     * @returns {Promise<Array>}
     */
    async getAttendanceData(studentId, rollNumber, filters = {}) {
    try {
        console.log("Fetching REAL attendance for:", {
            studentId,
            rollNumber,
            filters
        });

        // Firebase Firestore
        const db = firebase.firestore();

        // Faculty page saves attendance using studentId
        const snapshot = await db
            .collection("attendance")
            .where("studentId", "==", studentId)
            .get();

        let records = [];

        snapshot.forEach(doc => {
            const data = doc.data();

            records.push({
                id: doc.id,

                // Student identifier
                studentId: data.studentId || studentId,
                rollNumber: data.rollNumber || data.rollNo || studentId,

                // Faculty uses subject
                courseId: data.courseId || data.subject || "unknown",
                courseName: data.courseName || data.subject || "Unknown Course",

                // Faculty uses date
                date: data.date || "",

                // Convert Faculty P/A → Student Portal format
                status:
                    data.status === "P"
                        ? "present"
                        : data.status === "A"
                        ? "absent"
                        : data.status === "L"
                        ? "leave"
                        : String(data.status || "").toLowerCase(),

                semester: data.semester || null
            });
        });

        console.log("REAL attendance records:", records);

        return records;

    } catch (error) {
        console.error("Error fetching REAL attendance:", error);
        throw error;
    }
}

    /**
     * Fetches grades for logged-in student only
     * PLACEHOLDER: Replace with Firestore query with rollNumber filter
     * 
     * @param {string} studentId - Student document ID
     * @param {string} rollNumber - Student roll number
     * @param {Object} filters - { semester: string }
     * @returns {Promise<Array>}
     */
    async getGradesData(studentId, rollNumber, filters = {}) {
        try {
            console.log('Fetching grades for:', { studentId, rollNumber, filters });
            
            // PLACEHOLDER: Firestore query with security rules
            // const query = db.collection('grades')
            //     .where('rollNumber', '==', rollNumber)
            //     .where('studentId', '==', studentId);
            // 
            // if (filters.semester) {
            //     query = query.where('semester', '==', parseInt(filters.semester));
            // }
            // 
            // const snapshot = await query.get();
            // return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            await this.simulateDelay(700);
            return this.getMockGradesData(rollNumber, filters);
            
        } catch (error) {
            console.error('Error fetching grades:', error);
            throw error;
        }
    }

    /**
     * Calculates attendance statistics
     * @param {Array} attendanceRecords
     * @returns {Object}
     */
    calculateAttendanceStats(attendanceRecords) {
        const stats = {
            totalClasses: 0,
            classesPresent: 0,
            classesAbsent: 0,
            classesLeave: 0,
            attendancePercentage: 0
        };

        if (!attendanceRecords || attendanceRecords.length === 0) {
            return stats;
        }

        stats.totalClasses = attendanceRecords.length;
        
        attendanceRecords.forEach(record => {
            switch (record.status) {
                case 'present':
                    stats.classesPresent++;
                    break;
                case 'absent':
                    stats.classesAbsent++;
                    break;
                case 'leave':
                    stats.classesLeave++;
                    break;
            }
        });

        stats.attendancePercentage = Math.round(
            (stats.classesPresent / stats.totalClasses) * 100
        );

        return stats;
    }

    /**
     * Calculates attendance by course
     * Groups attendance records by course
     * 
     * @param {Array} attendanceRecords
     * @returns {Array}
     */
    calculateAttendanceByCourse(attendanceRecords) {
        const courseMap = new Map();

        attendanceRecords.forEach(record => {
            const key = record.courseId;
            
            if (!courseMap.has(key)) {
                courseMap.set(key, {
                    courseId: record.courseId,
                    courseName: record.courseName,
                    totalClasses: 0,
                    present: 0,
                    absent: 0,
                    leave: 0
                });
            }

            const course = courseMap.get(key);
            course.totalClasses++;

            switch (record.status) {
                case 'present':
                    course.present++;
                    break;
                case 'absent':
                    course.absent++;
                    break;
                case 'leave':
                    course.leave++;
                    break;
            }
        });

        // Calculate percentage for each course
        const result = Array.from(courseMap.values()).map(course => {
            return {
                ...course,
                percentage: course.totalClasses > 0 
                    ? Math.round((course.present / course.totalClasses) * 100)
                    : 0
            };
        });

        return result;
    }

    /**
     * Calculates GPA and academic statistics
     * @param {Array} gradesRecords
     * @returns {Object}
     */
    calculateGPAStats(gradesRecords) {
        if (!gradesRecords || gradesRecords.length === 0) {
            return {
                cumulativeGPA: 0,
                semesterGPA: 0,
                totalCredits: 0,
                earnedCredits: 0,
                courseCount: 0
            };
        }

        let totalPoints = 0;
        let totalCredits = 0;
        let earnedCredits = 0;
        let courseCount = gradesRecords.length;

        gradesRecords.forEach(grade => {
            const credits = grade.credits || 3;
            const gradePoints = grade.gradePoints || 0;
            
            totalCredits += credits;
            totalPoints += credits * gradePoints;
            
            if (gradePoints > 0) {
                earnedCredits += credits;
            }
        });

        const cumulativeGPA = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;

        return {
            cumulativeGPA: parseFloat(cumulativeGPA),
            semesterGPA: parseFloat(cumulativeGPA),
            totalCredits,
            earnedCredits,
            courseCount
        };
    }

    /**
     * Updates student profile
     * PLACEHOLDER: Replace with Firebase update
     * 
     * @param {string} studentId - Student document ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<boolean>}
     */
    async updateStudentProfile(studentId, updates) {
        try {
            // Validate updates
            const allowedFields = ['email', 'phone', 'address'];
            const filteredUpdates = {};
            
            for (const [key, value] of Object.entries(updates)) {
                if (allowedFields.includes(key)) {
                    filteredUpdates[key] = value;
                }
            }

            console.log('Updating student profile:', { studentId, updates: filteredUpdates });
            
            // PLACEHOLDER: Firestore update
            // const studentRef = db.collection('students').doc(studentId);
            // await studentRef.update({
            //     ...filteredUpdates,
            //     updatedAt: new Date()
            // });
            
            await this.simulateDelay(500);
            
            // Update local data
            if (this.studentData) {
                this.studentData = { ...this.studentData, ...filteredUpdates };
            }
            
            return true;
            
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }

    /**
     * Gets student overall statistics for dashboard
     * @param {Object} studentData
     * @param {Array} attendanceData
     * @param {Array} gradesData
     * @returns {Object}
     */
    getDashboardStats(studentData, attendanceData, gradesData) {
        const attendanceStats = this.calculateAttendanceStats(attendanceData);
        const gpaStats = this.calculateGPAStats(gradesData);

        return {
            student: studentData,
            attendance: attendanceStats,
            academics: gpaStats,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Validates that data belongs to logged-in student
     * Security: Always verify rollNumber and studentId match
     * 
     * @param {string} dataRollNumber - Roll number from data
     * @param {string} currentRollNumber - Current logged-in student's roll number
     * @returns {boolean}
     */
    validateDataOwnership(dataRollNumber, currentRollNumber) {
        return dataRollNumber === currentRollNumber;
    }

    /**
     * PLACEHOLDER: Mock student profile data
     * @param {string} rollNumber
     * @returns {Object}
     */
    getMockStudentProfile(rollNumber) {
        const profiles = {
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
                passwordChanged: false
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
                department: 'Electronics',
                enrollmentDate: '2023-08-15',
                gpa: 3.85,
                status: 'active',
                address: '456 Oak Avenue, Tech City',
                passwordChanged: true
            }
        };
        
        return profiles[rollNumber] || null;
    }

    /**
     * PLACEHOLDER: Mock attendance data
     * Only for logged-in student
     * 
     * @param {string} rollNumber
     * @param {Object} filters
     * @returns {Array}
     */
    getMockAttendanceData(rollNumber, filters = {}) {
        const allRecords = {
            'CSE001': [
                { courseId: 'CS101', courseName: 'Data Structures', status: 'present', date: '2024-08-01', semester: 4 },
                { courseId: 'CS101', courseName: 'Data Structures', status: 'present', date: '2024-08-03', semester: 4 },
                { courseId: 'CS101', courseName: 'Data Structures', status: 'absent', date: '2024-08-05', semester: 4 },
                { courseId: 'CS102', courseName: 'Database Systems', status: 'present', date: '2024-08-02', semester: 4 },
                { courseId: 'CS102', courseName: 'Database Systems', status: 'leave', date: '2024-08-04', semester: 4 },
                { courseId: 'CS102', courseName: 'Database Systems', status: 'present', date: '2024-08-06', semester: 4 },
                { courseId: 'CS103', courseName: 'Web Development', status: 'present', date: '2024-08-01', semester: 4 },
                { courseId: 'CS103', courseName: 'Web Development', status: 'present', date: '2024-08-03', semester: 4 },
            ],
            'ECE002': [
                { courseId: 'EC101', courseName: 'Digital Electronics', status: 'present', date: '2024-08-01', semester: 3 },
                { courseId: 'EC101', courseName: 'Digital Electronics', status: 'present', date: '2024-08-03', semester: 3 },
                { courseId: 'EC102', courseName: 'Signals & Systems', status: 'present', date: '2024-08-02', semester: 3 },
                { courseId: 'EC102', courseName: 'Signals & Systems', status: 'absent', date: '2024-08-04', semester: 3 },
            ]
        };

        let records = allRecords[rollNumber] || [];

        // Apply filters
        if (filters.semester) {
            records = records.filter(r => r.semester === parseInt(filters.semester));
        }

        return records;
    }

    /**
     * PLACEHOLDER: Mock grades data
     * Only for logged-in student
     * 
     * @param {string} rollNumber
     * @param {Object} filters
     * @returns {Array}
     */
    getMockGradesData(rollNumber, filters = {}) {
        const allGrades = {
            'CSE001': [
                { courseCode: 'CS101', courseName: 'Data Structures', credits: 4, grade: 'A', gradePoints: 4.0, semester: 4, internalMarks: 38, externalMarks: 48 },
                { courseCode: 'CS102', courseName: 'Database Systems', credits: 4, grade: 'A-', gradePoints: 3.7, semester: 4, internalMarks: 36, externalMarks: 45 },
                { courseCode: 'CS103', courseName: 'Web Development', credits: 3, grade: 'B+', gradePoints: 3.3, semester: 4, internalMarks: 34, externalMarks: 42 },
                { courseCode: 'CS104', courseName: 'Operating Systems', credits: 4, grade: 'A', gradePoints: 4.0, semester: 4, internalMarks: 37, externalMarks: 49 },
            ],
            'ECE002': [
                { courseCode: 'EC101', courseName: 'Digital Electronics', credits: 4, grade: 'A', gradePoints: 4.0, semester: 3, internalMarks: 39, externalMarks: 50 },
                { courseCode: 'EC102', courseName: 'Signals & Systems', credits: 4, grade: 'A-', gradePoints: 3.7, semester: 3, internalMarks: 36, externalMarks: 46 },
                { courseCode: 'EC103', courseName: 'Circuit Theory', credits: 3, grade: 'B+', gradePoints: 3.3, semester: 3, internalMarks: 35, externalMarks: 41 },
            ]
        };

        let grades = allGrades[rollNumber] || [];

        // Apply filters
        if (filters.semester && filters.semester !== 'all') {
            const semesterNum = parseInt(filters.semester.replace('sem', ''));
            if (!isNaN(semesterNum)) {
                grades = grades.filter(g => g.semester === semesterNum);
            }
        }

        return grades;
    }

    /**
     * Simulates delay for development
     * @param {number} ms
     * @returns {Promise}
     */
    simulateDelay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create global instance
const studentDataManager = new StudentDataManager();
