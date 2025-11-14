let schedules = [];
let courses = [];
let courseMap = {}; 
let currentDeleteId = null;
let filteredSchedules = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('schedulesTableBody')) {
    return;
  }

  await loadCourses();
  
  if (courses.length === 0) {
    document.getElementById('schedulesTableBody').innerHTML = `
      <tr>
        <td colspan="6" class="text-center">
          <div class="alert alert-warning mb-0">
            <strong>No Courses Found</strong><br>
            You need to create a course before you can create schedules.
            <br><br>
            <a href="courses.html?action=create" class="btn btn-primary btn-sm">Create Course</a>
          </div>
        </td>
      </tr>
    `;
    document.getElementById('createScheduleBtn').disabled = true;
    document.getElementById('createScheduleBtn').innerHTML = '<i class="bi bi-exclamation-triangle me-2"></i>Create Course First';
    return;
  }

  await loadSchedules();

  setupFormHandler();

  setupDeleteHandler();

  setupFilters();

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'create') {
    openCreateModal();
  }
});

async function loadCourses() {
  try {
    courses = await api.get('/Courses');
    buildCourseMap();
    populateCourseDropdowns();
  } catch (error) {
    console.error('Error loading courses:', error);
    showAlert('Error loading courses. Please refresh the page.', 'danger');
  }
}

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

function populateCourseDropdowns() {
  const scheduleSelect = document.getElementById('scheduleCourseId');
  if (scheduleSelect) {
    scheduleSelect.innerHTML = '<option value="">Select Course...</option>';
    courses.forEach(course => {
      const courseId = course.id || course.Id;
      const courseName = course.courseName || course.CourseName;
      const option = document.createElement('option');
      option.value = courseId;
      option.textContent = courseName;
      scheduleSelect.appendChild(option);
    });
  }

  const filterSelect = document.getElementById('filterCourse');
  if (filterSelect) {
    filterSelect.innerHTML = '<option value="">All Courses</option>';
    courses.forEach(course => {
      const courseId = course.id || course.Id;
      const courseName = course.courseName || course.CourseName;
      const option = document.createElement('option');
      option.value = courseId;
      option.textContent = courseName;
      filterSelect.appendChild(option);
    });
  }
}

async function loadSchedules() {
  try {
    schedules = await api.get('/CourseSchedules');
    filteredSchedules = [...schedules];
    renderSchedulesTable();
  } catch (error) {
    console.error('Error loading schedules:', error);
    showAlert('Error loading schedules. Please refresh the page.', 'danger');
    document.getElementById('schedulesTableBody').innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-danger">Error loading schedules. Please refresh the page.</td>
      </tr>
    `;
  }
}

function renderSchedulesTable() {
  const tbody = document.getElementById('schedulesTableBody');
  if (!tbody) return;

  if (filteredSchedules.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted">No schedules found. Click "Create Schedule" to add one.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filteredSchedules.map(schedule => {
    const scheduleId = schedule.id || schedule.Id;
    const location = schedule.location || schedule.Location;
    const date = schedule.date || schedule.Date;
    const startTime = schedule.startTime || schedule.StartTime;
    const endTime = schedule.endTime || schedule.EndTime;
    const courseId = schedule.courseId || schedule.CourseId;
    
    const course = schedule.course || schedule.Course;
    const courseName = course ? (course.courseName || course.CourseName) : (courseMap[courseId]?.name || 'Unknown Course');

    const formattedDate = formatDate(date);
    
    const formattedStartTime = formatTime(startTime);
    const formattedEndTime = formatTime(endTime);

    return `
      <tr>
        <td><strong>${escapeHtml(courseName)}</strong></td>
        <td>${escapeHtml(location)}</td>
        <td>${formattedDate}</td>
        <td>${formattedStartTime}</td>
        <td>${formattedEndTime}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary me-2" onclick="openEditModal('${scheduleId}')">
            <i class="bi bi-pencil"></i> Edit
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="openDeleteModal('${scheduleId}')">
            <i class="bi bi-trash"></i> Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function formatDate(dateValue) {
  if (!dateValue) return 'N/A';
  
  // If it's already a formatted string, return it
  if (typeof dateValue === 'string') {
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return dateValue;
  }
  
  if (dateValue instanceof Date) {
    return dateValue.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  
  return String(dateValue);
}

function formatTime(timeValue) {
  if (!timeValue) return 'N/A';
  
  // If it's a string in HH:mm format
  if (typeof timeValue === 'string') {
    // If it's already in HH:mm format, return it
    if (/^\d{2}:\d{2}$/.test(timeValue)) {
      return timeValue;
    }
    const parts = timeValue.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeValue;
  }
  
  return String(timeValue);
}

function formatDateForAPI(dateValue) {
  if (!dateValue) return '';
  
  // If it's already in YYYY-MM-DD format
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }
  
  if (dateValue instanceof Date) {
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, '0');
    const day = String(dateValue.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  const date = new Date(dateValue);
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return '';
}

function formatTimeForAPI(timeValue) {
  if (!timeValue) return '';
  
  // If it's already in HH:mm format
  if (typeof timeValue === 'string' && /^\d{2}:\d{2}$/.test(timeValue)) {
    return timeValue;
  }
  
  if (timeValue instanceof Date) {
    const hours = String(timeValue.getHours()).padStart(2, '0');
    const minutes = String(timeValue.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  return String(timeValue);
}

function openCreateModal() {
  if (courses.length === 0) {
    showAlert('Create courses before creating schedules.', 'warning');
    window.location.href = 'courses.html?action=create';
    return;
  }

  const modal = new bootstrap.Modal(document.getElementById('scheduleModal'));
  document.getElementById('scheduleModalLabel').textContent = 'Create Schedule';
  document.getElementById('scheduleSubmitBtn').textContent = 'Create';
  document.getElementById('scheduleForm').reset();
  document.getElementById('scheduleId').value = '';
  document.getElementById('scheduleForm').classList.remove('was-validated');
  modal.show();
}

function openEditModal(scheduleId) {
  const schedule = schedules.find(s => (s.id || s.Id) === scheduleId);
  if (!schedule) {
    showAlert('Schedule not found.', 'danger');
    return;
  }

  const modal = new bootstrap.Modal(document.getElementById('scheduleModal'));
  document.getElementById('scheduleModalLabel').textContent = 'Edit Schedule';
  document.getElementById('scheduleSubmitBtn').textContent = 'Update';
  document.getElementById('scheduleId').value = schedule.id || schedule.Id;
  document.getElementById('scheduleCourseId').value = schedule.courseId || schedule.CourseId;
  document.getElementById('scheduleLocation').value = schedule.location || schedule.Location;
  
  // Handle date - convert to YYYY-MM-DD format for date input
  const date = schedule.date || schedule.Date;
  document.getElementById('scheduleDate').value = formatDateForAPI(date);
  
  // Handle times - convert to HH:mm format for time input
  const startTime = schedule.startTime || schedule.StartTime;
  const endTime = schedule.endTime || schedule.EndTime;
  document.getElementById('scheduleStartTime').value = formatTimeForAPI(startTime);
  document.getElementById('scheduleEndTime').value = formatTimeForAPI(endTime);
  
  document.getElementById('scheduleForm').classList.remove('was-validated');
  modal.show();
}

function setupFormHandler() {
  const form = document.getElementById('scheduleForm');
  if (!form) return;

  // Add time validation
  const startTimeInput = document.getElementById('scheduleStartTime');
  const endTimeInput = document.getElementById('scheduleEndTime');
  
  if (startTimeInput && endTimeInput) {
    startTimeInput.addEventListener('change', validateTimes);
    endTimeInput.addEventListener('change', validateTimes);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!validateTimes()) {
      form.classList.add('was-validated');
      return;
    }

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const scheduleId = document.getElementById('scheduleId').value;
    const courseId = document.getElementById('scheduleCourseId').value;
    const location = document.getElementById('scheduleLocation').value.trim();
    const date = document.getElementById('scheduleDate').value;
    const startTime = document.getElementById('scheduleStartTime').value;
    const endTime = document.getElementById('scheduleEndTime').value;

    if (!courseMap[courseId]) {
      showAlert('Please select a valid course.', 'danger');
      return;
    }

    const scheduleData = {
      courseId: courseId,
      location: location,
      date: date, // Send as YYYY-MM-DD string
      startTime: startTime, // Send as HH:mm string
      endTime: endTime // Send as HH:mm string
    };

    const submitBtn = document.getElementById('scheduleSubmitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

    try {
      if (scheduleId) {
        await api.put(`/CourseSchedules/${scheduleId}`, scheduleData);
        showAlert('Schedule updated successfully!', 'success');
      } else {
        await api.post('/CourseSchedules', scheduleData);
        showAlert('Schedule created successfully!', 'success');
      }

      // Close modal and reload schedules
      const modal = bootstrap.Modal.getInstance(document.getElementById('scheduleModal'));
      modal.hide();
      await loadSchedules();
    } catch (error) {
      console.error('Error saving schedule:', error);
      showAlert(error.message || 'Error saving schedule. Please try again.', 'danger');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

function validateTimes() {
  const startTimeInput = document.getElementById('scheduleStartTime');
  const endTimeInput = document.getElementById('scheduleEndTime');
  
  if (!startTimeInput || !endTimeInput) return true;
  
  const startTime = startTimeInput.value;
  const endTime = endTimeInput.value;
  
  if (startTime && endTime && endTime <= startTime) {
    endTimeInput.setCustomValidity('End time must be after start time.');
    endTimeInput.classList.add('is-invalid');
    return false;
  } else {
    endTimeInput.setCustomValidity('');
    endTimeInput.classList.remove('is-invalid');
    return true;
  }
}

function setupFilters() {
  const filterCourse = document.getElementById('filterCourse');
  const filterDate = document.getElementById('filterDate');
  
  if (filterCourse) {
    filterCourse.addEventListener('change', applyFilters);
  }
  
  if (filterDate) {
    filterDate.addEventListener('change', applyFilters);
  }
}

function applyFilters() {
  const courseFilter = document.getElementById('filterCourse')?.value || '';
  const dateFilter = document.getElementById('filterDate')?.value || '';
  
  filteredSchedules = schedules.filter(schedule => {
    const courseId = schedule.courseId || schedule.CourseId;
    const date = schedule.date || schedule.Date;
    
    if (courseFilter && courseId !== courseFilter) {
      return false;
    }
    
    if (dateFilter) {
      const scheduleDate = formatDateForAPI(date);
      if (scheduleDate !== dateFilter) {
        return false;
      }
    }
    
    return true;
  });
  
  renderSchedulesTable();
}

function clearFilters() {
  document.getElementById('filterCourse').value = '';
  document.getElementById('filterDate').value = '';
  filteredSchedules = [...schedules];
  renderSchedulesTable();
}

function openDeleteModal(scheduleId) {
  currentDeleteId = scheduleId;
  const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
  modal.show();
}

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
        await api.delete(`/CourseSchedules/${currentDeleteId}`);
        showAlert('Schedule deleted successfully!', 'success');

        // Close modal and reload schedules
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
        modal.hide();
        await loadSchedules();
      } catch (error) {
        console.error('Error deleting schedule:', error);
        const errorMessage = error.message || 'Error deleting schedule. Please try again.';
        showAlert(errorMessage, 'danger');
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
        currentDeleteId = null;
      }
    });
  }
}

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

  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.remove();
    }
  }, 5000);
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

