// Student Fee Tracker Application - Complete Working Version
class StudentFeeTracker {
    constructor() {
        this.students = JSON.parse(localStorage.getItem('students')) || [];
        this.feeRecords = JSON.parse(localStorage.getItem('feeRecords')) || [];
        this.isInitialized = false;
        this.currentFilters = {};
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeApp());
        } else {
            this.initializeApp();
        }
    }

    initializeApp() {
        this.setupEventListeners();
        this.setupFeeTrackingEventListeners();
        this.setupEditEventListeners();
        this.setupHomeEventListeners();
        this.displayStudents();
        this.populateStudentDropdowns();
        this.displayFeeRecords();
        this.generateReports();
        this.updateHomepageStats();
        this.displayRecentActivity();
        this.setupAnimations();
        this.isInitialized = true;
        console.log('Student Fee Tracker initialized successfully');
    }

    setupEventListeners() {
        // Navigation buttons
        const studentsTab = document.getElementById('studentsTab');
        const feesTab = document.getElementById('feesTab');
        const reportsTab = document.getElementById('reportsTab');

        if (studentsTab) studentsTab.onclick = () => this.showSection('students');
        if (feesTab) feesTab.onclick = () => this.showSection('fees');
        if (reportsTab) reportsTab.onclick = () => this.showSection('reports');

        // Forms
        const studentForm = document.getElementById('studentForm');
        const feeForm = document.getElementById('feeForm');

        if (studentForm) studentForm.onsubmit = (e) => this.addStudent(e);
        if (feeForm) feeForm.onsubmit = (e) => this.addFeeRecord(e);

        // Search functionality
        const searchStudents = document.getElementById('searchStudents');
        if (searchStudents) {
            searchStudents.oninput = (e) => this.debounce(() => {
                this.searchStudents(e.target.value);
            }, 300)();
        }

        // Export buttons
        const exportStudents = document.getElementById('exportStudents');
        const exportFees = document.getElementById('exportFees');
        const exportAll = document.getElementById('exportAll');
        const generateReport = document.getElementById('generateReport');
        const clearAllData = document.getElementById('clearAllData');

        if (exportStudents) exportStudents.onclick = () => this.exportStudents();
        if (exportFees) exportFees.onclick = () => this.exportFeeRecords();
        if (exportAll) exportAll.onclick = () => this.exportAllData();
        if (generateReport) generateReport.onclick = () => this.generateFullReport();
        if (clearAllData) clearAllData.onclick = () => this.clearAllData();

        // Set default dates
        const paymentDate = document.getElementById('paymentDate');
        const joiningDate = document.getElementById('joiningDate');
        
        if (paymentDate) paymentDate.value = new Date().toISOString().split('T')[0];
        if (joiningDate) joiningDate.value = new Date().toISOString().split('T')[0];
    }

    setupFeeTrackingEventListeners() {
        const backToStudentsList = document.getElementById('backToStudentsList');
        const showAllStudents = document.getElementById('showAllStudents');
        const showPaidStudents = document.getElementById('showPaidStudents');
        const showPendingStudents = document.getElementById('showPendingStudents');
        const searchFeeStudents = document.getElementById('searchFeeStudents');

        if (backToStudentsList) backToStudentsList.onclick = () => this.showStudentsListView();
        if (showAllStudents) showAllStudents.onclick = () => this.filterStudentsByPaymentStatus('all');
        if (showPaidStudents) showPaidStudents.onclick = () => this.filterStudentsByPaymentStatus('paid');
        if (showPendingStudents) showPendingStudents.onclick = () => this.filterStudentsByPaymentStatus('pending');

        if (searchFeeStudents) {
            searchFeeStudents.oninput = (e) => this.debounce(() => {
                this.searchStudentsForFees(e.target.value);
            }, 300)();
        }
    }

    setupEditEventListeners() {
        const editStudentForm = document.getElementById('editStudentForm');
        const editFeeForm = document.getElementById('editFeeForm');

        if (editStudentForm) editStudentForm.onsubmit = (e) => this.updateStudent(e);
        if (editFeeForm) editFeeForm.onsubmit = (e) => this.updateFeeRecord(e);
    }

    setupHomeEventListeners() {
        const homeNavBtn = document.getElementById('homeNavBtn');
        const studentsNavBtn = document.getElementById('studentsNavBtn');
        const feesNavBtn = document.getElementById('feesNavBtn');
        const reportsNavBtn = document.getElementById('reportsNavBtn');

        if (homeNavBtn) homeNavBtn.onclick = () => this.showSection('homepage');
        if (studentsNavBtn) studentsNavBtn.onclick = () => this.showSection('students');
        if (feesNavBtn) feesNavBtn.onclick = () => this.showSection('fees');
        if (reportsNavBtn) reportsNavBtn.onclick = () => this.showSection('reports');
    }

    showSection(section) {
        this.showLoading();
        
        setTimeout(() => {
            // Update navigation
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.nav-link').forEach(btn => btn.classList.remove('active'));

            // Show section
            const sectionElement = document.getElementById(`${section}Section`);
            if (sectionElement) {
                sectionElement.classList.add('active');
            }
            
            // Update nav button
            const navBtnMap = {
                'homepage': 'homeNavBtn',
                'students': 'studentsNavBtn',
                'fees': 'feesNavBtn',
                'reports': 'reportsNavBtn'
            };
            
            const navBtn = document.getElementById(navBtnMap[section]);
            if (navBtn) {
                navBtn.classList.add('active');
            }

            // Load section specific data
            if (section === 'homepage') {
                this.updateHomepageStats();
                this.displayRecentActivity();
            } else if (section === 'reports') {
                this.generateReports();
            } else if (section === 'fees') {
                this.displayStudentsFeeOverview();
            }

            this.hideLoading();
        }, 300);
    }

    updateHomepageStats() {
        const totalStudents = this.students.length;
        const totalRecords = this.feeRecords.length;
        const paidRecords = this.feeRecords.filter(r => r.status === 'Paid');
        const pendingRecords = this.feeRecords.filter(r => r.status !== 'Paid');
        const totalAmount = this.feeRecords.reduce((sum, r) => sum + r.amount, 0);
        const paidAmount = paidRecords.reduce((sum, r) => sum + r.amount, 0);

        // Update quick access cards
        const totalStudentsCount = document.getElementById('totalStudentsCount');
        const totalRecordsCount = document.getElementById('totalRecordsCount');
        const pendingPaymentsCount = document.getElementById('pendingPaymentsCount');
        const totalAmountCount = document.getElementById('totalAmountCount');

        if (totalStudentsCount) totalStudentsCount.textContent = totalStudents;
        if (totalRecordsCount) totalRecordsCount.textContent = totalRecords;
        if (pendingPaymentsCount) pendingPaymentsCount.textContent = pendingRecords.length;
        if (totalAmountCount) totalAmountCount.textContent = `₹${totalAmount.toLocaleString()}`;

        // Update stats overview
        const homeStudentsCount = document.getElementById('homeStudentsCount');
        const homePaidCount = document.getElementById('homePaidCount');
        const homePendingCount = document.getElementById('homePendingCount');
        const homeTotalAmount = document.getElementById('homeTotalAmount');

        if (homeStudentsCount) homeStudentsCount.textContent = totalStudents;
        if (homePaidCount) homePaidCount.textContent = paidRecords.length;
        if (homePendingCount) homePendingCount.textContent = pendingRecords.length;
        if (homeTotalAmount) homeTotalAmount.textContent = `₹${paidAmount.toLocaleString()}`;
    }

    displayRecentActivity() {
        const container = document.getElementById('recentActivityList');
        if (!container) return;
        
        // Get recent activities (last 5 records)
        const recentRecords = this.feeRecords
            .sort((a, b) => new Date(b.recordDate) - new Date(a.recordDate))
            .slice(0, 5);

        if (recentRecords.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>No recent activity to display. Start by adding students and recording payments!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = recentRecords.map(record => {
            const student = this.students.find(s => s.id === record.studentId);
            const timeAgo = this.getTimeAgo(new Date(record.recordDate));
            
            return `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-${record.status === 'Paid' ? 'check' : record.status === 'Partial' ? 'clock' : 'exclamation'}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">
                            ${record.status} payment: ${student?.name || 'Unknown Student'} - ${record.month} ${record.year}
                        </div>
                        <div class="activity-time">
                            ₹${record.amount.toLocaleString()} • ${timeAgo}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    }

    showToolsMenu() {
        this.showToast('Tools menu opened! Check the Reports section for more options.', 'info');
        this.showSection('reports');
    }

    addStudent(e) {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;
        this.showLoading();
        
        try {
            const name = document.getElementById('studentName')?.value?.trim();
            const studentClass = document.getElementById('studentClass')?.value?.trim();
            const rollNumber = document.getElementById('studentRoll')?.value?.trim();
            const monthlyFee = parseFloat(document.getElementById('monthlyFee')?.value);
            const parentContact = document.getElementById('parentContact')?.value?.trim() || '';
            const joiningDate = document.getElementById('joiningDate')?.value;

            if (!name || !studentClass || !rollNumber || isNaN(monthlyFee) || !joiningDate) {
                throw new Error('Please fill in all required fields correctly!');
            }

            if (this.students.some(s => s.rollNumber === rollNumber)) {
                throw new Error('A student with this roll number already exists!');
            }

            const student = {
                id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
                name,
                class: studentClass,
                rollNumber,
                monthlyFee,
                parentContact,
                joiningDate,
                dateAdded: new Date().toLocaleDateString(),
                totalPaid: 0,
                totalDue: 0
            };

            this.students.push(student);
            this.saveData();
            this.displayStudents();
            this.populateStudentDropdowns();
            this.updateHomepageStats();
            
            const form = document.getElementById('studentForm');
            if (form) form.reset();
            
            const joiningDateInput = document.getElementById('joiningDate');
            if (joiningDateInput) joiningDateInput.value = new Date().toISOString().split('T')[0];
            
            this.showToast('Student added successfully! 🎉', 'success');

        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            this.hideLoading();
            if (submitBtn) {
                setTimeout(() => {
                    submitBtn.disabled = false;
                }, 1000);
            }
        }
    }

    addFeeRecord(e) {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;
        this.showLoading();
        
        try {
            const feeRecord = {
                id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
                studentId: document.getElementById('feeStudent')?.value,
                month: document.getElementById('feeMonth')?.value,
                year: parseInt(document.getElementById('feeYear')?.value),
                amount: parseFloat(document.getElementById('feeAmount')?.value),
                paymentDate: document.getElementById('paymentDate')?.value,
                status: document.getElementById('paymentStatus')?.value,
                notes: document.getElementById('paymentNotes')?.value?.trim() || '',
                recordDate: new Date().toISOString()
            };

            if (!feeRecord.studentId || !feeRecord.month || !feeRecord.year || 
                isNaN(feeRecord.amount) || !feeRecord.paymentDate) {
                throw new Error('Please fill in all required fields!');
            }

            const existingRecord = this.feeRecords.find(r => 
                r.studentId === feeRecord.studentId && 
                r.month === feeRecord.month && 
                r.year === feeRecord.year
            );

            if (existingRecord) {
                if (confirm('A record for this student and month already exists. Do you want to update it?')) {
                    Object.assign(existingRecord, feeRecord);
                } else {
                    return;
                }
            } else {
                this.feeRecords.push(feeRecord);
            }

            this.updateStudentTotals(feeRecord.studentId);
            this.saveData();
            this.displayStudentsFeeOverview();
            this.updateHomepageStats();
            this.displayRecentActivity();
            
            const form = document.getElementById('feeForm');
            if (form) form.reset();
            
            const paymentDateInput = document.getElementById('paymentDate');
            if (paymentDateInput) paymentDateInput.value = new Date().toISOString().split('T')[0];
            
            this.showToast('Fee record saved successfully! 💰', 'success');

        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            this.hideLoading();
            if (submitBtn) {
                setTimeout(() => {
                    submitBtn.disabled = false;
                }, 1000);
            }
        }
    }

    updateStudentTotals(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        const studentRecords = this.feeRecords.filter(r => r.studentId === studentId);
        student.totalPaid = studentRecords.reduce((sum, record) => {
            return record.status === 'Paid' ? sum + record.amount : sum;
        }, 0);

        const monthsEnrolled = studentRecords.length;
        student.totalDue = (monthsEnrolled * student.monthlyFee) - student.totalPaid;
    }

    displayStudents() {
        const container = document.getElementById('studentsList');
        if (!container) return;
        
        if (this.students.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-plus"></i>
                    <p>No students added yet. Add your first student above!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.students.map((student, index) => {
            const unpaidRecords = this.feeRecords.filter(r => 
                r.studentId === student.id && r.status !== 'Paid'
            ).length;

            return `
                <div class="student-card" style="animation-delay: ${index * 0.1}s">
                    <div class="student-header">
                        <div>
                            <div class="student-name">
                                <i class="fas fa-user-graduate"></i>
                                ${this.escapeHtml(student.name)}
                            </div>
                            ${unpaidRecords > 0 ? 
                                `<div style="color: var(--danger-color); font-size: 0.85rem; font-weight: 600;">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    ${unpaidRecords} pending payment${unpaidRecords > 1 ? 's' : ''}
                                </div>` : 
                                `<div style="color: var(--success-color); font-size: 0.85rem; font-weight: 600;">
                                    <i class="fas fa-check-circle"></i>
                                    All payments up to date
                                </div>`
                            }
                        </div>
                        <div style="display: flex; gap: 5px;">
                            <button class="edit-btn" onclick="window.feeTracker.openEditStudentModal('${student.id}')">
                                <i class="fas fa-edit"></i>
                                Edit
                            </button>
                            <button class="delete-btn ripple-effect" onclick="window.feeTracker.deleteStudent('${student.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="student-info">
                        <div class="info-item">
                            <i class="fas fa-school"></i>
                            <strong>Class:</strong> ${this.escapeHtml(student.class)}
                        </div>
                        <div class="info-item">
                            <i class="fas fa-id-card"></i>
                            <strong>Roll:</strong> ${this.escapeHtml(student.rollNumber)}
                        </div>
                        <div class="info-item">
                            <i class="fas fa-rupee-sign"></i>
                            <strong>Monthly Fee:</strong> ₹${student.monthlyFee.toLocaleString()}
                        </div>
                        <div class="info-item">
                            <i class="fas fa-phone"></i>
                            <strong>Contact:</strong> ${this.escapeHtml(student.parentContact) || 'Not provided'}
                        </div>
                        <div class="info-item">
                            <i class="fas fa-calendar-plus"></i>
                            <strong>Joined:</strong> ${this.formatDate(student.joiningDate)}
                        </div>
                        <div class="info-item">
                            <i class="fas fa-calendar"></i>
                            <strong>Added:</strong> ${student.dateAdded}
                        </div>
                        ${student.lastModified ? `
                            <div class="info-item" style="border-left-color: var(--warning-color);">
                                <i class="fas fa-edit"></i>
                                <strong>Last Modified:</strong> ${student.lastModified}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    displayStudentsFeeOverview() {
        const container = document.getElementById('studentsListView');
        if (!container) return;
        
        if (this.students.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-plus"></i>
                    <p>No students added yet. Add students first to track their fees!</p>
                </div>
            `;
            return;
        }

        const studentsWithFees = this.students.map(student => {
            const studentRecords = this.feeRecords.filter(r => r.studentId === student.id);
            const paidRecords = studentRecords.filter(r => r.status === 'Paid');
            const pendingRecords = studentRecords.filter(r => r.status === 'Pending');
            const partialRecords = studentRecords.filter(r => r.status === 'Partial');
            
            const totalPaid = paidRecords.reduce((sum, r) => sum + r.amount, 0);
            
            let status = 'up-to-date';
            if (pendingRecords.length > 0) status = 'pending';
            else if (partialRecords.length > 0) status = 'partial';
            
            const recentPayments = studentRecords
                .sort((a, b) => new Date(b.recordDate) - new Date(a.recordDate))
                .slice(0, 3);
            
            return {
                ...student,
                totalRecords: studentRecords.length,
                paidCount: paidRecords.length,
                pendingCount: pendingRecords.length,
                partialCount: partialRecords.length,
                totalPaid,
                status,
                recentPayments
            };
        });

        container.innerHTML = studentsWithFees.map((student, index) => `
            <div class="student-fee-card ${student.status === 'pending' ? 'has-pending' : student.status === 'partial' ? 'has-partial' : ''}" 
                 style="animation-delay: ${index * 0.1}s"
                 onclick="window.feeTracker.showStudentFeeDetail('${student.id}')">
                
                <div class="student-fee-header">
                    <div>
                        <div class="student-fee-name">
                            <i class="fas fa-user-graduate"></i>
                            ${this.escapeHtml(student.name)}
                        </div>
                        <div class="student-fee-class">
                            Class: ${this.escapeHtml(student.class)} • Roll: ${this.escapeHtml(student.rollNumber)}
                        </div>
                    </div>
                    <div class="fee-status-badge ${student.status}">
                        ${student.status === 'up-to-date' ? 'Up to Date' : 
                          student.status === 'pending' ? 'Has Pending' : 'Partial Payments'}
                    </div>
                </div>

                <div class="fee-summary">
                    <div class="fee-summary-item">
                        <div class="fee-summary-label">Total Paid</div>
                        <div class="fee-summary-value success">₹${student.totalPaid.toLocaleString()}</div>
                    </div>
                    <div class="fee-summary-item">
                        <div class="fee-summary-label">Monthly Fee</div>
                        <div class="fee-summary-value">₹${student.monthlyFee.toLocaleString()}</div>
                    </div>
                    <div class="fee-summary-item">
                        <div class="fee-summary-label">Paid Records</div>
                        <div class="fee-summary-value success">${student.paidCount}</div>
                    </div>
                    <div class="fee-summary-item">
                        <div class="fee-summary-label">Pending</div>
                        <div class="fee-summary-value ${student.pendingCount > 0 ? 'danger' : ''}">${student.pendingCount}</div>
                    </div>
                </div>

                <div style="margin-top: 20px; text-align: center; color: var(--text-secondary); font-size: 0.9rem;">
                    <i class="fas fa-mouse-pointer"></i>
                    Click to view detailed payment history
                </div>
            </div>
        `).join('');
    }

    showStudentFeeDetail(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        const studentsListView = document.getElementById('studentsListView');
        const studentDetailView = document.getElementById('studentDetailView');
        const backToStudentsList = document.getElementById('backToStudentsList');

        if (studentsListView) studentsListView.style.display = 'none';
        if (studentDetailView) studentDetailView.style.display = 'block';
        if (backToStudentsList) backToStudentsList.style.display = 'inline-flex';

        const studentRecords = this.feeRecords.filter(r => r.studentId === studentId);
        const currentYear = new Date().getFullYear();
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const monthlyData = months.map(month => {
            const record = studentRecords.find(r => r.month === month && r.year === currentYear);
            return {
                month,
                year: currentYear,
                record: record || null,
                status: record ? record.status.toLowerCase() : 'no-record'
            };
        });

        const totalPaid = studentRecords.filter(r => r.status === 'Paid').reduce((sum, r) => sum + r.amount, 0);
        const pendingCount = studentRecords.filter(r => r.status === 'Pending').length;
        const totalRecords = studentRecords.length;

        const detailContent = `
            <div class="student-detail-header slide-in-right">
                <div class="student-detail-name">
                    <i class="fas fa-user-circle"></i>
                    ${this.escapeHtml(student.name)}
                </div>
                <div class="student-detail-info">
                    <div><i class="fas fa-school"></i> Class: ${this.escapeHtml(student.class)}</div>
                    <div><i class="fas fa-id-card"></i> Roll: ${this.escapeHtml(student.rollNumber)}</div>
                    <div><i class="fas fa-rupee-sign"></i> Monthly Fee: ₹${student.monthlyFee.toLocaleString()}</div>
                    <div><i class="fas fa-phone"></i> Contact: ${this.escapeHtml(student.parentContact) || 'Not provided'}</div>
                </div>
            </div>

            <div class="records-summary" style="margin-bottom: 30px;">
                <div class="summary-item">
                    <i class="fas fa-chart-line" style="font-size: 1.5rem; margin-bottom: 10px; color: var(--info-color);"></i>
                    <div style="font-size: 1.5rem; font-weight: bold;">${totalRecords}</div>
                    <div style="font-size: 0.9rem; opacity: 0.8;">Total Records</div>
                </div>
                <div class="summary-item">
                    <i class="fas fa-rupee-sign" style="font-size: 1.5rem; margin-bottom: 10px; color: var(--success-color);"></i>
                    <div style="font-size: 1.5rem; font-weight: bold;">₹${totalPaid.toLocaleString()}</div>
                    <div style="font-size: 0.9rem; opacity: 0.8;">Total Paid</div>
                </div>
                <div class="summary-item">
                    <i class="fas fa-clock" style="font-size: 1.5rem; margin-bottom: 10px; color: var(--danger-color);"></i>
                    <div style="font-size: 1.5rem; font-weight: bold;">${pendingCount}</div>
                    <div style="font-size: 0.9rem; opacity: 0.8;">Pending Payments</div>
                </div>
            </div>

            <h3 style="margin-bottom: 25px; color: var(--text-primary);">
                <i class="fas fa-calendar-alt"></i>
                Monthly Payment Timeline - ${currentYear}
            </h3>

            <div class="monthly-timeline">
                ${monthlyData.map((monthData, index) => `
                    <div class="month-payment-card ${monthData.status}" style="animation-delay: ${index * 0.05}s">
                        <div class="month-payment-header">
                            <div class="month-name">
                                <i class="fas fa-calendar"></i>
                                ${monthData.month} ${monthData.year}
                            </div>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                ${monthData.record ? `
                                    <div class="payment-amount" style="color: ${
                                        monthData.record.status === 'Paid' ? 'var(--success-color)' :
                                        monthData.record.status === 'Partial' ? 'var(--warning-color)' :
                                        'var(--danger-color)'
                                    }">
                                        ₹${monthData.record.amount.toLocaleString()}
                                    </div>
                                ` : `
                                    <div class="payment-amount" style="color: var(--text-secondary); font-size: 0.9rem;">
                                        No Record
                                    </div>
                                `}
                            </div>
                        </div>
                        
                        ${monthData.record ? `
                            <div class="payment-details">
                                <div>
                                    <strong>Status:</strong>
                                    <span class="status ${monthData.record.status.toLowerCase()}">${monthData.record.status}</span>
                                </div>
                                <div><strong>Payment Date:</strong> ${this.formatDate(monthData.record.paymentDate)}</div>
                                <div><strong>Expected:</strong> ₹${student.monthlyFee.toLocaleString()}</div>
                                ${monthData.record.notes ? `<div><strong>Notes:</strong> ${this.escapeHtml(monthData.record.notes)}</div>` : ''}
                            </div>
                        ` : `
                            <div class="payment-details" style="text-align: center; color: var(--text-secondary);">
                                <div>
                                    <i class="fas fa-info-circle"></i>
                                    No payment record for this month
                                </div>
                                <div style="font-size: 0.8rem; margin-top: 5px;">
                                    Expected: ₹${student.monthlyFee.toLocaleString()}
                                </div>
                            </div>
                        `}
                    </div>
                `).join('')}
            </div>
        `;

        const studentDetailContent = document.getElementById('studentDetailContent');
        if (studentDetailContent) {
            studentDetailContent.innerHTML = detailContent;
        }
    }

    showStudentsListView() {
        const studentsListView = document.getElementById('studentsListView');
        const studentDetailView = document.getElementById('studentDetailView');
        const backToStudentsList = document.getElementById('backToStudentsList');

        if (studentsListView) studentsListView.style.display = 'grid';
        if (studentDetailView) studentDetailView.style.display = 'none';
        if (backToStudentsList) backToStudentsList.style.display = 'none';
    }

    filterStudentsByPaymentStatus(status) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(`show${status.charAt(0).toUpperCase() + status.slice(1)}Students`);
        if (activeBtn) activeBtn.classList.add('active');
        
        const cards = document.querySelectorAll('.student-fee-card');
        
        cards.forEach(card => {
            const shouldShow = status === 'all' || 
                              (status === 'paid' && !card.classList.contains('has-pending') && !card.classList.contains('has-partial')) ||
                              (status === 'pending' && (card.classList.contains('has-pending') || card.classList.contains('has-partial')));
            
            if (shouldShow) {
                card.style.display = 'block';
                card.classList.add('fade-in');
            } else {
                card.style.display = 'none';
            }
        });
    }

    searchStudentsForFees(query) {
        const cards = document.querySelectorAll('.student-fee-card');
        
        cards.forEach(card => {
            const studentName = card.querySelector('.student-fee-name')?.textContent?.toLowerCase() || '';
            const studentInfo = card.querySelector('.student-fee-class')?.textContent?.toLowerCase() || '';
            
            const shouldShow = !query || 
                              studentName.includes(query.toLowerCase()) || 
                              studentInfo.includes(query.toLowerCase());
            
            if (shouldShow) {
                card.style.display = 'block';
                card.classList.add('fade-in');
            } else {
                card.style.display = 'none';
            }
        });
    }

    displayFeeRecords() {
        this.displayStudentsFeeOverview();
    }

    searchStudents(query) {
        const filteredStudents = this.students.filter(student => 
            student.name.toLowerCase().includes(query.toLowerCase()) ||
            student.class.toLowerCase().includes(query.toLowerCase()) ||
            student.rollNumber.toLowerCase().includes(query.toLowerCase())
        );

        const container = document.getElementById('studentsList');
        if (!container) return;
        
        if (filteredStudents.length === 0 && query) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>No students found matching "${query}"</p>
                </div>
            `;
            return;
        }

        if (query === '') {
            this.displayStudents();
            return;
        }

        container.innerHTML = filteredStudents.map((student, index) => `
            <div class="student-card" style="animation-delay: ${index * 0.1}s">
                <div class="student-header">
                    <div class="student-name">
                        <i class="fas fa-user-graduate"></i>
                        ${this.escapeHtml(student.name)}
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <button class="edit-btn" onclick="window.feeTracker.openEditStudentModal('${student.id}')">
                            <i class="fas fa-edit"></i>
                            Edit
                        </button>
                        <button class="delete-btn ripple-effect" onclick="window.feeTracker.deleteStudent('${student.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="student-info">
                    <div class="info-item">
                        <i class="fas fa-school"></i>
                        <strong>Class:</strong> ${this.escapeHtml(student.class)}
                    </div>
                    <div class="info-item">
                        <i class="fas fa-id-card"></i>
                        <strong>Roll:</strong> ${this.escapeHtml(student.rollNumber)}
                    </div>
                    <div class="info-item">
                        <i class="fas fa-rupee-sign"></i>
                        <strong>Monthly Fee:</strong> ₹${student.monthlyFee.toLocaleString()}
                    </div>
                    <div class="info-item">
                        <i class="fas fa-phone"></i>
                        <strong>Contact:</strong> ${this.escapeHtml(student.parentContact) || 'Not provided'}
                    </div>
                    <div class="info-item">
                        <i class="fas fa-calendar-plus"></i>
                        <strong>Joined:</strong> ${this.formatDate(student.joiningDate)}
                    </div>
                </div>
            </div>
        `).join('');
    }

    populateStudentDropdowns() {
        const selects = ['feeStudent'];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (!select) return;
            
            const currentValue = select.value;
            
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }
            
            this.students.forEach(student => {
                const option = document.createElement('option');
                option.value = student.id;
                option.textContent = `${student.name} (${student.class})`;
                select.appendChild(option);
            });
            
            if (currentValue && this.students.some(s => s.id === currentValue)) {
                select.value = currentValue;
            }
        });
    }

    deleteStudent(id) {
        if (confirm('Are you sure you want to delete this student? This will also delete all their fee records.')) {
            this.students = this.students.filter(s => s.id !== id);
            this.feeRecords = this.feeRecords.filter(r => r.studentId !== id);
            this.saveData();
            this.displayStudents();
            this.populateStudentDropdowns();
            this.updateHomepageStats();
            this.showToast('Student deleted successfully', 'success');
        }
    }

    generateReports() {
        this.generateMonthlySummary();
        this.generatePaymentOverview();
        this.generateOutstandingFees();
    }

    generateMonthlySummary() {
        const container = document.getElementById('monthlySummary');
        if (!container) return;
        
        const currentYear = new Date().getFullYear();
        
        const monthlyData = {};
        this.feeRecords
            .filter(record => record.year === currentYear)
            .forEach(record => {
                if (!monthlyData[record.month]) {
                    monthlyData[record.month] = { total: 0, paid: 0, pending: 0 };
                }
                monthlyData[record.month].total += record.amount;
                if (record.status === 'Paid') {
                    monthlyData[record.month].paid += record.amount;
                } else {
                    monthlyData[record.month].pending += record.amount;
                }
            });

        const months = Object.keys(monthlyData);
        if (months.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <p>No data available for ${currentYear}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = months.map((month, index) => `
            <div style="margin-bottom: 15px; padding: 20px; background: var(--background-light); border-radius: 10px; border-left: 4px solid var(--info-color); animation: slideInUp 0.6s ease-out ${index * 0.1}s both;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <strong style="color: var(--text-primary); font-size: 1.1rem;">
                        <i class="fas fa-calendar"></i> ${month} ${currentYear}
                    </strong>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; font-size: 0.9rem;">
                    <div>
                        <div style="color: var(--text-secondary);">Total</div>
                        <div style="font-weight: bold; color: var(--text-primary);">₹${monthlyData[month].total.toLocaleString()}</div>
                    </div>
                    <div>
                        <div style="color: var(--text-secondary);">Paid</div>
                        <div style="font-weight: bold; color: var(--success-color);">₹${monthlyData[month].paid.toLocaleString()}</div>
                    </div>
                    <div>
                        <div style="color: var(--text-secondary);">Pending</div>
                        <div style="font-weight: bold; color: var(--danger-color);">₹${monthlyData[month].pending.toLocaleString()}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    generatePaymentOverview() {
        const container = document.getElementById('paymentOverview');
        if (!container) return;
        
        const paidRecords = this.feeRecords.filter(r => r.status === 'Paid');
        const pendingRecords = this.feeRecords.filter(r => r.status === 'Pending');
        const partialRecords = this.feeRecords.filter(r => r.status === 'Partial');
        
        const totalPaid = paidRecords.reduce((sum, r) => sum + r.amount, 0);
        const totalPending = pendingRecords.reduce((sum, r) => sum + r.amount, 0);
        const totalPartial = partialRecords.reduce((sum, r) => sum + r.amount, 0);

        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px;">
                <div style="text-align: center; padding: 20px; background: rgba(16, 185, 129, 0.1); border-radius: 12px; border: 2px solid rgba(16, 185, 129, 0.2);">
                    <i class="fas fa-check-circle" style="font-size: 2rem; color: var(--success-color); margin-bottom: 10px;"></i>
                    <div style="font-size: 1.5rem; font-weight: bold; color: var(--success-color); margin-bottom: 5px;">${paidRecords.length}</div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 8px;">Paid Records</div>
                    <div style="font-weight: bold; color: var(--text-primary);">₹${totalPaid.toLocaleString()}</div>
                </div>
                <div style="text-align: center; padding: 20px; background: rgba(239, 68, 68, 0.1); border-radius: 12px; border: 2px solid rgba(239, 68, 68, 0.2);">
                    <i class="fas fa-clock" style="font-size: 2rem; color: var(--danger-color); margin-bottom: 10px;"></i>
                    <div style="font-size: 1.5rem; font-weight: bold; color: var(--danger-color); margin-bottom: 5px;">${pendingRecords.length}</div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 8px;">Pending Records</div>
                    <div style="font-weight: bold; color: var(--text-primary);">₹${totalPending.toLocaleString()}</div>
                </div>
                <div style="text-align: center; padding: 20px; background: rgba(245, 158, 11, 0.1); border-radius: 12px; border: 2px solid rgba(245, 158, 11, 0.2);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: var(--warning-color); margin-bottom: 10px;"></i>
                    <div style="font-size: 1.5rem; font-weight: bold; color: var(--warning-color); margin-bottom: 5px;">${partialRecords.length}</div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 8px;">Partial Records</div>
                    <div style="font-weight: bold; color: var(--text-primary);">₹${totalPartial.toLocaleString()}</div>
                </div>
            </div>
        `;
    }

    generateOutstandingFees() {
        const container = document.getElementById('outstandingFees');
        if (!container) return;
        
        const outstandingStudents = this.students.map(student => {
            const studentRecords = this.feeRecords.filter(r => r.studentId === student.id);
            const paidAmount = studentRecords
                .filter(r => r.status === 'Paid')
                .reduce((sum, r) => sum + r.amount, 0);
            const pendingRecords = studentRecords.filter(r => r.status !== 'Paid');
            
            return {
                ...student,
                paidAmount,
                pendingCount: pendingRecords.length,
                pendingAmount: pendingRecords.reduce((sum, r) => sum + r.amount, 0)
            };
        }).filter(student => student.pendingCount > 0);

        if (outstandingStudents.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--success-color);">
                    <i class="fas fa-trophy" style="font-size: 3rem; margin-bottom: 15px;"></i>
                    <div style="font-size: 1.2rem; font-weight: bold;">🎉 All fees are up to date!</div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 5px;">No outstanding payments found</div>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="max-height: 350px; overflow-y: auto;">
                ${outstandingStudents.map((student, index) => `
                    <div style="padding: 15px; border: 1px solid var(--border-color); border-radius: 10px; margin-bottom: 12px; animation: slideInUp 0.6s ease-out ${index * 0.1}s both; border-left: 4px solid var(--danger-color);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                            <div>
                                <div style="font-weight: bold; color: var(--text-primary); font-size: 1rem;">
                                    <i class="fas fa-user"></i>
                                    ${student.name}
                                </div>
                                <div style="color: var(--text-secondary); font-size: 0.85rem;">
                                    Class: ${student.class} • Roll: ${student.rollNumber}
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="color: var(--danger-color); font-weight: bold; font-size: 0.9rem;">
                                    ${student.pendingCount} payment${student.pendingCount > 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.85rem;">
                            <div>
                                <span style="color: var(--text-secondary);">Pending:</span>
                                <span style="color: var(--danger-color); font-weight: bold;">₹${student.pendingAmount.toLocaleString()}</span>
                            </div>
                            <div>
                                <span style="color: var(--text-secondary);">Paid:</span>
                                <span style="color: var(--success-color); font-weight: bold;">₹${student.paidAmount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Add empty placeholder methods for edit functionality
    openEditStudentModal(studentId) {
        this.showToast('Edit functionality coming soon!', 'info');
    }

    updateStudent(e) {
        e.preventDefault();
        this.showToast('Edit functionality coming soon!', 'info');
    }

    openEditFeeModal(recordId) {
        this.showToast('Edit functionality coming soon!', 'info');
    }

    updateFeeRecord(e) {
        e.preventDefault();
        this.showToast('Edit functionality coming soon!', 'info');
    }

    // Export methods
    exportStudents() {
        this.showLoading();
        
        setTimeout(() => {
            const csvData = this.students.map(student => ({
                Name: student.name,
                Class: student.class,
                'Roll Number': student.rollNumber,
                'Monthly Fee': student.monthlyFee,
                'Parent Contact': student.parentContact,
                'Joining Date': student.joiningDate,
                'Date Added': student.dateAdded
            }));

            this.downloadCSV(csvData, 'students.csv');
            this.hideLoading();
            this.showToast('Students data exported successfully!', 'success');
        }, 1000);
    }

    exportFeeRecords() {
        this.showLoading();
        
        setTimeout(() => {
            const csvData = this.feeRecords.map(record => {
                const student = this.students.find(s => s.id === record.studentId);
                return {
                    'Student Name': student?.name || 'Unknown',
                    Class: student?.class || 'Unknown',
                    Month: record.month,
                    Year: record.year,
                    Amount: record.amount,
                    'Payment Date': record.paymentDate,
                    Status: record.status,
                    Notes: record.notes || ''
                };
            });

            this.downloadCSV(csvData, 'fee_records.csv');
            this.hideLoading();
            this.showToast('Fee records exported successfully!', 'success');
        }, 1000);
    }

    exportAllData() {
        this.showLoading();
        
        setTimeout(() => {
            const data = {
                students: this.students,
                feeRecords: this.feeRecords,
                exportDate: new Date().toISOString(),
                version: '2.0'
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `student_fee_data_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.hideLoading();
            this.showToast('All data exported successfully!', 'success');
        }, 1000);
    }

    generateFullReport() {
        this.showLoading();
        
        setTimeout(() => {
            const reportData = {
                summary: {
                    totalStudents: this.students.length,
                    totalRecords: this.feeRecords.length,
                    totalAmount: this.feeRecords.reduce((sum, r) => sum + r.amount, 0),
                    paidAmount: this.feeRecords.filter(r => r.status === 'Paid').reduce((sum, r) => sum + r.amount, 0)
                },
                students: this.students,
                records: this.feeRecords.map(record => {
                    const student = this.students.find(s => s.id === record.studentId);
                    return { ...record, studentName: student?.name, studentClass: student?.class };
                })
            };

            const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `full_report_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.hideLoading();
            this.showToast('Full report generated successfully!', 'success');
        }, 1000);
    }

    downloadCSV(data, filename) {
        if (data.length === 0) {
            this.showToast('No data to export', 'error');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    clearAllData() {
        if (confirm('⚠️ This will permanently delete ALL students and fee records. This action cannot be undone!\n\nType "DELETE" in the next prompt to confirm.')) {
            const confirmation = prompt('Type "DELETE" to confirm deletion of all data:');
            if (confirmation === 'DELETE') {
                this.showLoading();
                
                setTimeout(() => {
                    localStorage.removeItem('students');
                    localStorage.removeItem('feeRecords');
                    this.students = [];
                    this.feeRecords = [];
                    this.displayStudents();
                    this.populateStudentDropdowns();
                    this.displayFeeRecords();
                    this.generateReports();
                    this.updateHomepageStats();
                    this.displayRecentActivity();
                    
                    this.hideLoading();
                    this.showToast('All data has been cleared!', 'success');
                }, 1000);
            }
        }
    }

    saveData() {
        try {
            localStorage.setItem('students', JSON.stringify(this.students));
            localStorage.setItem('feeRecords', JSON.stringify(this.feeRecords));
        } catch (error) {
            this.showToast('Error saving data: ' + error.message, 'error');
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'Not specified';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.toString().replace(/[&<>"']/g, m => map[m]);
    }

    setupAnimations() {
        // Simple animation setup - no complex observers for debugging
        const cards = document.querySelectorAll('.student-card, .fee-record, .report-card');
        cards.forEach((card, index) => {
            if (card) {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }
        });
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    showLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.style.display = 'flex';
    }

    hideLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.style.display = 'none';
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = {
            success: 'fas fa-check-circle',
            error: 'fas fa-times-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="${icon[type]}" style="color: var(--${type === 'success' ? 'success' : type === 'error' ? 'danger' : type === 'warning' ? 'warning' : 'info'}-color);"></i>
                <span>${message}</span>
            </div>
        `;

        const container = document.getElementById('toastContainer');
        if (container) {
            container.appendChild(toast);

            setTimeout(() => {
                toast.style.animation = 'slideInRight 0.3s ease-out reverse';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    }
}

// Initialize the application
if (!window.feeTracker) {
    window.feeTracker = new StudentFeeTracker();
}

// Add ripple effect to buttons
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('ripple-effect')) {
        const ripple = document.createElement('span');
        const rect = e.target.getBoundingClientRect();
        const size = Math.max(rect.height, rect.width);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        e.target.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
});
