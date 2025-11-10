const API_BASE_URL = 'http://localhost:5242/api';

const api = {
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/Users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || 'Invalid email or password');
    }

    return await response.json();
  },

  async register(data) {
    const response = await fetch(`${API_BASE_URL}/Users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Registration failed' }));
      throw new Error(error.message || 'Registration failed');
    }

    return await response.json();
  },

  
  async authenticatedFetch(endpoint, options = {}) {
    const token = auth.getToken();
    
    if (!token) {
      
      auth.clearAuth();
      window.location.href = auth.getLoginUrl();
      throw new Error('Not authenticated');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    
    if (response.status === 401) {
      auth.clearAuth();
      window.location.href = auth.getLoginUrl();
      throw new Error('Session expired. Please login again.');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `Request failed with status ${response.status}`);
    }

    
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  },

  
  async get(endpoint) {
    return this.authenticatedFetch(endpoint, { method: 'GET' });
  },

  async post(endpoint, data) {
    return this.authenticatedFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async put(endpoint, data) {
    return this.authenticatedFetch(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async delete(endpoint) {
    return this.authenticatedFetch(endpoint, { method: 'DELETE' });
  }
};

const auth = {
  saveToken(token) {
    localStorage.setItem('authToken', token);
  },

  getToken() {
    return localStorage.getItem('authToken');
  },

  clearAuth() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  },

  saveUserData(userData) {
    localStorage.setItem('userData', JSON.stringify(userData));
  },

  getUserData() {
    const data = localStorage.getItem('userData');
    return data ? JSON.parse(data) : null;
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  
  isTokenExpired() {
    const token = this.getToken();
    if (!token) return true;

    try {
      
      const parts = token.split('.');
      if (parts.length !== 3) return true;

      
      const payload = JSON.parse(atob(parts[1]));
      
      
      if (payload.exp) {
        const expTime = payload.exp * 1000; 
        return Date.now() >= expTime;
      }

      
      return false;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  },

  
  getLoginUrl() {
    const currentPath = window.location.pathname;
    if (currentPath.includes('/admin/') || currentPath.includes('/professor/') || currentPath.includes('/student/')) {
      return '../login.html';
    }
    return 'login.html';
  },

  
  requireAuth() {
    if (!this.isAuthenticated() || this.isTokenExpired()) {
      this.clearAuth();
      window.location.href = this.getLoginUrl();
      return false;
    }
    return true;
  },

  
  requireUserType(userType) {
    if (!this.requireAuth()) {
      return false;
    }

    const userData = this.getUserData();
    if (!userData || userData.userType !== userType) {
      
      this.clearAuth();
      window.location.href = this.getLoginUrl();
      return false;
    }

    return true;
  }
};

function showError(message, container) {
  
  const existingAlert = container.querySelector('.alert-danger');
  if (existingAlert) {
    existingAlert.remove();
  }

  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-danger alert-dismissible fade show';
  alertDiv.setAttribute('role', 'alert');
  alertDiv.innerHTML = `
    <strong>Error:</strong> ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  
  container.insertBefore(alertDiv, container.firstChild);
}

function showSuccess(message, container) {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-success alert-dismissible fade show';
  alertDiv.setAttribute('role', 'alert');
  alertDiv.innerHTML = `
    <strong>Success:</strong> ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  container.insertBefore(alertDiv, container.firstChild);
}

