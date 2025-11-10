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
      <tr>
        <td><strong>${escapeHtml(courseName)}</strong></td>
        <td>${displayDescription}</td>
        <td><span class="badge bg-primary">${creditWeight} credits</span></td>
        <td class="text-end">
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

