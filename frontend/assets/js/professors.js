let professors = [];
let departments = [];
let users = [];
let departmentMap = {}; // Map DepartmentId to Department info
let userMap = {}; // Map UserId to User info
let professorCourseMap = {}; // Map ProfessorId to Set of CourseIds
let courses = [];
let currentDeleteId = null;
let currentAdminProfileId = null; // Current logged-in admin's profile ID
let myDepartmentIds = []; // IDs of departments owned by current admin
let currentProfessorIdForCourses = null; // Current professor ID for course assignment modal
let originalAssignedCourseIds = new Set(); // Original course assignments before changes
let professorCoursesSaveBtn = null; // Save button reference
let professorCoursesModalInstance = null; // Modal instance reference

document.addEventListener('DOMContentLoaded', async () => {
  // Check if we're on the professors page
  if (!document.getElementById('professorsTableBody')) {
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
  
  await loadUsers();
  
  await loadCourses();
  
  await loadProfessorCourses();

  await loadProfessors();

  setupFormHandler();

  setupDeleteHandler();

  setupProfessorCoursesModal();
});

// Load departments from API (only those owned by current admin)
async function loadDepartments() {
  try {
    const allDepartments = await api.get('/Departments');
    // Filter to only show departments owned by current admin
    departments = allDepartments.filter(dept => {
      const deptAdminId = dept.departmentAdminId || dept.DepartmentAdminId;
      return deptAdminId === currentAdminProfileId;
    });
    
    myDepartmentIds = departments.map(dept => dept.id || dept.Id);
    buildDepartmentMap();
    populateDepartmentDropdown();
  } catch (error) {
    console.error('Error loading departments:', error);
    showAlert('Error loading departments. Please refresh the page.', 'danger');
  }
}

// Build map of DepartmentId to Department info
function buildDepartmentMap() {
  departmentMap = {};
  departments.forEach(dept => {
    const deptId = dept.id || dept.Id;
    const deptName = dept.departmentName || dept.DepartmentName;
    departmentMap[deptId] = {
      name: deptName,
      description: dept.description || dept.Description || ''
    };
  });
}

// Populate department dropdown
function populateDepartmentDropdown() {
  const select = document.getElementById('professorDepartmentId');
  if (!select) return;

  select.innerHTML = '<option value="">No Department</option>';
  
  departments.forEach(dept => {
    const deptId = dept.id || dept.Id;
    const deptName = dept.departmentName || dept.DepartmentName;
    const option = document.createElement('option');
    option.value = deptId;
    option.textContent = deptName;
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

// Load courses from API
async function loadCourses() {
  try {
    courses = await api.get('/Courses');
  } catch (error) {
    console.error('Error loading courses:', error);
  }
}

// Load professor courses from API
async function loadProfessorCourses() {
  try {
    const professorCourses = await api.get('/ProfessorCourses');
    professorCourseMap = {};
    
    professorCourses.forEach(pc => {
      const profId = String(pc.professorId || pc.ProfessorId);
      const courseId = String(pc.courseId || pc.CourseId);
      
      if (!professorCourseMap[profId]) {
        professorCourseMap[profId] = new Set();
      }
      professorCourseMap[profId].add(courseId);
    });
  } catch (error) {
    console.error('Error loading professor courses:', error);
  }
}

// Load professors from API
async function loadProfessors() {
  try {
    professors = await api.get('/Professors');
    renderProfessorsTable();
  } catch (error) {
    console.error('Error loading professors:', error);
    showAlert('Error loading professors. Please refresh the page.', 'danger');
    document.getElementById('professorsTableBody').innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-danger">Error loading professors. Please refresh the page.</td>
      </tr>
    `;
  }
}

// Get user info from professor (handles both navigation property and userMap fallback)
function getUserInfoFromProfessor(professor) {
  // Try to get User from navigation property first
  const user = professor.user || professor.User;
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
  const userId = professor.userId || professor.UserId;
  return userMap[userId] || {
    name: 'Unknown User',
    email: 'No email'
  };
}

// Get department info from professor (handles both navigation property and departmentMap fallback)
function getDepartmentInfoFromProfessor(professor) {
  // Try to get Department from navigation property first
  const department = professor.department || professor.Department;
  if (department) {
    const deptName = department.departmentName || department.DepartmentName || 'Unknown Department';
    return {
      name: deptName,
      description: department.description || department.Description || ''
    };
  }
  
  // Fallback to departmentMap if navigation property not available
  const deptId = professor.departmentId || professor.DepartmentId;
  if (deptId) {
    return departmentMap[deptId] || {
      name: 'Unknown Department',
      description: ''
    };
  }
  
  return null;
}

// Render professors table
function renderProfessorsTable() {
  const tbody = document.getElementById('professorsTableBody');
  if (!tbody) return;

  if (professors.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted">No professors found. Professors are created through the registration system.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = professors.map(prof => {
    // Try both camelCase and PascalCase for property names
    const profId = prof.id || prof.Id;
    const specialization = prof.specialization || prof.Specialization;
    
    const userInfo = getUserInfoFromProfessor(prof);
    const deptInfo = getDepartmentInfoFromProfessor(prof);

    // Get course count
    const profKey = String(profId);
    const courseSet = professorCourseMap[profKey] || new Set();
    const courseCount = courseSet.size;
    const courseLabel = courseCount === 1 ? 'course' : 'courses';
    const courseBadge = courseCount > 0
      ? `<span class="badge bg-info">${courseCount} ${courseLabel}</span>`
      : '<span class="badge bg-secondary">0 courses</span>';

    const manageDisabled = courses.length === 0 ? 'disabled' : '';
    const manageTitle = courses.length === 0
      ? 'title="Create courses first to assign them to professors."'
      : '';

    return `
      <tr>
        <td><strong>${escapeHtml(userInfo.name)}</strong></td>
        <td>${escapeHtml(userInfo.email)}</td>
        <td>${specialization ? escapeHtml(specialization) : '<span class="text-muted">No specialization</span>'}</td>
        <td>${deptInfo ? escapeHtml(deptInfo.name) : '<span class="text-muted">No department</span>'}</td>
        <td>${courseBadge}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-secondary me-2" ${manageDisabled} ${manageTitle} onclick="openManageCoursesModal('${profId}')">
            <i class="bi bi-link"></i> Courses
          </button>
          <button class="btn btn-sm btn-outline-primary me-2" onclick="openEditModal('${profId}')">
            <i class="bi bi-pencil"></i> Edit
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="openDeleteModal('${profId}')">
            <i class="bi bi-trash"></i> Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Open edit modal
function openEditModal(professorId) {
  const professor = professors.find(p => (p.id || p.Id) === professorId);
  if (!professor) {
    showAlert('Professor not found.', 'danger');
    return;
  }

  const userId = professor.userId || professor.UserId;
  const userInfo = getUserInfoFromProfessor(professor);

  const modal = new bootstrap.Modal(document.getElementById('professorModal'));
  document.getElementById('professorId').value = professor.id || professor.Id;
  document.getElementById('professorUserId').value = userId;
  document.getElementById('professorName').value = userInfo.name;
  document.getElementById('professorEmail').value = userInfo.email;
  document.getElementById('professorSpecialization').value = professor.specialization || professor.Specialization || '';
  
  const deptId = professor.departmentId || professor.DepartmentId;
  document.getElementById('professorDepartmentId').value = deptId || '';
  
  document.getElementById('professorForm').classList.remove('was-validated');
  modal.show();
}

// Setup form handler
function setupFormHandler() {
  const form = document.getElementById('professorForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const professorId = document.getElementById('professorId').value;
    const userId = document.getElementById('professorUserId').value;
    const specialization = document.getElementById('professorSpecialization').value.trim();
    const departmentId = document.getElementById('professorDepartmentId').value;

    // Validate department belongs to admin (if provided)
    if (departmentId && !myDepartmentIds.includes(departmentId)) {
      showAlert('You can only assign professors to your departments.', 'warning');
      return;
    }

    const professorData = {
      userId: userId,
      specialization: specialization || null,
      departmentId: departmentId || null
    };

    const submitBtn = document.getElementById('professorSubmitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';

    try {
      // Update existing professor
      await api.put(`/Professors/${professorId}`, professorData);
      showAlert('Professor updated successfully!', 'success');

      // Close modal and reload professors
      const modal = bootstrap.Modal.getInstance(document.getElementById('professorModal'));
      modal.hide();
      await loadProfessors();
    } catch (error) {
      console.error('Error updating professor:', error);
      showAlert(error.message || 'Error updating professor. Please try again.', 'danger');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

// Open delete modal
function openDeleteModal(professorId) {
  currentDeleteId = professorId;
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
        // Delete professor (backend will check for course assignments)
        await api.delete(`/Professors/${currentDeleteId}`);
        showAlert('Professor deleted successfully!', 'success');

        // Close modal and reload professors
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
        modal.hide();
        await loadProfessors();
        await loadProfessorCourses(); // Reload course assignments
      } catch (error) {
        console.error('Error deleting professor:', error);
        // Backend returns detailed error messages about why deletion failed
        const errorMessage = error.message || 'Error deleting professor. Please try again.';
        showAlert(errorMessage, 'danger');
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
        currentDeleteId = null;
      }
    });
  }
}

// Setup manage courses modal
function setupProfessorCoursesModal() {
  professorCoursesSaveBtn = document.getElementById('professorCoursesSaveBtn');
  if (professorCoursesSaveBtn) {
    professorCoursesSaveBtn.addEventListener('click', handleProfessorCoursesSave);
    professorCoursesSaveBtn.disabled = courses.length === 0;
  }

  const searchInput = document.getElementById('professorCoursesSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      applyProfessorCoursesSearch(event.target.value);
    });
  }

  const list = document.getElementById('professorCoursesList');
  if (list) {
    list.addEventListener('change', (event) => {
      if (event.target.classList.contains('professor-course-checkbox')) {
        updateProfessorCoursesCount();
        showProfessorCoursesAlert('', '');
      }
    });
  }
}

// Open manage courses modal
async function openManageCoursesModal(professorId) {
  if (courses.length === 0) {
    showAlert('Create courses before assigning them to professors.', 'warning');
    window.location.href = 'courses.html?action=create';
    return;
  }

  await loadProfessorCourses();

  const professorKey = String(professorId);
  currentProfessorIdForCourses = professorKey;

  const professor = professors.find(p => String(p.id || p.Id) === professorKey);
  if (!professor) {
    showAlert('Professor not found.', 'danger');
    return;
  }

  const userInfo = getUserInfoFromProfessor(professor);
  const professorName = userInfo.name || 'Professor';
  document.getElementById('professorCoursesModalLabel').textContent = `Manage Courses · ${professorName}`;
  const professorNameElement = document.getElementById('professorCoursesProfessorName');
  if (professorNameElement) {
    professorNameElement.textContent = professorName;
  }

  const assignedSet = new Set(professorCourseMap[professorKey] ? Array.from(professorCourseMap[professorKey]) : []);
  originalAssignedCourseIds = new Set(assignedSet);

  const searchInput = document.getElementById('professorCoursesSearch');
  if (searchInput) {
    searchInput.value = '';
  }

  renderProfessorCoursesList(assignedSet);
  applyProfessorCoursesSearch('');
  updateProfessorCoursesCount();
  showProfessorCoursesAlert('', '');

  if (!professorCoursesSaveBtn) {
    professorCoursesSaveBtn = document.getElementById('professorCoursesSaveBtn');
  }
  if (professorCoursesSaveBtn) {
    professorCoursesSaveBtn.disabled = courses.length === 0;
  }

  const modalElement = document.getElementById('professorCoursesModal');
  professorCoursesModalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
  professorCoursesModalInstance.show();
}

// Render list of courses with checkboxes
function renderProfessorCoursesList(selectedCourseIds = new Set()) {
  const list = document.getElementById('professorCoursesList');
  if (!list) return;

  if (!courses || courses.length === 0) {
    list.innerHTML = `
      <div class="alert alert-warning mb-0">
        No courses available. <a href="courses.html?action=create" class="alert-link">Create a course</a> first.
      </div>
    `;
    if (professorCoursesSaveBtn) {
      professorCoursesSaveBtn.disabled = true;
    }
    return;
  }

  list.innerHTML = courses.map(course => {
    const courseId = course.id || course.Id;
    const courseIdStr = String(courseId);
    const courseName = course.courseName || course.CourseName || 'Unnamed Course';
    const description = course.description || course.Description || '';
    const creditWeight = course.creditWeight || course.CreditWeight || 0;
    const isChecked = selectedCourseIds.has(courseIdStr);
    const courseNameLower = escapeHtml(courseName.toLowerCase());

    return `
      <div class="list-group-item professor-course-item d-flex align-items-start" data-course-name="${courseNameLower}">
        <div class="form-check w-100">
          <input class="form-check-input professor-course-checkbox" type="checkbox" value="${courseIdStr}" id="professor-course-${courseIdStr}" ${isChecked ? 'checked' : ''}>
          <label class="form-check-label w-100" for="professor-course-${courseIdStr}">
            <div class="d-flex justify-content-between align-items-start">
              <span class="fw-semibold">${escapeHtml(courseName)}</span>
              <span class="badge bg-primary">${creditWeight} ${creditWeight === 1 ? 'credit' : 'credits'}</span>
            </div>
            ${description ? `<div class="text-muted small mt-2">${escapeHtml(description)}</div>` : ''}
          </label>
        </div>
      </div>
    `;
  }).join('');
}

// Update selected courses count badge
function updateProfessorCoursesCount() {
  const countElement = document.getElementById('professorCoursesCount');
  if (!countElement) return;

  const selected = document.querySelectorAll('#professorCoursesList .professor-course-checkbox:checked').length;
  countElement.textContent = `${selected} selected of ${courses.length}`;
}

// Apply search filter to course list
function applyProfessorCoursesSearch(term) {
  const normalized = (term || '').trim().toLowerCase();
  const items = document.querySelectorAll('#professorCoursesList .professor-course-item');
  items.forEach(item => {
    const name = item.getAttribute('data-course-name') || '';
    if (!normalized || name.includes(normalized)) {
      item.classList.remove('d-none');
    } else {
      item.classList.add('d-none');
    }
  });
}

// Save professor course assignments
async function handleProfessorCoursesSave() {
  if (!currentProfessorIdForCourses || !professorCoursesSaveBtn) {
    return;
  }

  const checkboxes = document.querySelectorAll('#professorCoursesList .professor-course-checkbox');
  const selectedIds = new Set();
  checkboxes.forEach(cb => {
    if (cb.checked) {
      selectedIds.add(cb.value);
    }
  });

  const originalIds = new Set(Array.from(originalAssignedCourseIds));

  const toAdd = [...selectedIds].filter(id => !originalIds.has(id));
  const toRemove = [...originalIds].filter(id => !selectedIds.has(id));

  if (toAdd.length === 0 && toRemove.length === 0) {
    showProfessorCoursesAlert('No changes to save.', 'info');
    return;
  }

  const originalText = professorCoursesSaveBtn.innerHTML;
  professorCoursesSaveBtn.disabled = true;
  professorCoursesSaveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

  try {
    for (const courseId of toAdd) {
      await api.post('/ProfessorCourses', {
        professorId: currentProfessorIdForCourses,
        courseId: courseId
      });
    }

    for (const courseId of toRemove) {
      await api.delete(`/ProfessorCourses/${currentProfessorIdForCourses}/${courseId}`);
    }

    if (professorCoursesModalInstance) {
      professorCoursesModalInstance.hide();
    } else {
      const modalElement = document.getElementById('professorCoursesModal');
      bootstrap.Modal.getInstance(modalElement)?.hide();
    }

    await loadProfessorCourses();
    renderProfessorsTable();
    showAlert('Professor courses updated successfully!', 'success');
  } catch (error) {
    console.error('Error updating professor courses:', error);
    showProfessorCoursesAlert(error.message || 'Error updating professor courses. Please try again.', 'danger');
  } finally {
    professorCoursesSaveBtn.disabled = false;
    professorCoursesSaveBtn.innerHTML = originalText;
  }
}

// Show alert inside manage courses modal
function showProfessorCoursesAlert(message, type = 'info') {
  const container = document.getElementById('professorCoursesAlert');
  if (!container) return;

  if (!message) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${escapeHtml(message)}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
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

