async function loadSidebar() {
  try {
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    const response = await fetch('./components/sidebar.html');
    if (!response.ok) {
      throw new Error('Failed to load sidebar');
    }
    
    const sidebarHTML = await response.text();
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) {
      console.error('Sidebar container not found');
      return;
    }
    
    sidebarContainer.innerHTML = sidebarHTML;
    
    const navLinks = sidebarContainer.querySelectorAll('.nav-link[data-page]');
    navLinks.forEach(link => {
      const linkPage = link.getAttribute('data-page');
      if (linkPage === currentPage) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
    
    initializeSidebarFunctionality();
    window.dispatchEvent(new CustomEvent('sidebarLoaded'));
  } catch (error) {
    console.error('Error loading sidebar:', error);
    if (document.getElementById('sidebar-container')) {
      document.getElementById('sidebar-container').innerHTML = 
        '<div class="alert alert-danger">Error loading sidebar. Please refresh the page.</div>';
    }
  }
}

function initializeSidebarFunctionality() {
  const sidebar = document.querySelector('.sidebar');
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  
  if (!sidebar || !sidebarToggle) {
    console.warn('Sidebar elements not found after loading');
    return;
  }

  const savedState = localStorage.getItem('sidebarCollapsed');
  if (savedState === 'true' && sidebar) {
    sidebar.classList.add('collapsed');
    const icon = sidebarToggle.querySelector('i');
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

  if (sidebarToggle) {
    const newToggle = sidebarToggle.cloneNode(true);
    sidebarToggle.parentNode.replaceChild(newToggle, sidebarToggle);
    
    newToggle.addEventListener('click', () => {
      sidebar?.classList.toggle('collapsed');
      
      const icon = newToggle.querySelector('i');
      if (icon && sidebar) {
        const isCollapsed = sidebar.classList.contains('collapsed');
        if (isCollapsed) {
          icon.classList.remove('bi-chevron-left');
          icon.classList.add('bi-chevron-right');
        } else {
          icon.classList.remove('bi-chevron-right');
          icon.classList.add('bi-chevron-left');
        }
      }
      
      const isCollapsed = sidebar?.classList.contains('collapsed');
      localStorage.setItem('sidebarCollapsed', isCollapsed);
    });
  }

  if (typeof auth !== 'undefined' && auth.getUserData) {
    loadUserInfo();
  }

  setupLogout();
}

function setupLogout() {
  const logoutLinks = document.querySelectorAll('.nav-link.logout');
  logoutLinks.forEach(link => {
    const newLink = link.cloneNode(true);
    link.parentNode.replaceChild(newLink, link);
    
    newLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to logout?')) {
        if (typeof auth !== 'undefined' && auth.clearAuth) {
          auth.clearAuth();
        }
        window.location.href = 'login.html';
      }
    });
  });
}

function loadUserInfo() {
  try {
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
  } catch (error) {
    console.error('Error loading user info:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadSidebar);
} else {
  loadSidebar();
}

