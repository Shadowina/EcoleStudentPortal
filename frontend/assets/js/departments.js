let departments = [];
let departmentAdmins = [];
let users = [];
let departmentAdminMap = {};
let currentDeleteId = null;
let currentAdminProfileId = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('departmentsTableBody')) {
    return;
  }

  const userData = auth.getUserData();
  if (userData && userData.userType === 'DepartmentAdmin' && userData.profileId) {
    currentAdminProfileId = userData.profileId;
  } else {
    showAlert('Error: Could not determine current admin. Please login again.', 'danger');
    return;
  }

  await loadDepartmentAdmins();
  await loadUsers();
  buildDepartmentAdminMap();

  await loadDepartments();

  setupFormHandler();

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'create') {
    openCreateModal();
  }
});

async function loadDepartmentAdmins() {
  try {
    departmentAdmins = await api.get('/DepartmentAdmins');
  } catch (error) {
    console.error('Error loading department admins:', error);
    showAlert('Error loading department admins. Please refresh the page.', 'danger');
  }
}

async function loadUsers() {
  try {
    users = await api.get('/Users');
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

function buildDepartmentAdminMap() {
  departmentAdminMap = {};
  departmentAdmins.forEach(admin => {
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

function renderDepartmentsTable() {
  const tbody = document.getElementById('departmentsTableBody');
  if (!tbody) return;

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
    const deptId = dept.id || dept.Id;
    const deptAdminId = dept.departmentAdminId || dept.DepartmentAdminId;
    const deptName = dept.departmentName || dept.DepartmentName;
    const deptDesc = dept.description || dept.Description;
    
    const adminInfo = departmentAdminMap[deptAdminId] || {
      name: `Admin (ID: ${deptAdminId ? deptAdminId.substring(0, 8) : 'Unknown'}...)`,
      email: ''
    };

    return `
      <tr data-clickable="true" data-department-id="${deptId}">
        <td><strong>${escapeHtml(deptName)}</strong></td>
        <td>${deptDesc ? escapeHtml(deptDesc) : '<span class="text-muted">No description</span>'}</td>
        <td>
          <div>${escapeHtml(adminInfo.name)}</div>
          ${adminInfo.email ? `<small class="text-muted">${escapeHtml(adminInfo.email)}</small>` : ''}
        </td>
        <td class="text-end" onclick="event.stopPropagation()">
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
  
  setupRowClickHandlers();
}

function setupRowClickHandlers() {
  const tbody = document.getElementById('departmentsTableBody');
  if (!tbody) return;
  
  const rows = tbody.querySelectorAll('tr[data-clickable="true"]');
  rows.forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('button')) {
        return;
      }
      const departmentId = row.getAttribute('data-department-id');
      if (departmentId) {
        openDepartmentDetailView(departmentId);
      }
    });
  });
}

async function openDepartmentDetailView(departmentId) {
  const department = departments.find(d => (d.id || d.Id) === departmentId);
  if (!department) {
    showAlert('Department not found.', 'danger');
    return;
  }

  const deptAdminId = department.departmentAdminId || department.DepartmentAdminId;
  const adminInfo = departmentAdminMap[deptAdminId] || {
    name: 'Unknown Admin',
    email: ''
  };

  let programmes = [];
  try {
    const allProgrammes = await api.get('/Programmes');
    programmes = allProgrammes.filter(prog => {
      const progDeptId = prog.departmentId || prog.DepartmentId;
      return progDeptId === departmentId;
    });
  } catch (error) {
    console.error('Error loading programmes:', error);
  }

  const formatDate = (date) => {
    if (!date) return 'N/A';
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString();
    }
    return date.toLocaleDateString();
  };

  const config = {
    title: `Department: ${department.departmentName || department.DepartmentName}`,
    sections: [
      {
        title: 'Department Information',
        items: [
          { label: 'Name', value: department.departmentName || department.DepartmentName },
          { label: 'Description', value: department.description || department.Description || 'No description' },
          { label: 'Department Admin', value: adminInfo.name + (adminInfo.email ? ` (${adminInfo.email})` : '') }
        ]
      }
    ],
    subItems: [
      {
        title: 'Programmes',
        columns: ['Name', 'Session Start', 'Session End'],
        items: programmes.map(prog => ({
          Name: `<strong>${escapeHtml(prog.programmeName || prog.ProgrammeName)}</strong>`,
          'Session Start': formatDate(prog.sessionStart || prog.SessionStart),
          'Session End': formatDate(prog.sessionEnd || prog.SessionEnd)
        }))
      }
    ]
  };

  detailView.show(config);
}

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

function openEditModal(departmentId) {
  const department = departments.find(d => (d.id || d.Id) === departmentId);
  if (!department) {
    showAlert('Department not found.', 'danger');
    return;
  }

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

    if (!currentAdminProfileId) {
      showAlert('Error: Could not determine current admin. Please login again.', 'danger');
      return;
    }

    const departmentData = {
      departmentName: departmentName,
      description: description || null,
      departmentAdminId: currentAdminProfileId
    };

    const submitBtn = document.getElementById('departmentSubmitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

    try {
      if (departmentId) {
        await api.put(`/Departments/${departmentId}`, departmentData);
        showAlert('Department updated successfully!', 'success');
      } else {
        await api.post('/Departments', departmentData);
        showAlert('Department created successfully!', 'success');
      }

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

        await api.delete(`/Departments/${currentDeleteId}`);
        showAlert('Department deleted successfully!', 'success');

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

  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.remove();
    }
  }, 5000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}


