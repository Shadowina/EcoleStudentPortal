document.addEventListener("DOMContentLoaded", () => {
  // Sidebar Toggle Functionality
  const sidebar = document.querySelector('.sidebar');
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  const mainContent = document.querySelector('.main-content');

  // Restore sidebar state from localStorage
  const savedState = localStorage.getItem('sidebarCollapsed');
  if (savedState === 'true' && sidebar) {
    sidebar.classList.add('collapsed');
    
    // Update toggle icon
    const icon = sidebarToggle?.querySelector('i');
    if (icon) {
      icon.classList.remove('bi-chevron-left');
      icon.classList.add('bi-chevron-right');
    }
  }

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebar?.classList.toggle('collapsed');
      
      // Update toggle icon
      const icon = sidebarToggle.querySelector('i');
      if (icon) {
        if (sidebar?.classList.contains('collapsed')) {
          icon.classList.remove('bi-chevron-left');
          icon.classList.add('bi-chevron-right');
        } else {
          icon.classList.remove('bi-chevron-right');
          icon.classList.add('bi-chevron-left');
        }
      }
      
      // Save preference to localStorage
      const isCollapsed = sidebar?.classList.contains('collapsed');
      localStorage.setItem('sidebarCollapsed', isCollapsed);
    });
  }

  // Set active nav item based on current page and check authentication
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && currentPath.includes(href.replace('.html', ''))) {
      link.classList.add('active');
    }
  });

  // Check authentication and authorization based on page
  const isAdminPage = currentPath.includes('/admin/');
  const isProfessorPage = currentPath.includes('/professor/');
  const isStudentPage = currentPath.includes('/student/');
  const isAuthPage = currentPath.includes('login.html') || currentPath.includes('register.html');

  // If on an admin page, require DepartmentAdmin user type
  if (isAdminPage) {
    if (!auth.requireUserType('DepartmentAdmin')) {
      return; // Redirect will happen in requireUserType
    }
  }
  // If on a professor page, require Professor user type
  else if (isProfessorPage) {
    if (!auth.requireUserType('Professor')) {
      return; // Redirect will happen in requireUserType
    }
  }
  // If on a student page, require Student user type
  else if (isStudentPage) {
    if (!auth.requireUserType('Student')) {
      return; // Redirect will happen in requireUserType
    }
  }
  // If on a protected page (not auth page), require authentication
  else if (!isAuthPage) {
    if (!auth.requireAuth()) {
      return; // Redirect will happen in requireAuth
    }
  }

  // If authenticated, update UI
  const userData = auth.getUserData();
  if (userData && !isAuthPage) {
    // Update user info in sidebar
    updateUserInfo(userData);
    
    // Set up navigation based on user type
    setupNavigation(userData.userType);
  }

  // Logout functionality
  const logoutLinks = document.querySelectorAll('.nav-link.logout');
  logoutLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to logout?')) {
        auth.clearAuth();
        window.location.href = 'login.html';
      }
    });
  });
});

// Update user info in sidebar
function updateUserInfo(userData) {
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
    // Set avatar initials
    const initials = `${userData.firstName.charAt(0)}${userData.lastName?.charAt(0) || ''}`;
    userAvatarEl.textContent = initials;
  }
}

// Setup navigation based on user type
function setupNavigation(userType) {
  // Hide all role-specific menus first
  const roleMenus = document.querySelectorAll('[data-role]');
  roleMenus.forEach(menu => {
    menu.style.display = 'none';
  });

  // Show menu for current user type
  const currentMenu = document.querySelector(`[data-role="${userType}"]`);
  if (currentMenu) {
    currentMenu.style.display = 'block';
  }

  // Show appropriate sidebar based on role
  const sidebarContent = document.querySelector('.sidebar-nav');
  if (sidebarContent && userType) {
    // Role-specific navigation will be handled in individual pages
  }
}

