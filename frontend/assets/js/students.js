let students = [];
let programmes = [];
let courses = [];
let users = [];
let programmeMap = {};
let userMap = {};
let courseMap = {};
let grades = [];
let studentGradesMap = {};
let currentDeleteId = null;
let currentAdminProfileId = null;
let myDepartmentIds = [];
let myProgrammeIds = [];
let currentStudentIdForGrades = null;

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
        <td colspan="5" class="text-center text-muted">No students found. Students are created through the registration system.</td>
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

    return `
      <tr data-clickable="true" data-student-id="${studentId}">
        <td><strong>${escapeHtml(userInfo.name)}</strong></td>
        <td>${escapeHtml(userInfo.email)}</td>
        <td><span class="badge bg-primary">Year ${year}</span></td>
        <td>${progInfo ? escapeHtml(progInfo.name) : '<span class="text-muted">No programme</span>'}</td>
        <td class="text-end" onclick="event.stopPropagation()">
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
  
  setupRowClickHandlers();
}

function setupRowClickHandlers() {
  const tbody = document.getElementById('studentsTableBody');
  if (!tbody) return;
  
  const rows = tbody.querySelectorAll('tr[data-clickable="true"]');
  rows.forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('button')) {
        return;
      }
      const studentId = row.getAttribute('data-student-id');
      if (studentId) {
        openStudentDetailView(studentId);
      }
    });
  });
}

async function openStudentDetailView(studentId) {
  const student = students.find(s => (s.id || s.Id) === studentId);
  if (!student) {
    showAlert('Student not found.', 'danger');
    return;
  }

  const userInfo = getUserInfoFromStudent(student);
  const progInfo = getProgrammeInfoFromStudent(student);
  const year = student.year || student.Year;
  const averageGrade = student.averageGrade || student.AverageGrade;

  let studentGrades = [];
  let gradeDetails = [];
  try {
    studentGrades = await api.get(`/Grades/student/${studentId}`);
    
    for (const grade of studentGrades) {
      const courseId = grade.courseId || grade.CourseId;
      const courseInfo = courseMap[courseId] || {
        name: 'Unknown Course',
        description: '',
        creditWeight: 0
      };
      gradeDetails.push({
        courseName: courseInfo.name,
        score: grade.score || grade.Score
      });
    }
  } catch (error) {
    console.error('Error loading student grades:', error);
  }

  const formatDate = (date) => {
    if (!date) return 'N/A';
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString();
    }
    return date.toLocaleDateString();
  };

  const sections = [
    {
      title: 'Student Information',
      items: [
        { label: 'Name', value: userInfo.name },
        { label: 'Email', value: userInfo.email || 'No email' },
        { label: 'Year', value: `Year ${year}` },
        { label: 'Average Grade', value: averageGrade !== null && averageGrade !== undefined 
          ? `${averageGrade.toFixed(2)}%` 
          : 'Not calculated' }
      ]
    }
  ];

  if (progInfo) {
    sections.push({
      title: 'Programme Enrolled',
      items: [
        { label: 'Programme Name', value: progInfo.name },
        { label: 'Session Start', value: formatDate(progInfo.sessionStart) },
        { label: 'Session End', value: formatDate(progInfo.sessionEnd) }
      ]
    });
  }

  const config = {
    title: `Student: ${userInfo.name}`,
    sections: sections,
    subItems: [
      {
        title: 'Grades',
        columns: ['Course', 'Score'],
        items: gradeDetails.map(grade => {
          const score = grade.score !== null && grade.score !== undefined
            ? `<span class="badge ${grade.score >= 70 ? 'bg-success' : grade.score >= 50 ? 'bg-warning' : 'bg-danger'}">${grade.score.toFixed(2)}%</span>`
            : '<span class="text-muted">Not graded</span>';
          return {
            Course: `<strong>${escapeHtml(grade.courseName)}</strong>`,
            Score: score
          };
        })
      }
    ]
  };

  detailView.show(config);
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
  document.getElementById('gradesModalLabel').textContent = `View Grades · ${studentName}`;
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
        <td colspan="2" class="text-center text-muted">No grades found for this student.</td>
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
      </tr>
    `;
  }).join('');
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

