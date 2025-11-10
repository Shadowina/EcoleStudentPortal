let programmes = [];
let departments = [];
let departmentMap = {}; // Map DepartmentId to Department info
let courses = [];
let programmeCourses = [];
let programmeCourseMap = {}; // Map ProgrammeId to Set of CourseIds
let currentDeleteId = null;
let currentAdminProfileId = null; // Current logged-in admin's profile ID
let myDepartmentIds = []; // IDs of departments owned by current admin
let currentProgrammeIdForCourses = null;
let originalAssignedCourseIds = new Set();
let programmeCoursesModalInstance = null;
let programmeCoursesSaveBtn = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Check if we're on the programmes page
  if (!document.getElementById('programmesTableBody')) {
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

  // Load departments first (needed for dropdown and filtering)
  await loadDepartments();
  
  // Check if admin has any departments
  if (myDepartmentIds.length === 0) {
    document.getElementById('programmesTableBody').innerHTML = `
      <tr>
        <td colspan="6" class="text-center">
          <div class="alert alert-warning mb-0">
            <strong>No Departments Found</strong><br>
            You need to create a department before you can create programmes.
            <br><br>
            <a href="departments.html?action=create" class="btn btn-primary btn-sm">Create Department</a>
          </div>
        </td>
      </tr>
    `;
    document.getElementById('createProgrammeBtn').disabled = true;
    document.getElementById('createProgrammeBtn').innerHTML = '<i class="bi bi-exclamation-triangle me-2"></i>Create Department First';
    return;
  }

  await loadCourses();
  await loadProgrammeCourses();

  await loadProgrammes();

  setupFormHandler();
  setupProgrammeCoursesModal();

  // Check URL for action parameter (for quick action from dashboard)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'create') {
    openCreateModal();
  }
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
  const select = document.getElementById('departmentId');
  if (!select) return;

  select.innerHTML = '<option value="">Select Department...</option>';
  
  departments.forEach(dept => {
    const deptId = dept.id || dept.Id;
    const deptName = dept.departmentName || dept.DepartmentName;
    const option = document.createElement('option');
    option.value = deptId;
    option.textContent = deptName;
    select.appendChild(option);
  });
}

// Load courses from API
async function loadCourses() {
  try {
    courses = await api.get('/Courses');
    if (programmeCoursesSaveBtn) {
      programmeCoursesSaveBtn.disabled = courses.length === 0;
    }
  } catch (error) {
    console.error('Error loading courses:', error);
    courses = [];
    showAlert('Error loading courses. Course assignment may be unavailable.', 'danger');
    if (programmeCoursesSaveBtn) {
      programmeCoursesSaveBtn.disabled = true;
    }
  }
}

// Load programme-course assignments from API
async function loadProgrammeCourses() {
  try {
    programmeCourses = await api.get('/ProgrammeCourses');
    buildProgrammeCourseMap();
  } catch (error) {
    console.error('Error loading programme courses:', error);
    programmeCourses = [];
    programmeCourseMap = {};
  }
}

// Build map of programme to assigned courses
function buildProgrammeCourseMap() {
  programmeCourseMap = {};
  programmeCourses.forEach(pc => {
    const programmeId = String(pc.programmeId || pc.ProgrammeId);
    const courseId = String(pc.courseId || pc.CourseId);
    if (!programmeCourseMap[programmeId]) {
      programmeCourseMap[programmeId] = new Set();
    }
    programmeCourseMap[programmeId].add(courseId);
  });
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
    renderProgrammesTable();
  } catch (error) {
    console.error('Error loading programmes:', error);
    showAlert('Error loading programmes. Please refresh the page.', 'danger');
    document.getElementById('programmesTableBody').innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-danger">Error loading programmes. Please refresh the page.</td>
      </tr>
    `;
  }
}

// Render programmes table
function renderProgrammesTable() {
  const tbody = document.getElementById('programmesTableBody');
  if (!tbody) return;

  if (programmes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted">No programmes found. Click "Create Programme" to add one.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = programmes.map(prog => {
    // Try both camelCase and PascalCase for property names
    const progId = prog.id || prog.Id;
    const programmeKey = String(progId);
    const progName = prog.programmeName || prog.ProgrammeName;
    const sessionStart = prog.sessionStart || prog.SessionStart;
    const sessionEnd = prog.sessionEnd || prog.SessionEnd;
    const deptId = prog.departmentId || prog.DepartmentId;
    
    const deptInfo = departmentMap[deptId] || {
      name: 'Unknown Department',
      description: ''
    };

    // Format dates (assuming they come as strings in YYYY-MM-DD format or DateOnly)
    const startDate = formatDate(sessionStart);
    const endDate = formatDate(sessionEnd);

    const courseSet = programmeCourseMap[programmeKey] || new Set();
    const courseCount = courseSet.size;
    const courseLabel = courseCount === 1 ? 'course' : 'courses';
    const courseBadge = courseCount > 0
      ? `<span class="badge bg-info">${courseCount} ${courseLabel}</span>`
      : '<span class="badge bg-secondary">0 courses</span>';

    const manageDisabled = courses.length === 0 ? 'disabled' : '';
    const manageTitle = courses.length === 0
      ? 'title="Create courses first to assign them to programmes."'
      : '';

    return `
      <tr>
        <td><strong>${escapeHtml(progName)}</strong></td>
        <td>${escapeHtml(startDate)}</td>
        <td>${escapeHtml(endDate)}</td>
        <td>${escapeHtml(deptInfo.name)}</td>
        <td>${courseBadge}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-secondary me-2" ${manageDisabled} ${manageTitle} onclick="openManageCoursesModal('${progId}')">
            <i class="bi bi-link"></i> Courses
          </button>
          <button class="btn btn-sm btn-outline-primary me-2" onclick="openEditModal('${progId}')">
            <i class="bi bi-pencil"></i> Edit
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="openDeleteModal('${progId}')">
            <i class="bi bi-trash"></i> Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Format date from API response (handles DateOnly and string formats)
function formatDate(dateValue) {
  if (!dateValue) return 'N/A';
  
  // If it's already a formatted string, return it
  if (typeof dateValue === 'string') {
    // Try to parse and format
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return dateValue;
  }
  
  // If it's a Date object
  if (dateValue instanceof Date) {
    return dateValue.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  
  return String(dateValue);
}

// Convert date to YYYY-MM-DD format for API
function formatDateForAPI(dateValue) {
  if (!dateValue) return '';
  
  // If it's already in YYYY-MM-DD format
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }
  
  // If it's a Date object
  if (dateValue instanceof Date) {
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, '0');
    const day = String(dateValue.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Try to parse as date string
  const date = new Date(dateValue);
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return '';
}

// Open create modal
function openCreateModal() {
  if (myDepartmentIds.length === 0) {
    showAlert('You need to create a department before you can create programmes.', 'warning');
    window.location.href = 'departments.html?action=create';
    return;
  }

  const modal = new bootstrap.Modal(document.getElementById('programmeModal'));
  document.getElementById('programmeModalLabel').textContent = 'Create Programme';
  document.getElementById('programmeSubmitBtn').textContent = 'Create';
  document.getElementById('programmeForm').reset();
  document.getElementById('programmeId').value = '';
  document.getElementById('programmeForm').classList.remove('was-validated');
  modal.show();
}

// Open edit modal
function openEditModal(programmeId) {
  const programme = programmes.find(p => (p.id || p.Id) === programmeId);
  if (!programme) {
    showAlert('Programme not found.', 'danger');
    return;
  }

  // Check if programme belongs to admin's department
  const deptId = programme.departmentId || programme.DepartmentId;
  if (!myDepartmentIds.includes(deptId)) {
    showAlert('You can only edit programmes from your departments.', 'warning');
    return;
  }

  const modal = new bootstrap.Modal(document.getElementById('programmeModal'));
  document.getElementById('programmeModalLabel').textContent = 'Edit Programme';
  document.getElementById('programmeSubmitBtn').textContent = 'Update';
  document.getElementById('programmeId').value = programme.id || programme.Id;
  document.getElementById('programmeName').value = programme.programmeName || programme.ProgrammeName;
  
  // Handle dates - convert to YYYY-MM-DD format for date input
  const sessionStart = programme.sessionStart || programme.SessionStart;
  const sessionEnd = programme.sessionEnd || programme.SessionEnd;
  document.getElementById('sessionStart').value = formatDateForAPI(sessionStart);
  document.getElementById('sessionEnd').value = formatDateForAPI(sessionEnd);
  
  document.getElementById('departmentId').value = deptId;
  document.getElementById('programmeForm').classList.remove('was-validated');
  modal.show();
}

// Setup form handler
function setupFormHandler() {
  const form = document.getElementById('programmeForm');
  if (!form) return;

  // Add date validation
  const sessionStartInput = document.getElementById('sessionStart');
  const sessionEndInput = document.getElementById('sessionEnd');
  
  if (sessionStartInput && sessionEndInput) {
    sessionStartInput.addEventListener('change', validateDates);
    sessionEndInput.addEventListener('change', validateDates);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Validate dates
    if (!validateDates()) {
      form.classList.add('was-validated');
      return;
    }

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const programmeId = document.getElementById('programmeId').value;
    const programmeName = document.getElementById('programmeName').value.trim();
    const sessionStart = document.getElementById('sessionStart').value;
    const sessionEnd = document.getElementById('sessionEnd').value;
    const departmentId = document.getElementById('departmentId').value;

    // Validate department belongs to admin
    if (!myDepartmentIds.includes(departmentId)) {
      showAlert('You can only create programmes for your departments.', 'warning');
      return;
    }

    const programmeData = {
      programmeName: programmeName,
      sessionStart: sessionStart, // Send as YYYY-MM-DD string
      sessionEnd: sessionEnd, // Send as YYYY-MM-DD string
      departmentId: departmentId
    };
    // Note: ID is not sent in body - for PUT requests, ID is in URL path
    // For POST requests, backend generates the ID

    const submitBtn = document.getElementById('programmeSubmitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

    try {
      if (programmeId) {
        // Update existing programme
        await api.put(`/Programmes/${programmeId}`, programmeData);
        showAlert('Programme updated successfully!', 'success');
      } else {
        // Create new programme
        await api.post('/Programmes', programmeData);
        showAlert('Programme created successfully!', 'success');
      }

      // Close modal and reload programmes
      const modal = bootstrap.Modal.getInstance(document.getElementById('programmeModal'));
      modal.hide();
      await loadProgrammes();
    } catch (error) {
      console.error('Error saving programme:', error);
      showAlert(error.message || 'Error saving programme. Please try again.', 'danger');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

// Validate that session end is after session start
function validateDates() {
  const sessionStartInput = document.getElementById('sessionStart');
  const sessionEndInput = document.getElementById('sessionEnd');
  
  if (!sessionStartInput || !sessionEndInput) return true;
  
  const startDate = new Date(sessionStartInput.value);
  const endDate = new Date(sessionEndInput.value);
  
  if (sessionStartInput.value && sessionEndInput.value && endDate <= startDate) {
    sessionEndInput.setCustomValidity('Session end date must be after session start date.');
    sessionEndInput.classList.add('is-invalid');
    return false;
  } else {
    sessionEndInput.setCustomValidity('');
    sessionEndInput.classList.remove('is-invalid');
    return true;
  }
}

// Setup manage courses modal
function setupProgrammeCoursesModal() {
  programmeCoursesSaveBtn = document.getElementById('programmeCoursesSaveBtn');
  if (programmeCoursesSaveBtn) {
    programmeCoursesSaveBtn.addEventListener('click', handleProgrammeCoursesSave);
    programmeCoursesSaveBtn.disabled = courses.length === 0;
  }

  const searchInput = document.getElementById('programmeCoursesSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      applyProgrammeCoursesSearch(event.target.value);
    });
  }

  const list = document.getElementById('programmeCoursesList');
  if (list) {
    list.addEventListener('change', (event) => {
      if (event.target.classList.contains('programme-course-checkbox')) {
        updateProgrammeCoursesCount();
        showProgrammeCoursesAlert('', '');
      }
    });
  }
}

// Open manage courses modal
async function openManageCoursesModal(programmeId) {
  if (courses.length === 0) {
    showAlert('Create courses before assigning them to programmes.', 'warning');
    window.location.href = 'courses.html?action=create';
    return;
  }

  await loadProgrammeCourses();

  const programmeKey = String(programmeId);
  currentProgrammeIdForCourses = programmeKey;

  const programme = programmes.find(p => String(p.id || p.Id) === programmeKey);
  if (!programme) {
    showAlert('Programme not found.', 'danger');
    return;
  }

  const programmeName = programme.programmeName || programme.ProgrammeName || 'Programme';
  document.getElementById('programmeCoursesModalLabel').textContent = `Manage Courses · ${programmeName}`;
  const programmeNameElement = document.getElementById('programmeCoursesProgrammeName');
  if (programmeNameElement) {
    programmeNameElement.textContent = programmeName;
  }

  const assignedSet = new Set(programmeCourseMap[programmeKey] ? Array.from(programmeCourseMap[programmeKey]) : []);
  originalAssignedCourseIds = new Set(assignedSet);

  const searchInput = document.getElementById('programmeCoursesSearch');
  if (searchInput) {
    searchInput.value = '';
  }

  renderProgrammeCoursesList(assignedSet);
  applyProgrammeCoursesSearch('');
  updateProgrammeCoursesCount();
  showProgrammeCoursesAlert('', '');

  if (!programmeCoursesSaveBtn) {
    programmeCoursesSaveBtn = document.getElementById('programmeCoursesSaveBtn');
  }
  if (programmeCoursesSaveBtn) {
    programmeCoursesSaveBtn.disabled = courses.length === 0;
  }

  const modalElement = document.getElementById('programmeCoursesModal');
  programmeCoursesModalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
  programmeCoursesModalInstance.show();
}

// Render list of courses with checkboxes
function renderProgrammeCoursesList(selectedCourseIds = new Set()) {
  const list = document.getElementById('programmeCoursesList');
  if (!list) return;

  if (!courses || courses.length === 0) {
    list.innerHTML = `
      <div class="alert alert-warning mb-0">
        No courses available. <a href="courses.html?action=create" class="alert-link">Create a course</a> first.
      </div>
    `;
    if (programmeCoursesSaveBtn) {
      programmeCoursesSaveBtn.disabled = true;
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
      <div class="list-group-item programme-course-item d-flex align-items-start" data-course-name="${courseNameLower}">
        <div class="form-check w-100">
          <input class="form-check-input programme-course-checkbox" type="checkbox" value="${courseIdStr}" id="programme-course-${courseIdStr}" ${isChecked ? 'checked' : ''}>
          <label class="form-check-label w-100" for="programme-course-${courseIdStr}">
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
function updateProgrammeCoursesCount() {
  const countElement = document.getElementById('programmeCoursesCount');
  if (!countElement) return;

  const selected = document.querySelectorAll('#programmeCoursesList .programme-course-checkbox:checked').length;
  countElement.textContent = `${selected} selected of ${courses.length}`;
}

// Apply search filter to course list
function applyProgrammeCoursesSearch(term) {
  const normalized = (term || '').trim().toLowerCase();
  const items = document.querySelectorAll('#programmeCoursesList .programme-course-item');
  items.forEach(item => {
    const name = item.getAttribute('data-course-name') || '';
    if (!normalized || name.includes(normalized)) {
      item.classList.remove('d-none');
    } else {
      item.classList.add('d-none');
    }
  });
}

// Save programme course assignments
async function handleProgrammeCoursesSave() {
  if (!currentProgrammeIdForCourses || !programmeCoursesSaveBtn) {
    return;
  }

  const checkboxes = document.querySelectorAll('#programmeCoursesList .programme-course-checkbox');
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
    showProgrammeCoursesAlert('No changes to save.', 'info');
    return;
  }

  const originalText = programmeCoursesSaveBtn.innerHTML;
  programmeCoursesSaveBtn.disabled = true;
  programmeCoursesSaveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

  try {
    for (const courseId of toAdd) {
      await api.post('/ProgrammeCourses', {
        programmeId: currentProgrammeIdForCourses,
        courseId: courseId
      });
    }

    for (const courseId of toRemove) {
      await api.delete(`/ProgrammeCourses/${currentProgrammeIdForCourses}/${courseId}`);
    }

    if (programmeCoursesModalInstance) {
      programmeCoursesModalInstance.hide();
    } else {
      const modalElement = document.getElementById('programmeCoursesModal');
      bootstrap.Modal.getInstance(modalElement)?.hide();
    }

    await loadProgrammeCourses();
    renderProgrammesTable();
    showAlert('Programme courses updated successfully!', 'success');
  } catch (error) {
    console.error('Error updating programme courses:', error);
    showProgrammeCoursesAlert(error.message || 'Error updating programme courses. Please try again.', 'danger');
  } finally {
    programmeCoursesSaveBtn.disabled = false;
    programmeCoursesSaveBtn.innerHTML = originalText;
  }
}

// Show alert inside manage courses modal
function showProgrammeCoursesAlert(message, type = 'info') {
  const container = document.getElementById('programmeCoursesAlert');
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

// Open delete modal
function openDeleteModal(programmeId) {
  currentDeleteId = programmeId;
  const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
  modal.show();
}

// Setup delete confirmation handler
document.addEventListener('DOMContentLoaded', () => {
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
      if (!currentDeleteId) return;

      const btn = confirmDeleteBtn;
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Deleting...';

      try {
        // Check if programme belongs to admin's department
        const programme = programmes.find(p => (p.id || p.Id) === currentDeleteId);
        if (programme) {
          const deptId = programme.departmentId || programme.DepartmentId;
          if (!myDepartmentIds.includes(deptId)) {
            showAlert('You can only delete programmes from your departments.', 'warning');
            btn.disabled = false;
            btn.textContent = originalText;
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
            modal.hide();
            return;
          }
        }

        // First, check if programme has students
        const students = await api.get('/Students').catch(() => []);
        const programmeStudents = students.filter(s => 
          (s.programmeId || s.ProgrammeId) === currentDeleteId
        );

        if (programmeStudents.length > 0) {
          showAlert(`Cannot delete programme. It has ${programmeStudents.length} student(s) enrolled. Please remove students first.`, 'danger');
          btn.disabled = false;
          btn.textContent = originalText;
          const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
          modal.hide();
          return;
        }

        // Delete programme
        await api.delete(`/Programmes/${currentDeleteId}`);
        showAlert('Programme deleted successfully!', 'success');

        // Close modal and reload programmes
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
        modal.hide();
        await loadProgrammes();
      } catch (error) {
        console.error('Error deleting programme:', error);
        showAlert(error.message || 'Error deleting programme. Please try again.', 'danger');
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
        currentDeleteId = null;
      }
    });
  }
});

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
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

