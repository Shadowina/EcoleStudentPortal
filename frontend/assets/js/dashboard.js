document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('statProgrammes')) {
    return;
  }

  await loadDashboardStats();

  await checkDepartmentDependency();
});

async function loadDashboardStats() {
  try {
    // Fetch all stats in parallel
    const [programmes, courses, professors, students] = await Promise.all([
      api.get('/Programmes').catch(() => []),
      api.get('/Courses').catch(() => []),
      api.get('/Professors').catch(() => []),
      api.get('/Students').catch(() => [])
    ]);

    updateStatCard('statProgrammes', programmes.length || 0);
    updateStatCard('statCourses', courses.length || 0);
    updateStatCard('statProfessors', professors.length || 0);
    updateStatCard('statStudents', students.length || 0);

  } catch (error) {
    console.error('Error loading dashboard stats:', error);
    updateStatCard('statProgrammes', 'Error');
    updateStatCard('statCourses', 'Error');
    updateStatCard('statProfessors', 'Error');
    updateStatCard('statStudents', 'Error');
  }
}

function updateStatCard(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value;
  }
}

async function checkDepartmentDependency() {
  try {
    const userData = auth.getUserData();
    if (!userData || !userData.profileId) {
      return;
    }

    const allDepartments = await api.get('/Departments').catch(() => []);
    const myDepartments = allDepartments.filter(dept => {
      const deptAdminId = dept.departmentAdminId || dept.DepartmentAdminId;
      return deptAdminId === userData.profileId;
    });

    const programmeQuickAction = document.getElementById('quickActionProgramme');

    if (programmeQuickAction && (!myDepartments || myDepartments.length === 0)) {
      // Disable the quick action and show a message
      programmeQuickAction.classList.add('disabled');
      programmeQuickAction.style.pointerEvents = 'none';
      programmeQuickAction.style.opacity = '0.6';
      
      const textElement = programmeQuickAction.querySelector('strong');
      if (textElement) {
        textElement.textContent = 'Create Programme (Requires Department)';
      }
      
      const descElement = programmeQuickAction.querySelector('p');
      if (descElement) {
        descElement.textContent = 'Create a department first';
        descElement.classList.add('text-danger');
      }

      // Change the link to point to departments page
      programmeQuickAction.href = 'departments.html?action=create';
    } else if (programmeQuickAction) {
      // Enable the quick action
      programmeQuickAction.classList.remove('disabled');
      programmeQuickAction.style.pointerEvents = 'auto';
      programmeQuickAction.style.opacity = '1';
      programmeQuickAction.href = 'programmes.html?action=create';
    }
  } catch (error) {
    console.error('Error checking department dependency:', error);
    // If we can't check, assume it's okay (don't disable)
  }
}

