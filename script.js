// Student Fee Tracker Application - Enhanced Version with Complete Edit Functionality
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
        this.setupEventListeners();
        this.setupFeeTrackingEventListeners();
        this.setupEditEventListeners();
        this.displayStudents();
        this.populateStudentDropdowns();
        this.displayFeeRecords();
        this.generateReports();
        this.setupAnimations();
        this.isInitialized = true;
        console.log('Student Fee Tracker initialized successfully');
    }

    setupEventListeners() {
        this.resetEventListeners();

        // Navigation
        document.getElementById('studentsTab').onclick = () => this.showSection('students');
        document.getElementById('feesTab').onclick = () => this.showSection('fees');
        document.getElementById('reportsTab').onclick = () => this.showSection('reports');

        // Forms
        document.getElementById('studentForm').onsubmit = (e) => this.addStudent(e);
        document.getElementById('feeForm').onsubmit = (e) => this.addFeeRecord(e);

        // Search with debounce
        document.getElementById('searchStudents').oninput = (e) => this.debounce(() => {
            this.searchStudents(e.target.value);
        }, 300)();

        // Export buttons
        document.getElementById('exportStudents').onclick = () => this.exportStudents();
        document.getElementById('exportFees').onclick = () => this.exportFeeRecords();
        document.getElementById('exportAll').onclick = () => this.exportAllData();
        document.getElementById('generateReport').onclick = () => this.generateFullReport();
        document.getElementById('clearAllData').onclick = () => this.clearAllData();

        // Set default dates
        document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('joiningDate').value = new Date().toISOString().split('T')[0];
    }

    setupFeeTrackingEventListeners() {
        // Back button
        document.getElementById('backToStudentsList').onclick = () => this.showStudentsListView();
        
        // Filter buttons
        document.getElementById('showAllStudents').onclick = () => this.filterStudentsByPaymentStatus('all');
        document.getElementById('showPaidStudents').onclick = () => this.filterStudentsByPaymentStatus('paid');
        document.getElementById('showPendingStudents').onclick = () => this.filterStudentsByPaymentStatus('pending');
        
        // Search functionality
        document.getElementById('searchFeeStudents').oninput = (e) => this.debounce(() => {
            this.searchStudentsForFees(e.target.value);
        }, 300)();
    }

    setupEditEventListeners() {
        // Edit student form
        document.getElementById('editStudentForm').onsubmit = (e) => this.updateStudent(e);
        
        // Edit fee form
        document.getElementById('editFeeForm').onsubmit = (e) => this.updateFeeRecord(e);
    }

    openEditStudentModal(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        // Populate form with current student data
        document.getElementById('editStudentId').value = student.id;
        document.getElementById('editStudentName').value = student.name;
        document.getElementById('editStudentClass').value = student.class;
        document.getElementById('editStudentRoll').value = student.rollNumber;
        document.getElementById('editMonthlyFee').value = student.monthlyFee;
        document.getElementById('editParentContact').value = student.parentContact || '';
        document.getElementById('editJoiningDate').value = student.joiningDate;

        // Show modal
        document.getElementById('editStudentModal').style.display = 'flex';
    }

    closeEditStudentModal() {
        document.getElementById('editStudentModal').style.display = 'none';
        document.getElementById('editStudentForm').reset();
    }

    updateStudent(e) {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        this.showLoading();
        
        try {
            const studentId = document.getElementById('editStudentId').value;
            const name = document.getElementById('editStudentName').value?.trim();
            const studentClass = document.getElementById('editStudentClass').value?.trim();
            const rollNumber = document.getElementById('editStudentRoll').value?.trim();
            const monthlyFee = parseFloat(document.getElementById('editMonthlyFee').value);
            const parentContact = document.getElementById('editParentContact').value?.trim() || '';
            const joiningDate = document.getElementById('editJoiningDate').value;

            if (!name || !studentClass || !rollNumber || isNaN(monthlyFee) || !joiningDate) {
                throw new Error('Please fill in all required fields correctly!');
            }

            // Check for duplicate roll number (excluding current student)
            if (this.students.some(s => s.rollNumber === rollNumber && s.id !== studentId)) {
                throw new Error('A student with this roll number already exists!');
            }

            // Find and update student
            const studentIndex = this.students.findIndex(s => s.id === studentId);
            if (studentIndex !== -1) {
                this.students[studentIndex] = {
                    ...this.students[studentIndex],
                    name,
                    class: studentClass,
                    rollNumber,
                    monthlyFee,
                    parentContact,
                    joiningDate,
                    lastModified: new Date().toLocaleDateString()
                };

                this.saveData();
                this.displayStudents();
                this.populateStudentDropdowns();
                this.displayStudentsFeeOverview();
                
                this.closeEditStudentModal();
                this.showToast('Student updated successfully! 🎉', 'success');
            }

        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            this.hideLoading();
            setTimeout(() => {
                submitBtn.disabled = false;
            }, 1000);
        }
    }

    openEditFeeModal(recordId) {
        const record = this.feeRecords.find(r => r.id === recordId);
        if (!record) return;

        // Populate dropdown with students
        this.populateEditFeeStudentDropdown();

        // Populate form with current record data
        document.getElementById('editFeeId').value = record.id;
        document.getElementById('editFeeStudent').value = record.studentId;
        document.getElementById('editFeeMonth').value = record.month;
        document.getElementById('editFeeYear').value = record.year;
        document.getElementById('editFeeAmount').value = record.amount;
        document.getElementById('editPaymentDate').value = record.paymentDate;
        document.getElementById('editPaymentStatus').value = record.status;
        document.getElementById('editPaymentNotes').value = record.notes || '';

        // Show modal
        document.getElementById('editFeeModal').style.display = 'flex';
    }

    closeEditFeeModal() {
        document.getElementById('editFeeModal').style.display = 'none';
        document.getElementById('editFeeForm').reset();
    }

    populateEditFeeStudentDropdown() {
        const select = document.getElementById('editFeeStudent');
        
        // Clear existing options (except first)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        // Add student options
        this.students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = `${student.name} (${student.class})`;
            select.appendChild(option);
        });
    }

    updateFeeRecord(e) {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        this.showLoading();
        
        try {
            const recordId = document.getElementById('editFeeId').value;
            const studentId = document.getElementById('editFeeStudent').value;
            const month = document.getElementById('editFeeMonth').value;
            const year = parseInt(document.getElementById('editFeeYear').value);
            const amount = parseFloat(document.getElementById('editFeeAmount').value);
            const paymentDate = document.getElementById('editPaymentDate').value;
            const status = document.getElementById('editPaymentStatus').value;
            const notes = document.getElementById('editPaymentNotes').value?.trim() || '';

            if (!studentId || !month || !year || isNaN(amount) || !paymentDate) {
                throw new Error('Please fill in all required fields!');
            }

            // Check for duplicate record (excluding current record)
            const existingRecord = this.feeRecords.find(r => 
                r.studentId === studentId && 
                r.month === month && 
                r.year === year &&
                r.id !== recordId
            );

            if (existingRecord) {
                throw new Error('A record for this student and month already exists!');
            }

            // Find and update record
            const recordIndex = this.feeRecords.findIndex(r => r.id === recordId);
            if (recordIndex !== -1) {
                this.feeRecords[recordIndex] = {
                    ...this.feeRecords[recordIndex],
                    studentId,
                    month,
                    year,
                    amount,
                    paymentDate,
                    status,
                    notes,
                    lastModified: new Date().toISOString()
                };

                this.updateStudentTotals(studentId);
                this.saveData();
                this.displayStudentsFeeOverview();
                this.generateReports();
                
                this.closeEditFeeModal();
                this.showToast('Fee record updated successfully! 💰', 'success');
            }

        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            this.hideLoading();
            setTimeout(() => {
                submitBtn.disabled = false;
            }, 1000);
        }
    }

    setupAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        document.querySelectorAll('.student-card, .fee-record, .report-card').forEach(el => {
            observer.observe(el);
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
        document.getElementById('loadingSpinner').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingSpinner').style.display = 'none';
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

        document.getElementById('toastContainer').appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    resetEventListeners() {
        const forms = ['studentForm', 'feeForm'];
        forms.forEach(formId => {
            const form = document.getElementById(formId);
            if (form) {
                const newForm = form.cloneNode(true);
                form.parentNode.replaceChild(newForm, form);
            }
        });
    }

    showSection(section) {
        this.showLoading();
        
        setTimeout(() => {
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

            document.getElementById(`${section}Section`).classList.add('active');
            document.getElementById(`${section}Tab`).classList.add('active');

            if (section === 'reports') {
                this.generateReports();
            } else if (section === 'fees') {
                this.displayStudentsFeeOverview();
            }

            setTimeout(() => {
                document.querySelectorAll(`#${section}Section .slide-in`).forEach((el, index) => {
                    el.style.animationDelay = `${index * 0.1}s`;
                    el.classList.add('slide-in');
                });
            }, 100);

            this.hideLoading();
        }, 300);
    }

    addStudent(e) {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        this.showLoading();
        
        try {
            const name = document.getElementById('studentName').value?.trim();
            const studentClass = document.getElementById('studentClass').value?.trim();
            const rollNumber = document.getElementById('studentRoll').value?.trim();
            const monthlyFee = parseFloat(document.getElementById('monthlyFee').value);
            const parentContact = document.getElementById('parentContact').value?.trim() || '';
            const joiningDate = document.getElementById('joiningDate').value;

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
            
            document.getElementById('studentForm').reset();
            document.getElementById('joiningDate').value = new Date().toISOString().split('T')[0];
            this.showToast('Student added successfully! 🎉', 'success');

        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            this.hideLoading();
            setTimeout(() => {
                submitBtn.disabled = false;
            }, 1000);
        }
    }

    addFeeRecord(e) {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        this.showLoading();
        
        try {
            const feeRecord = {
                id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
                studentId: document.getElementById('feeStudent').value,
                month: document.getElementById('feeMonth').value,
                year: parseInt(document.getElementById('feeYear').value),
                amount: parseFloat(document.getElementById('feeAmount').value),
                paymentDate: document.getElementById('paymentDate').value,
                status: document.getElementById('paymentStatus').value,
                notes: document.getElementById('paymentNotes').value?.trim() || '',
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
            document.getElementById('feeForm').reset();
            document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
            
            this.showToast('Fee record saved successfully! 💰', 'success');

        } catch (error) {
            this.showToast(error.message, 'error');
        } finally {
            this.hideLoading();
            setTimeout(() => {
                submitBtn.disabled = false;
            }, 1000);
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

        setTimeout(() => {
            document.querySelectorAll('.student-card').forEach(card => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            });
        }, 100);
    }

    displayStudentsFeeOverview() {
        const container = document.getElementById('studentsListView');
        
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
            const totalPending = pendingRecords.reduce((sum, r) => sum + r.amount, 0);
            const totalPartial = partialRecords.reduce((sum, r) => sum + r.amount, 0);
            
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
                totalPending,
                totalPartial,
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

                ${student.recentPayments.length > 0 ? `
                    <div class="recent-payments">
                        <div class="recent-payments-title">
                            <i class="fas fa-history"></i>
                            Recent Payments
                        </div>
                        ${student.recentPayments.map(payment => `
                            <div class="recent-payment-item">
                                <span class="recent-payment-month">${payment.month} ${payment.year}</span>
                                <span class="recent-payment-status ${payment.status.toLowerCase()}">${payment.status}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="recent-payments">
                        <div class="recent-payments-title" style="color: var(--text-secondary); text-align: center;">
                            <i class="fas fa-info-circle"></i>
                            No payment records yet
                        </div>
                    </div>
                `}

                <div style="margin-top: 20px; text-align: center; color: var(--text-secondary); font-size: 0.9rem;">
                    <i class="fas fa-mouse-pointer"></i>
                    Click to view detailed payment history
                </div>
            </div>
        `).join('');

        setTimeout(() => {
            document.querySelectorAll('.student-fee-card').forEach(card => {
                card.classList.add('fade-in');
            });
        }, 100);
    }

    showStudentFeeDetail(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        const studentRecords = this.feeRecords.filter(r => r.studentId === studentId);
        
        document.getElementById('studentsListView').style.display = 'none';
        document.getElementById('studentDetailView').style.display = 'block';
        document.getElementById('backToStudentsList').style.display = 'inline-flex';

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
                    <button class="edit-btn" onclick="window.feeTracker.openEditStudentModal('${student.id}')" style="margin-left: 20px;">
                        <i class="fas fa-edit"></i>
                        Edit Student
                    </button>
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
                                    <button class="edit-btn" onclick="window.feeTracker.openEditFeeModal('${monthData.record.id}')">
                                        <i class="fas fa-edit"></i>
                                        Edit
                                    </button>
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
                                ${monthData.record.lastModified ? `<div style="color: var(--warning-color);"><strong>Modified:</strong> ${this.formatDate(monthData.record.lastModified.split('T')[0])}</div>` : ''}
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

        document.getElementById('studentDetailContent').innerHTML = detailContent;

        setTimeout(() => {
            document.querySelectorAll('.month-payment-card').forEach((card, index) => {
                card.style.animationDelay = `${index * 0.05}s`;
                card.classList.add('slide-in');
            });
        }, 100);
    }

    showStudentsListView() {
        document.getElementById('studentsListView').style.display = 'grid';
        document.getElementById('studentDetailView').style.display = 'none';
        document.getElementById('backToStudentsList').style.display = 'none';
    }

    filterStudentsByPaymentStatus(status) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`show${status.charAt(0).toUpperCase() + status.slice(1)}Students`).classList.add('active');
        
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
            const studentName = card.querySelector('.student-fee-name').textContent.toLowerCase();
            const studentInfo = card.querySelector('.student-fee-class').textContent.toLowerCase();
            
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
