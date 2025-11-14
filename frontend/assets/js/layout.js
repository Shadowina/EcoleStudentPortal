function initializeLayout() {
  const sidebar = document.querySelector('.sidebar');
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  
  if (!sidebar || !sidebarToggle) {
    window.addEventListener('sidebarLoaded', initializeLayout, { once: true });
    return;
  }

  const mainContent = document.querySelector('.main-content');

  const savedState = localStorage.getItem('sidebarCollapsed');
  if (savedState === 'true' && sidebar) {
    sidebar.classList.add('collapsed');
    const icon = sidebarToggle?.querySelector('i');
    if (icon) {
      icon.classList.remove('bi-chevron-left');
      icon.classList.add('bi-chevron-right');
    }
  } else if (sidebar && sidebarToggle) {
    const icon = sidebarToggle.querySelector('i');
    if (icon) {
      icon.classList.remove('bi-chevron-right');
      icon.classList.add('bi-chevron-left');
    }
  }
      
  if (typeof auth !== 'undefined' && auth.getUserData) {
    updateUserInfo();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initializeLayout();

  const currentPath = window.location.pathname;
  const isAdminPage = currentPath.includes('/admin/');
  const isProfessorPage = currentPath.includes('/professor/');
  const isStudentPage = currentPath.includes('/student/');
  const isAuthPage = currentPath.includes('login.html') || currentPath.includes('register.html');

  if (isAdminPage) {
    if (!auth.requireUserType('DepartmentAdmin')) {
      return;
    }
  }
  else if (isProfessorPage) {
    if (!auth.requireUserType('Professor')) {
      return;
    }
  }
  else if (isStudentPage) {
    if (!auth.requireUserType('Student')) {
      return;
    }
  }
  else if (!isAuthPage) {
    if (!auth.requireAuth()) {
      return;
    }
  }

  function setupLogout() {
  const logoutLinks = document.querySelectorAll('.nav-link.logout');
  logoutLinks.forEach(link => {
      const newLink = link.cloneNode(true);
      link.parentNode.replaceChild(newLink, link);
      
      newLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to logout?')) {
        auth.clearAuth();
        window.location.href = 'login.html';
      }
    });
  });
  }

  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    setupLogout();
  } else {
    window.addEventListener('sidebarLoaded', setupLogout, { once: true });
  }
});

function updateUserInfo() {
  const userData = auth.getUserData();
  if (!userData) {
    console.warn('No user data available');
    return;
  }

  const userNameEl = document.querySelector('.user-name');
  const userRoleEl = document.querySelector('.user-role');
  const userAvatarEl = document.querySelector('.user-avatar');

  if (userNameEl && userData.firstName && userData.lastName) {
    userNameEl.textContent = `${userData.firstName} ${userData.lastName}`;
  }

  if (userRoleEl && userData.userType) {
    userRoleEl.textContent = userData.userType.toUpperCase();
  }

  if (userAvatarEl && userData.firstName) {
    const initials = `${userData.firstName.charAt(0)}${userData.lastName?.charAt(0) || ''}`;
    userAvatarEl.textContent = initials;
  }
}

function setupNavigation(userType) {
  const roleMenus = document.querySelectorAll('[data-role]');
  roleMenus.forEach(menu => {
    menu.style.display = 'none';
  });

  const currentMenu = document.querySelector(`[data-role="${userType}"]`);
  if (currentMenu) {
    currentMenu.style.display = 'block';
  }

  const sidebarContent = document.querySelector('.sidebar-nav');
  if (sidebarContent && userType) {
  }
}

