// Shared Layout JavaScript
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

  // Set active nav item based on current page
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && currentPath.includes(href.replace('.html', ''))) {
      link.classList.add('active');
    }
  });

  // Check authentication
  const userData = auth.getUserData();
  const token = auth.getToken();

  if (!token || !userData) {
    // Redirect to login if not authenticated
    if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html')) {
      window.location.href = 'login.html';
    }
  } else {
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

