let departments = [];
let departmentAdmins = [];
let users = [];
let departmentAdminMap = {}; // Map DepartmentAdminId to User info
let currentDeleteId = null;
let currentAdminProfileId = null; // Current logged-in admin's profile ID

document.addEventListener('DOMContentLoaded', async () => {
  // Check if we're on the departments page
  if (!document.getElementById('departmentsTableBody')) {
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

  // Load department admins and users first (needed for display)
  await loadDepartmentAdmins();
  await loadUsers();
  buildDepartmentAdminMap();

  await loadDepartments();

  setupFormHandler();

  // Check URL for action parameter (for quick action from dashboard)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'create') {
    openCreateModal();
  }
});

// Load department admins from API
async function loadDepartmentAdmins() {
  try {
    departmentAdmins = await api.get('/DepartmentAdmins');
  } catch (error) {
    console.error('Error loading department admins:', error);
    showAlert('Error loading department admins. Please refresh the page.', 'danger');
  }
}

// Load users from API
async function loadUsers() {
  try {
    users = await api.get('/Users');
  } catch (error) {
    console.error('Error loading users:', error);
    // Don't show error for users, we can still work without names
  }
}

// Build map of DepartmentAdminId to User info
function buildDepartmentAdminMap() {
  departmentAdminMap = {};
  departmentAdmins.forEach(admin => {
    // Try both camelCase and PascalCase for property names (ASP.NET Core default is camelCase)
    const userId = admin.userId || admin.UserId;
    const user = users.find(u => u.id === userId || u.Id === userId);
    if (user) {
      const firstName = user.firstName || user.FirstName || '';
      const lastName = user.lastName || user.LastName || '';
      const email = user.email || user.Email || '';
      departmentAdminMap[admin.id || admin.Id] = {
        name: `${firstName} ${lastName}`.trim() || 'Unknown User',
        email: email
      };
    } else {
      const adminId = admin.id || admin.Id;
      departmentAdminMap[adminId] = {
        name: `Admin (ID: ${adminId ? adminId.substring(0, 8) : 'Unknown'}...)`,
        email: ''
      };
    }
  });
}


// Load departments from API
async function loadDepartments() {
  try {
    departments = await api.get('/Departments');
    renderDepartmentsTable();
  } catch (error) {
    console.error('Error loading departments:', error);
    showAlert('Error loading departments. Please refresh the page.', 'danger');
    document.getElementById('departmentsTableBody').innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-danger">Error loading departments. Please refresh the page.</td>
      </tr>
    `;
  }
}

// Render departments table
function renderDepartmentsTable() {
  const tbody = document.getElementById('departmentsTableBody');
  if (!tbody) return;

  // Filter to show only departments owned by current admin
  const myDepartments = departments.filter(dept => {
    const deptAdminId = dept.departmentAdminId || dept.DepartmentAdminId;
    return deptAdminId === currentAdminProfileId;
  });

  if (myDepartments.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-muted">No departments found. Click "Create Department" to add one.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = myDepartments.map(dept => {
    // Try both camelCase and PascalCase for property names
    const deptId = dept.id || dept.Id;
    const deptAdminId = dept.departmentAdminId || dept.DepartmentAdminId;
    const deptName = dept.departmentName || dept.DepartmentName;
    const deptDesc = dept.description || dept.Description;
    
    const adminInfo = departmentAdminMap[deptAdminId] || {
      name: `Admin (ID: ${deptAdminId ? deptAdminId.substring(0, 8) : 'Unknown'}...)`,
      email: ''
    };

    return `
      <tr>
        <td><strong>${escapeHtml(deptName)}</strong></td>
        <td>${deptDesc ? escapeHtml(deptDesc) : '<span class="text-muted">No description</span>'}</td>
        <td>
          <div>${escapeHtml(adminInfo.name)}</div>
          ${adminInfo.email ? `<small class="text-muted">${escapeHtml(adminInfo.email)}</small>` : ''}
        </td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary me-2" onclick="openEditModal('${deptId}')">
            <i class="bi bi-pencil"></i> Edit
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="openDeleteModal('${deptId}')">
            <i class="bi bi-trash"></i> Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Open create modal
function openCreateModal() {
  if (!currentAdminProfileId) {
    showAlert('Error: Could not determine current admin. Please login again.', 'danger');
    return;
  }

  const modal = new bootstrap.Modal(document.getElementById('departmentModal'));
  document.getElementById('departmentModalLabel').textContent = 'Create Department';
  document.getElementById('departmentSubmitBtn').textContent = 'Create';
  document.getElementById('departmentForm').reset();
  document.getElementById('departmentId').value = '';
  document.getElementById('departmentForm').classList.remove('was-validated');
  modal.show();
}

// Open edit modal
function openEditModal(departmentId) {
  const department = departments.find(d => (d.id || d.Id) === departmentId);
  if (!department) {
    showAlert('Department not found.', 'danger');
    return;
  }

  // Check if current admin owns this department
  const deptAdminId = department.departmentAdminId || department.DepartmentAdminId;
  if (deptAdminId !== currentAdminProfileId) {
    showAlert('You can only edit departments assigned to you.', 'warning');
    return;
  }

  const modal = new bootstrap.Modal(document.getElementById('departmentModal'));
  document.getElementById('departmentModalLabel').textContent = 'Edit Department';
  document.getElementById('departmentSubmitBtn').textContent = 'Update';
  document.getElementById('departmentId').value = department.id || department.Id;
  document.getElementById('departmentName').value = department.departmentName || department.DepartmentName;
  document.getElementById('departmentDescription').value = department.description || department.Description || '';
  document.getElementById('departmentForm').classList.remove('was-validated');
  modal.show();
}

function setupFormHandler() {
  const form = document.getElementById('departmentForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const departmentId = document.getElementById('departmentId').value;
    const departmentName = document.getElementById('departmentName').value.trim();
    const description = document.getElementById('departmentDescription').value.trim();

    // Use current logged-in admin's profile ID
    if (!currentAdminProfileId) {
      showAlert('Error: Could not determine current admin. Please login again.', 'danger');
      return;
    }

    const departmentData = {
      departmentName: departmentName,
      description: description || null,
      departmentAdminId: currentAdminProfileId
    };
    // Note: ID is not sent in body - for PUT requests, ID is in URL path
    // For POST requests, backend generates the ID

    const submitBtn = document.getElementById('departmentSubmitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

    try {
      if (departmentId) {
        // Update existing department
        await api.put(`/Departments/${departmentId}`, departmentData);
        showAlert('Department updated successfully!', 'success');
      } else {
        // Create new department
        await api.post('/Departments', departmentData);
        showAlert('Department created successfully!', 'success');
      }

      // Close modal and reload departments
      const modal = bootstrap.Modal.getInstance(document.getElementById('departmentModal'));
      modal.hide();
      await loadDepartments();
    } catch (error) {
      console.error('Error saving department:', error);
      showAlert(error.message || 'Error saving department. Please try again.', 'danger');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

function openDeleteModal(departmentId) {
  currentDeleteId = departmentId;
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
        // Check if current admin owns this department
        const department = departments.find(d => (d.id || d.Id) === currentDeleteId);
        if (department) {
          const deptAdminId = department.departmentAdminId || department.DepartmentAdminId;
          if (deptAdminId !== currentAdminProfileId) {
            showAlert('You can only delete departments assigned to you.', 'warning');
            btn.disabled = false;
            btn.textContent = originalText;
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
            modal.hide();
            return;
          }
        }

        // First, check if department has programmes
        const programmes = await api.get('/Programmes').catch(() => []);
        const departmentProgrammes = programmes.filter(p => 
          (p.departmentId || p.DepartmentId) === currentDeleteId
        );

        if (departmentProgrammes.length > 0) {
          showAlert(`Cannot delete department. It has ${departmentProgrammes.length} programme(s) assigned. Please remove programmes first.`, 'danger');
          btn.disabled = false;
          btn.textContent = originalText;
          const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
          modal.hide();
          return;
        }

        // Delete department
        await api.delete(`/Departments/${currentDeleteId}`);
        showAlert('Department deleted successfully!', 'success');

        // Close modal and reload departments
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
        modal.hide();
        await loadDepartments();
      } catch (error) {
        console.error('Error deleting department:', error);
        showAlert(error.message || 'Error deleting department. Please try again.', 'danger');
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
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}


