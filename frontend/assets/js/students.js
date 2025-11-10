let students = [];
let programmes = [];
let courses = [];
let users = [];
let programmeMap = {}; // Map ProgrammeId to Programme info
let userMap = {}; // Map UserId to User info
let courseMap = {}; // Map CourseId to Course info
let grades = []; // All grades
let studentGradesMap = {}; // Map StudentId to array of Grades
let currentDeleteId = null;
let currentAdminProfileId = null; // Current logged-in admin's profile ID
let myDepartmentIds = []; // IDs of departments owned by current admin
let myProgrammeIds = []; // IDs of programmes from admin's departments
let currentStudentIdForGrades = null; // Current student ID for grades modal
let currentGradeCourseId = null; // Current course ID for grade edit

document.addEventListener('DOMContentLoaded', async () => {
  // Check if we're on the students page
  if (!document.getElementById('studentsTableBody')) {
    return;
  }

  // Get current logged-in admin's profile ID
  const userData = auth.getUserData();
  if (userData && userData.userType === 'DepartmentAdmin' && userData.profileId) {
    currentAdminProfileId = userData.profileId;
  } else {
    showAlert('Error: Could not determine current admin. Please login again.', 'danger');
    return;
  }

  await loadDepartments();
  
  await loadProgrammes();
  
  await loadCourses();
  
  await loadUsers();
  
  await loadGrades();

  await loadStudents();

  setupFormHandler();

  setupDeleteHandler();

  setupGradeFormHandler();
});

// Load departments from API (only those owned by current admin)
async function loadDepartments() {
  try {
    const allDepartments = await api.get('/Departments');
    // Filter to only show departments owned by current admin
    const myDepartments = allDepartments.filter(dept => {
      const deptAdminId = dept.departmentAdminId || dept.DepartmentAdminId;
      return deptAdminId === currentAdminProfileId;
    });
    
    myDepartmentIds = myDepartments.map(dept => dept.id || dept.Id);
  } catch (error) {
    console.error('Error loading departments:', error);
  }
}

// Load programmes from API
async function loadProgrammes() {
  try {
    const allProgrammes = await api.get('/Programmes');
    // Filter to show only programmes from departments owned by current admin
    programmes = allProgrammes.filter(prog => {
      const deptId = prog.departmentId || prog.DepartmentId;
      return myDepartmentIds.includes(deptId);
    });
    
    myProgrammeIds = programmes.map(prog => prog.id || prog.Id);
    buildProgrammeMap();
    populateProgrammeDropdown();
  } catch (error) {
    console.error('Error loading programmes:', error);
    showAlert('Error loading programmes. Please refresh the page.', 'danger');
  }
}

// Build map of ProgrammeId to Programme info
function buildProgrammeMap() {
  programmeMap = {};
  programmes.forEach(prog => {
    const progId = prog.id || prog.Id;
    const progName = prog.programmeName || prog.ProgrammeName;
    programmeMap[progId] = {
      name: progName,
      sessionStart: prog.sessionStart || prog.SessionStart,
      sessionEnd: prog.sessionEnd || prog.SessionEnd
    };
  });
}

// Populate programme dropdown
function populateProgrammeDropdown() {
  const select = document.getElementById('studentProgrammeId');
  if (!select) return;

  select.innerHTML = '<option value="">No Programme</option>';
  
  programmes.forEach(prog => {
    const progId = prog.id || prog.Id;
    const progName = prog.programmeName || prog.ProgrammeName;
    const option = document.createElement('option');
    option.value = progId;
    option.textContent = progName;
    select.appendChild(option);
  });
}

// Load courses from API
async function loadCourses() {
  try {
    courses = await api.get('/Courses');
    buildCourseMap();
    populateGradeCourseDropdown();
  } catch (error) {
    console.error('Error loading courses:', error);
  }
}

// Build map of CourseId to Course info
function buildCourseMap() {
  courseMap = {};
  courses.forEach(course => {
    const courseId = course.id || course.Id;
    const courseName = course.courseName || course.CourseName;
    courseMap[courseId] = {
      name: courseName,
      description: course.description || course.Description || '',
      creditWeight: course.creditWeight || course.CreditWeight
    };
  });
}

// Populate grade course dropdown
function populateGradeCourseDropdown() {
  const select = document.getElementById('gradeCourseSelect');
  if (!select) return;

  select.innerHTML = '<option value="">Select Course...</option>';
  
  courses.forEach(course => {
    const courseId = course.id || course.Id;
    const courseName = course.courseName || course.CourseName;
    const option = document.createElement('option');
    option.value = courseId;
    option.textContent = courseName;
    select.appendChild(option);
  });
}

// Load users from API
async function loadUsers() {
  try {
    users = await api.get('/Users');
    buildUserMap();
  } catch (error) {
    console.error('Error loading users:', error);
    // Don't show error for users, we can still work without names
  }
}

// Build map of UserId to User info
function buildUserMap() {
  userMap = {};
  users.forEach(user => {
    const userId = user.id || user.Id;
    const firstName = user.firstName || user.FirstName || '';
    const lastName = user.lastName || user.LastName || '';
    const email = user.email || user.Email || '';
    userMap[userId] = {
      name: `${firstName} ${lastName}`.trim() || 'Unknown',
      email: email || 'No email',
      firstName: firstName,
      lastName: lastName
    };
  });
}

// Load grades from API
async function loadGrades() {
  try {
    grades = await api.get('/Grades');
    buildStudentGradesMap();
  } catch (error) {
    console.error('Error loading grades:', error);
  }
}

// Build map of StudentId to array of Grades
function buildStudentGradesMap() {
  studentGradesMap = {};
  grades.forEach(grade => {
    const studentId = String(grade.studentId || grade.StudentId);
    if (!studentGradesMap[studentId]) {
      studentGradesMap[studentId] = [];
    }
    studentGradesMap[studentId].push(grade);
  });
}

// Load students from API
async function loadStudents() {
  try {
    students = await api.get('/Students');
    renderStudentsTable();
  } catch (error) {
    console.error('Error loading students:', error);
    showAlert('Error loading students. Please refresh the page.', 'danger');
    document.getElementById('studentsTableBody').innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-danger">Error loading students. Please refresh the page.</td>
      </tr>
    `;
  }
}

// Get user info from student (handles both navigation property and userMap fallback)
function getUserInfoFromStudent(student) {
  // Try to get User from navigation property first
  const user = student.user || student.User;
  if (user) {
    const firstName = user.firstName || user.FirstName || '';
    const lastName = user.lastName || user.LastName || '';
    const email = user.email || user.Email || '';
    return {
      name: `${firstName} ${lastName}`.trim() || 'Unknown',
      email: email || 'No email',
      firstName: firstName,
      lastName: lastName
    };
  }
  
  // Fallback to userMap if navigation property not available
  const userId = student.userId || student.UserId;
  return userMap[userId] || {
    name: 'Unknown User',
    email: 'No email'
  };
}

// Get programme info from student (handles both navigation property and programmeMap fallback)
function getProgrammeInfoFromStudent(student) {
  // Try to get Programme from navigation property first
  const programme = student.programme || student.Programme;
  if (programme) {
    const progName = programme.programmeName || programme.ProgrammeName || 'Unknown Programme';
    return {
      name: progName,
      sessionStart: programme.sessionStart || programme.SessionStart,
      sessionEnd: programme.sessionEnd || programme.SessionEnd
    };
  }
  
  // Fallback to programmeMap if navigation property not available
  const progId = student.programmeId || student.ProgrammeId;
  if (progId) {
    return programmeMap[progId] || {
      name: 'Unknown Programme',
      sessionStart: null,
      sessionEnd: null
    };
  }
  
  return null;
}

// Render students table
function renderStudentsTable() {
  const tbody = document.getElementById('studentsTableBody');
  if (!tbody) return;

  if (students.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted">No students found. Students are created through the registration system.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = students.map(student => {
    // Try both camelCase and PascalCase for property names
    const studentId = student.id || student.Id;
    const year = student.year || student.Year;
    const averageGrade = student.averageGrade || student.AverageGrade;
    
    const userInfo = getUserInfoFromStudent(student);
    const progInfo = getProgrammeInfoFromStudent(student);

    // Get grade count
    const studentKey = String(studentId);
    const studentGrades = studentGradesMap[studentKey] || [];
    const gradeCount = studentGrades.length;
    const gradeLabel = gradeCount === 1 ? 'grade' : 'grades';
    const gradeBadge = gradeCount > 0
      ? `<span class="badge bg-info">${gradeCount} ${gradeLabel}</span>`
      : '<span class="badge bg-secondary">0 grades</span>';

    const averageGradeDisplay = averageGrade !== null && averageGrade !== undefined
      ? `<span class="badge bg-success">${averageGrade.toFixed(2)}%</span>`
      : '<span class="text-muted">N/A</span>';

    return `
      <tr>
        <td><strong>${escapeHtml(userInfo.name)}</strong></td>
        <td>${escapeHtml(userInfo.email)}</td>
        <td><span class="badge bg-primary">Year ${year}</span></td>
        <td>${progInfo ? escapeHtml(progInfo.name) : '<span class="text-muted">No programme</span>'}</td>
        <td>${averageGradeDisplay}</td>
        <td>${gradeBadge}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-secondary me-2" onclick="openGradesModal('${studentId}')">
            <i class="bi bi-clipboard-data"></i> Grades
          </button>
          <button class="btn btn-sm btn-outline-primary me-2" onclick="openEditModal('${studentId}')">
            <i class="bi bi-pencil"></i> Edit
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="openDeleteModal('${studentId}')">
            <i class="bi bi-trash"></i> Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Open edit modal
function openEditModal(studentId) {
  const student = students.find(s => (s.id || s.Id) === studentId);
  if (!student) {
    showAlert('Student not found.', 'danger');
    return;
  }

  const userId = student.userId || student.UserId;
  const userInfo = getUserInfoFromStudent(student);

  const modal = new bootstrap.Modal(document.getElementById('studentModal'));
  document.getElementById('studentId').value = student.id || student.Id;
  document.getElementById('studentUserId').value = userId;
  document.getElementById('studentName').value = userInfo.name;
  document.getElementById('studentEmail').value = userInfo.email;
  document.getElementById('studentYear').value = student.year || student.Year;
  
  const progId = student.programmeId || student.ProgrammeId;
  document.getElementById('studentProgrammeId').value = progId || '';
  
  const avgGrade = student.averageGrade || student.AverageGrade;
  document.getElementById('studentAverageGrade').value = avgGrade !== null && avgGrade !== undefined ? avgGrade : '';
  
  document.getElementById('studentForm').classList.remove('was-validated');
  modal.show();
}

// Setup form handler
function setupFormHandler() {
  const form = document.getElementById('studentForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const studentId = document.getElementById('studentId').value;
    const userId = document.getElementById('studentUserId').value;
    const year = parseInt(document.getElementById('studentYear').value);
    const programmeId = document.getElementById('studentProgrammeId').value;
    const averageGrade = document.getElementById('studentAverageGrade').value;

    // Validate year
    if (isNaN(year) || year < 1 || year > 10) {
      showAlert('Year must be between 1 and 10.', 'danger');
      return;
    }

    // Validate programme belongs to admin (if provided)
    if (programmeId && !myProgrammeIds.includes(programmeId)) {
      showAlert('You can only assign students to programmes from your departments.', 'warning');
      return;
    }

    const studentData = {
      userId: userId,
      year: year,
      programmeId: programmeId || null,
      averageGrade: averageGrade ? parseFloat(averageGrade) : null
    };

    const submitBtn = document.getElementById('studentSubmitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';

    try {
      // Update existing student
      await api.put(`/Students/${studentId}`, studentData);
      showAlert('Student updated successfully!', 'success');

      // Close modal and reload students
      const modal = bootstrap.Modal.getInstance(document.getElementById('studentModal'));
      modal.hide();
      await loadStudents();
    } catch (error) {
      console.error('Error updating student:', error);
      showAlert(error.message || 'Error updating student. Please try again.', 'danger');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

// Open delete modal
function openDeleteModal(studentId) {
  currentDeleteId = studentId;
  const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
  modal.show();
}

// Setup delete confirmation handler
function setupDeleteHandler() {
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
      if (!currentDeleteId) return;

      const btn = confirmDeleteBtn;
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Deleting...';

      try {
        // Delete student (backend will check for grades)
        await api.delete(`/Students/${currentDeleteId}`);
        showAlert('Student deleted successfully!', 'success');

        // Close modal and reload students
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
        modal.hide();
        await loadStudents();
        await loadGrades(); // Reload grades
      } catch (error) {
        console.error('Error deleting student:', error);
        // Backend returns detailed error messages about why deletion failed
        const errorMessage = error.message || 'Error deleting student. Please try again.';
        showAlert(errorMessage, 'danger');
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
        currentDeleteId = null;
      }
    });
  }
}

// Open grades modal
async function openGradesModal(studentId) {
  currentStudentIdForGrades = studentId;

  const student = students.find(s => (s.id || s.Id) === studentId);
  if (!student) {
    showAlert('Student not found.', 'danger');
    return;
  }

  const userInfo = getUserInfoFromStudent(student);
  const studentName = userInfo.name || 'Student';
  document.getElementById('gradesModalLabel').textContent = `Manage Grades · ${studentName}`;
  document.getElementById('gradesStudentName').textContent = studentName;

  // Load grades for this student
  await loadStudentGrades(studentId);

  const modal = new bootstrap.Modal(document.getElementById('gradesModal'));
  modal.show();
}

// Load grades for a specific student
async function loadStudentGrades(studentId) {
  try {
    const studentGrades = await api.get(`/Grades/student/${studentId}`);
    renderGradesTable(studentGrades);
  } catch (error) {
    console.error('Error loading student grades:', error);
    document.getElementById('gradesTableBody').innerHTML = `
      <tr>
        <td colspan="3" class="text-center text-danger">Error loading grades.</td>
      </tr>
    `;
  }
}

// Render grades table
function renderGradesTable(studentGrades) {
  const tbody = document.getElementById('gradesTableBody');
  if (!tbody) return;

  if (studentGrades.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" class="text-center text-muted">No grades found. Click "Add Grade" to add one.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = studentGrades.map(grade => {
    const courseId = grade.courseId || grade.CourseId;
    const score = grade.score || grade.Score;
    
    const courseInfo = courseMap[courseId] || {
      name: 'Unknown Course',
      description: '',
      creditWeight: 0
    };

    const scoreDisplay = score !== null && score !== undefined
      ? `<span class="badge ${score >= 70 ? 'bg-success' : score >= 50 ? 'bg-warning' : 'bg-danger'}">${score.toFixed(2)}%</span>`
      : '<span class="text-muted">Not graded</span>';

    return `
      <tr>
        <td><strong>${escapeHtml(courseInfo.name)}</strong></td>
        <td>${scoreDisplay}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary me-2" onclick="openEditGradeModal('${courseId}')">
            <i class="bi bi-pencil"></i> Edit
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="openDeleteGradeModal('${courseId}')">
            <i class="bi bi-trash"></i> Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Open add grade modal
function openAddGradeModal() {
  currentGradeCourseId = null;
  const modal = new bootstrap.Modal(document.getElementById('gradeModal'));
  document.getElementById('gradeModalLabel').textContent = 'Add Grade';
  document.getElementById('gradeSubmitBtn').textContent = 'Save';
  document.getElementById('gradeForm').reset();
  document.getElementById('gradeStudentId').value = currentStudentIdForGrades;
  document.getElementById('gradeCourseId').value = '';
  document.getElementById('gradeForm').classList.remove('was-validated');
  modal.show();
}

// Open edit grade modal
async function openEditGradeModal(courseId) {
  currentGradeCourseId = courseId;

  try {
    const grade = await api.get(`/Grades/${currentStudentIdForGrades}/${courseId}`);
    const score = grade.score || grade.Score;

    const modal = new bootstrap.Modal(document.getElementById('gradeModal'));
    document.getElementById('gradeModalLabel').textContent = 'Edit Grade';
    document.getElementById('gradeSubmitBtn').textContent = 'Update';
    document.getElementById('gradeStudentId').value = currentStudentIdForGrades;
    document.getElementById('gradeCourseId').value = courseId;
    document.getElementById('gradeCourseSelect').value = courseId;
    document.getElementById('gradeCourseSelect').disabled = true; // Can't change course
    document.getElementById('gradeScore').value = score !== null && score !== undefined ? score : '';
    document.getElementById('gradeForm').classList.remove('was-validated');
    modal.show();
  } catch (error) {
    console.error('Error loading grade:', error);
    showGradesAlert('Error loading grade. Please try again.', 'danger');
  }
}

// Open delete grade modal
async function openDeleteGradeModal(courseId) {
  if (!confirm('Are you sure you want to delete this grade?')) {
    return;
  }

  try {
    await api.delete(`/Grades/${currentStudentIdForGrades}/${courseId}`);
    showGradesAlert('Grade deleted successfully!', 'success');
    await loadStudentGrades(currentStudentIdForGrades);
    await loadGrades(); // Reload all grades
    renderStudentsTable(); // Update students table
  } catch (error) {
    console.error('Error deleting grade:', error);
    showGradesAlert(error.message || 'Error deleting grade. Please try again.', 'danger');
  }
}

// Setup grade form handler
function setupGradeFormHandler() {
  const form = document.getElementById('gradeForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const studentId = document.getElementById('gradeStudentId').value;
    const courseId = document.getElementById('gradeCourseSelect').value;
    const score = document.getElementById('gradeScore').value;

    if (!courseId) {
      showGradesAlert('Please select a course.', 'danger');
      return;
    }

    // Validate score if provided
    if (score) {
      const scoreNum = parseFloat(score);
      if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
        showGradesAlert('Score must be between 0 and 100.', 'danger');
        return;
      }
    }

    const gradeData = {
      studentId: studentId,
      courseId: courseId,
      score: score ? parseFloat(score) : null
    };

    const submitBtn = document.getElementById('gradeSubmitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

    try {
      if (currentGradeCourseId) {
        // Update existing grade
        await api.put(`/Grades/${studentId}/${courseId}`, gradeData);
        showGradesAlert('Grade updated successfully!', 'success');
      } else {
        // Create new grade
        await api.post('/Grades', gradeData);
        showGradesAlert('Grade added successfully!', 'success');
      }

      // Close modal and reload grades
      const modal = bootstrap.Modal.getInstance(document.getElementById('gradeModal'));
      modal.hide();
      document.getElementById('gradeCourseSelect').disabled = false; // Re-enable course select
      await loadStudentGrades(studentId);
      await loadGrades(); // Reload all grades
      renderStudentsTable(); // Update students table
    } catch (error) {
      console.error('Error saving grade:', error);
      showGradesAlert(error.message || 'Error saving grade. Please try again.', 'danger');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

// Show alert in grades modal
function showGradesAlert(message, type = 'info') {
  const container = document.getElementById('gradesAlert');
  if (!container) return;

  container.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${escapeHtml(message)}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    if (container) {
      container.innerHTML = '';
    }
  }, 5000);
}

// Show alert
function showAlert(message, type = 'info') {
  const container = document.getElementById('alertContainer');
  if (!container) return;

  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
  alertDiv.setAttribute('role', 'alert');
  alertDiv.innerHTML = `
    ${escapeHtml(message)}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;

  container.innerHTML = '';
  container.appendChild(alertDiv);

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.remove();
    }
  }, 5000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

