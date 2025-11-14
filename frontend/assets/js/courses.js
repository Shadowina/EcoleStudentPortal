let courses = [];
let currentDeleteId = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Check if we're on the courses page
  if (!document.getElementById('coursesTableBody')) {
    return;
  }

  await loadCourses();

  setupFormHandler();

  // Check URL for action parameter (for quick action from dashboard)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'create') {
    openCreateModal();
  }
});

async function loadCourses() {
  try {
    courses = await api.get('/Courses');
    renderCoursesTable();
  } catch (error) {
    console.error('Error loading courses:', error);
    showAlert('Error loading courses. Please refresh the page.', 'danger');
    document.getElementById('coursesTableBody').innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-danger">Error loading courses. Please refresh the page.</td>
      </tr>
    `;
  }
}

function renderCoursesTable() {
  const tbody = document.getElementById('coursesTableBody');
  if (!tbody) return;

  if (courses.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-muted">No courses found. Click "Create Course" to add one.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = courses.map(course => {
    // Try both camelCase and PascalCase for property names
    const courseId = course.id || course.Id;
    const courseName = course.courseName || course.CourseName;
    const description = course.description || course.Description;
    const creditWeight = course.creditWeight || course.CreditWeight;
    
    // Truncate description if too long
    const displayDescription = description 
      ? (description.length > 100 ? description.substring(0, 100) + '...' : description)
      : '<span class="text-muted">No description</span>';

    return `
      <tr data-clickable="true" data-course-id="${courseId}">
        <td><strong>${escapeHtml(courseName)}</strong></td>
        <td>${displayDescription}</td>
        <td><span class="badge bg-primary">${creditWeight} credits</span></td>
        <td class="text-end" onclick="event.stopPropagation()">
          <button class="btn btn-sm btn-outline-primary me-2" onclick="openEditModal('${courseId}')">
            <i class="bi bi-pencil"></i> Edit
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="openDeleteModal('${courseId}')">
            <i class="bi bi-trash"></i> Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');
  
  setupRowClickHandlers();
}

function setupRowClickHandlers() {
  const tbody = document.getElementById('coursesTableBody');
  if (!tbody) return;
  
  const rows = tbody.querySelectorAll('tr[data-clickable="true"]');
  rows.forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('button')) {
        return;
      }
      const courseId = row.getAttribute('data-course-id');
      if (courseId) {
        openCourseDetailView(courseId);
      }
    });
  });
}

async function openCourseDetailView(courseId) {
  const course = courses.find(c => (c.id || c.Id) === courseId);
  if (!course) {
    showAlert('Course not found.', 'danger');
    return;
  }

  let programmeCourses = [];
  let programmeDetails = [];
  try {
    const allProgrammeCourses = await api.get('/ProgrammeCourses');
    programmeCourses = allProgrammeCourses.filter(pc => {
      const pcCourseId = pc.courseId || pc.CourseId;
      return pcCourseId === courseId;
    });
    
    for (const pc of programmeCourses) {
      const progId = pc.programmeId || pc.ProgrammeId;
      try {
        const programme = await api.get(`/Programmes/${progId}`);
        programmeDetails.push(programme);
      } catch (error) {
        console.error(`Error loading programme ${progId}:`, error);
      }
    }
  } catch (error) {
    console.error('Error loading programme courses:', error);
  }

  let professorCourses = [];
  let professorDetails = [];
  try {
    const allProfessorCourses = await api.get('/ProfessorCourses');
    professorCourses = allProfessorCourses.filter(pc => {
      const pcCourseId = pc.courseId || pc.CourseId;
      return pcCourseId === courseId;
    });
    
    for (const pc of professorCourses) {
      const profId = pc.professorId || pc.ProfessorId;
      try {
        const professor = await api.get(`/Professors/${profId}`);
        const userId = professor.userId || professor.UserId;
        let userName = 'Unknown';
        let userEmail = '';
        try {
          const user = await api.get(`/Users/${userId}`);
          const firstName = user.firstName || user.FirstName || '';
          const lastName = user.lastName || user.LastName || '';
          userName = `${firstName} ${lastName}`.trim() || 'Unknown';
          userEmail = user.email || user.Email || '';
        } catch (error) {
          console.error(`Error loading user ${userId}:`, error);
        }
        professorDetails.push({
          ...professor,
          userName,
          userEmail
        });
      } catch (error) {
        console.error(`Error loading professor ${profId}:`, error);
      }
    }
  } catch (error) {
    console.error('Error loading professor courses:', error);
  }

  const formatDate = (date) => {
    if (!date) return 'N/A';
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString();
    }
    return date.toLocaleDateString();
  };

  const config = {
    title: `Course: ${course.courseName || course.CourseName}`,
    sections: [
      {
        title: 'Course Information',
        items: [
          { label: 'Name', value: course.courseName || course.CourseName },
          { label: 'Description', value: course.description || course.Description || 'No description' },
          { label: 'Credit Weight', value: `${course.creditWeight || course.CreditWeight} credits` },
          { label: 'Course Content', value: course.courseContent || course.CourseContent || 'No content specified' }
        ]
      }
    ],
    subItems: [
      {
        title: 'Programmes',
        columns: ['Name', 'Session Start', 'Session End'],
        items: programmeDetails.map(prog => ({
          Name: `<strong>${escapeHtml(prog.programmeName || prog.ProgrammeName)}</strong>`,
          'Session Start': formatDate(prog.sessionStart || prog.SessionStart),
          'Session End': formatDate(prog.sessionEnd || prog.SessionEnd)
        }))
      },
      {
        title: 'Professors',
        columns: ['Name', 'Email', 'Specialization'],
        items: professorDetails.map(prof => ({
          Name: `<strong>${escapeHtml(prof.userName || 'Unknown')}</strong>`,
          Email: escapeHtml(prof.userEmail || 'No email'),
          Specialization: escapeHtml(prof.specialization || prof.Specialization || 'Not specified')
        }))
      }
    ]
  };

  detailView.show(config);
}

function openCreateModal() {
  const modal = new bootstrap.Modal(document.getElementById('courseModal'));
  document.getElementById('courseModalLabel').textContent = 'Create Course';
  document.getElementById('courseSubmitBtn').textContent = 'Create';
  document.getElementById('courseForm').reset();
  document.getElementById('courseId').value = '';
  document.getElementById('courseForm').classList.remove('was-validated');
  modal.show();
}

function openEditModal(courseId) {
  const course = courses.find(c => (c.id || c.Id) === courseId);
  if (!course) {
    showAlert('Course not found.', 'danger');
    return;
  }

  const modal = new bootstrap.Modal(document.getElementById('courseModal'));
  document.getElementById('courseModalLabel').textContent = 'Edit Course';
  document.getElementById('courseSubmitBtn').textContent = 'Update';
  document.getElementById('courseId').value = course.id || course.Id;
  document.getElementById('courseName').value = course.courseName || course.CourseName;
  document.getElementById('courseDescription').value = course.description || course.Description || '';
  document.getElementById('creditWeight').value = course.creditWeight || course.CreditWeight;
  document.getElementById('courseContent').value = course.courseContent || course.CourseContent || '';
  document.getElementById('courseForm').classList.remove('was-validated');
  modal.show();
}

// Setup for handler
function setupFormHandler() {
  const form = document.getElementById('courseForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const courseId = document.getElementById('courseId').value;
    const courseName = document.getElementById('courseName').value.trim();
    const description = document.getElementById('courseDescription').value.trim();
    const creditWeight = parseInt(document.getElementById('creditWeight').value);
    const courseContent = document.getElementById('courseContent').value.trim();

    // Validate credit weight
    if (isNaN(creditWeight) || creditWeight < 1 || creditWeight > 10) {
      showAlert('Credit weight must be between 1 and 10.', 'danger');
      return;
    }

    const courseData = {
      courseName: courseName,
      description: description || null,
      creditWeight: creditWeight,
      courseContent: courseContent || null
    };

    const submitBtn = document.getElementById('courseSubmitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

    try {
      if (courseId) {
        // Update existing course - ID is in URL path
        await api.put(`/Courses/${courseId}`, courseData);
        showAlert('Course updated successfully!', 'success');
      } else {
        // Create new course
        await api.post('/Courses', courseData);
        showAlert('Course created successfully!', 'success');
      }

      // Close modal and reload courses
      const modal = bootstrap.Modal.getInstance(document.getElementById('courseModal'));
      modal.hide();
      await loadCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      showAlert(error.message || 'Error saving course. Please try again.', 'danger');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

function openDeleteModal(courseId) {
  currentDeleteId = courseId;
  const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
  modal.show();
}

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
        // Delete course (backend will check for dependencies)
        await api.delete(`/Courses/${currentDeleteId}`);
        showAlert('Course deleted successfully!', 'success');

        // Close modal and reload courses
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
        modal.hide();
        await loadCourses();
      } catch (error) {
        console.error('Error deleting course:', error);
        // Backend returns detailed error messages about why deletion failed
        const errorMessage = error.message || 'Error deleting course. Please try again.';
        showAlert(errorMessage, 'danger');
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
        currentDeleteId = null;
      }
    });
  }
});

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

