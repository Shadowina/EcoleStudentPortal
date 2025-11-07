document.addEventListener("DOMContentLoaded", () => {
  const yearSpan = document.querySelector("[data-year]");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  const toastTriggers = document.querySelectorAll("[data-bs-toggle='tooltip']");
  [...toastTriggers].forEach((triggerEl) => {
    new bootstrap.Tooltip(triggerEl);
  });

  // Password confirmation validation on registration form
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    const passwordInput = document.getElementById("createPassword");
    const confirmInput = document.getElementById("confirmPassword");
    const postalCodeInput = document.getElementById("postalCode");
    const userRoleSelect = document.getElementById("userRole");
    const specializationField = document.getElementById("specializationField");
    const specializationInput = document.getElementById("specialization");

    // Handle role selection - show/hide specialization field
    userRoleSelect?.addEventListener("change", (e) => {
      const selectedRole = e.target.value;
      if (selectedRole === "Professor") {
        specializationField.style.display = "block";
        specializationInput.setAttribute("required", "required");
      } else {
        specializationField.style.display = "none";
        specializationInput.removeAttribute("required");
        specializationInput.value = "";
        specializationInput.selectedIndex = 0;
        specializationInput.classList.remove("is-invalid");
      }
    });

    const validatePasswordStrength = () => {
      if (!passwordInput) return true;
      const value = passwordInput.value || "";
      const hasMinLen = value.length >= 8;
      const hasLetter = /[A-Za-z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasSymbol = /[^A-Za-z0-9]/.test(value);
      const ok = hasMinLen && hasLetter && hasNumber && hasSymbol;
      if (!ok) {
        passwordInput.classList.add("is-invalid");
        passwordInput.setCustomValidity("Weak password");
      } else {
        passwordInput.classList.remove("is-invalid");
        passwordInput.setCustomValidity("");
      }
      return ok;
    };

    const validatePasswords = () => {
      if (!passwordInput || !confirmInput) return true;
      const match = passwordInput.value === confirmInput.value;
      if (!match) {
        confirmInput.classList.add("is-invalid");
        confirmInput.setCustomValidity("Passwords do not match.");
      } else {
        confirmInput.classList.remove("is-invalid");
        confirmInput.setCustomValidity("");
      }
      return match;
    };

    const validatePostalCode = () => {
      if (!postalCodeInput) return true;
      const value = postalCodeInput.value.trim();
      // Postal code is now required and must be exactly 5 digits
      const isValid = /^[0-9]{5}$/.test(value);
      if (!isValid) {
        postalCodeInput.classList.add("is-invalid");
        postalCodeInput.setCustomValidity("Postal code must be exactly 5 digits.");
      } else {
        postalCodeInput.classList.remove("is-invalid");
        postalCodeInput.setCustomValidity("");
      }
      return isValid;
    };

    const validateSpecialization = () => {
      if (!specializationInput) return true;
      const selectedRole = userRoleSelect?.value;
      // Specialization is only required for Professors
      if (selectedRole === "Professor") {
        const value = specializationInput.value;
        if (value === "" || value === null) {
          specializationInput.classList.add("is-invalid");
          specializationInput.setCustomValidity("Please select your specialization.");
          return false;
        } else {
          specializationInput.classList.remove("is-invalid");
          specializationInput.setCustomValidity("");
          return true;
        }
      }
      return true;
    };

    passwordInput?.addEventListener("input", () => {
      validatePasswordStrength();
      validatePasswords();
    });
    confirmInput?.addEventListener("input", validatePasswords);
    postalCodeInput?.addEventListener("input", (e) => {
      // Only allow digits
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
      validatePostalCode();
    });
    postalCodeInput?.addEventListener("blur", validatePostalCode);
    specializationInput?.addEventListener("change", validateSpecialization);

    // Registration form submission
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const strong = validatePasswordStrength();
      const match = validatePasswords();
      const validPostalCode = validatePostalCode();
      const validSpecialization = validateSpecialization();
      const ok = strong && match && validPostalCode && validSpecialization;
      
      if (!ok || !registerForm.checkValidity()) {
        registerForm.classList.add("was-validated");
        return;
      }

      const firstName = document.getElementById("firstName").value;
      const lastName = document.getElementById("lastName").value;
      const email = document.getElementById("userEmail").value;
      const password = document.getElementById("createPassword").value;
      const userRole = document.getElementById("userRole").value;
      const address = document.getElementById("address").value.trim();
      const postalCode = document.getElementById("postalCode").value.trim();
      const specialization = userRole === "Professor" ? document.getElementById("specialization").value : null;
      const submitButton = registerForm.querySelector('button[type="submit"]');
      const cardBody = registerForm.closest('.card-body');

      // Remove existing alerts
      const existingAlert = cardBody.querySelector('.alert');
      if (existingAlert) existingAlert.remove();

      // Show loading state
      const originalText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Creating account...';

      try {
        const registerData = {
          firstName: firstName,
          lastName: lastName,
          email: email,
          password: password,
          userType: userRole,
          address: address,
          postalCode: postalCode,
          year: null,
          programmeId: null,
          specialization: specialization,
          departmentId: null
        };

        const response = await api.register(registerData);
        
        // Save auth data
        auth.saveToken(response.token);
        auth.saveUserData({
          userId: response.userId,
          email: response.email,
          firstName: response.firstName,
          lastName: response.lastName,
          userType: response.userType
        });

        // Show success message
        showSuccess(`Account created successfully! Welcome, ${response.firstName}! Redirecting...`, cardBody);

        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);
      } catch (error) {
        showError(error.message || 'Registration failed. Please try again.', cardBody);
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    });
  }

  // Password visibility toggles
  const passwordToggleButtons = document.querySelectorAll('[data-toggle="password"]');
  passwordToggleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetSelector = btn.getAttribute('data-target');
      if (!targetSelector) return;
      const input = document.querySelector(targetSelector);
      if (!input) return;
      const icon = btn.querySelector('i');
      const isHidden = input.getAttribute('type') === 'password';
      input.setAttribute('type', isHidden ? 'text' : 'password');
      if (icon) {
        icon.classList.toggle('bi-eye', !isHidden);
        icon.classList.toggle('bi-eye-slash', isHidden);
      }
    });
  });

  // Login form submission
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!loginForm.checkValidity()) {
        loginForm.classList.add("was-validated");
        return;
      }

      const email = document.getElementById("loginEmail").value;
      const password = document.getElementById("loginPassword").value;
      const submitButton = loginForm.querySelector('button[type="submit"]');
      const cardBody = loginForm.closest('.card-body');

      // Remove existing alerts
      const existingAlert = cardBody.querySelector('.alert');
      if (existingAlert) existingAlert.remove();

      // Show loading state
      const originalText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Signing in...';

      try {
        const response = await api.login(email, password);
        
        // Save auth data
        auth.saveToken(response.token);
        auth.saveUserData({
          userId: response.userId,
          email: response.email,
          firstName: response.firstName,
          lastName: response.lastName,
          userType: response.userType,
          profileId: response.profileId
        });

        // Show success message
        showSuccess(`Welcome back, ${response.firstName}! Redirecting...`, cardBody);

        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);
      } catch (error) {
        showError(error.message || 'Login failed. Please check your credentials.', cardBody);
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    });
  }

});

