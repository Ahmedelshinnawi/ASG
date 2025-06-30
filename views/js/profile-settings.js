// Get DOM elements
const profileModal = document.getElementById("profileModal");
const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");
const profilePictureContainer = document.querySelector(
  ".profile-picture-container"
);
const profilePictureInput = document.getElementById("profilePictureInput");
const profilePicture = document.getElementById("profilePicture");

// Theme functionality
const themeToggle = document.getElementById("themeToggle");
const darkModeToggle = document.getElementById("darkModeToggle");

// User data loading
async function loadUserData() {
  try {
    if (!window.apiClient || !window.apiClient.auth.isAuthenticated()) {
      console.log("User not authenticated, redirecting...");
      window.location.href = "/welcome.html";
      return;
    }

    console.log("Loading user profile data...");
    const profile = await window.apiClient.getProfile();
    console.log("Profile data loaded:", profile);

    // Update form fields
    document.getElementById("fullNameInput").value = profile.full_name || "";
    document.getElementById("emailInput").value = profile.email || "";
    document.getElementById("usernameInput").value = profile.username || "";
    document.getElementById("bioInput").value = profile.bio || "";

    // Update profile picture
    if (profile.profile_picture) {
      document.getElementById("profilePicture").src = profile.profile_picture;
    } else {
      document.getElementById("profilePicture").src =
        window.apiClient.getDefaultAvatarUrl();
    }

    console.log("User data loaded successfully");
  } catch (error) {
    console.error("Failed to load user data:", error);
    // If error is authentication related, redirect to login
    if (
      error.message.includes("Authentication") ||
      error.message.includes("401")
    ) {
      window.location.href = "/welcome.html";
    }
  }
}

// Open modal
async function openModal() {
  profileModal.classList.add("active");
  document.body.style.overflow = "hidden";
  await loadUserData();
}

// Close modal
function closeModal() {
  profileModal.classList.remove("active");
  document.body.style.overflow = "";
}

// Event listeners for modal
openModalBtn.addEventListener("click", openModal);
closeModalBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);

// Close modal when clicking overlay
profileModal.addEventListener("click", (e) => {
  if (e.target === profileModal) {
    closeModal();
  }
});

// Close modal with ESC key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && profileModal.classList.contains("active")) {
    closeModal();
  }
});

// Profile picture upload
profilePictureContainer.addEventListener("click", () => {
  profilePictureInput.click();
});

profilePictureInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      profilePicture.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// Toggle switches functionality
document.querySelectorAll(".toggle-switch").forEach((toggle) => {
  toggle.addEventListener("click", () => {
    toggle.classList.toggle("active");

    // Haptic feedback on mobile
    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }
  });
});

// Theme toggle functionality
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", newTheme);

  // Update theme toggle icon
  const icon = themeToggle.querySelector("i");
  icon.className = newTheme === "dark" ? "fas fa-sun" : "fas fa-moon";

  // Update dark mode toggle in modal
  if (newTheme === "dark") {
    darkModeToggle.classList.add("active");
  } else {
    darkModeToggle.classList.remove("active");
  }

  // Save preference
  localStorage.setItem("theme", newTheme);
}

// Initialize theme
function initializeTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);

  const icon = themeToggle.querySelector("i");
  icon.className = savedTheme === "dark" ? "fas fa-sun" : "fas fa-moon";

  if (savedTheme === "dark") {
    darkModeToggle.classList.add("active");
  }
}

// Theme event listeners
themeToggle.addEventListener("click", toggleTheme);
darkModeToggle.addEventListener("click", toggleTheme);

// Password validation functions
function validatePassword(password) {
  const requirements = {
    length: password.length >= 8,
    letter: /[a-zA-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  return requirements;
}

function updatePasswordRequirements(password) {
  console.log("Updating password requirements for:", password);

  const requirements = validatePassword(password);
  console.log("Requirements:", requirements);

  // Update each requirement with proper icons
  const reqElements = {
    length: document.getElementById("lengthReq"),
    letter: document.getElementById("letterReq"),
    number: document.getElementById("numberReq"),
    special: document.getElementById("specialReq"),
  };

  Object.keys(requirements).forEach((key) => {
    const element = reqElements[key];
    if (element) {
      const icon = element.querySelector("i");
      if (requirements[key]) {
        element.classList.add("valid");
        if (icon) {
          icon.className = "fas fa-check";
        }
        console.log(`${key} requirement: VALID`);
      } else {
        element.classList.remove("valid");
        if (icon) {
          icon.className = "fas fa-times";
        }
        console.log(`${key} requirement: INVALID`);
      }
    } else {
      console.error(`${key} requirement element not found!`);
    }
  });

  return Object.values(requirements).every((req) => req);
}

// Password validation setup function
function setupPasswordValidation() {
  console.log("Setting up password validation...");

  // Get fresh references to the elements
  const newPasswordInput = document.getElementById("newPasswordInput");
  const confirmPasswordInput = document.getElementById("confirmPasswordInput");

  console.log("Password validation elements found:", {
    newPasswordInput: !!newPasswordInput,
    confirmPasswordInput: !!confirmPasswordInput,
    passwordRequirements: !!document.getElementById("passwordRequirements"),
    passwordMatchIndicator: !!document.getElementById("passwordMatchIndicator"),
  });

  if (newPasswordInput) {
    console.log("✓ Adding password validation event listeners");

    // Show requirements on focus
    newPasswordInput.addEventListener("focus", () => {
      const requirementsDiv = document.getElementById("passwordRequirements");
      if (requirementsDiv) {
        requirementsDiv.style.display = "block";
        console.log("Showing password requirements");
      }
    });

    // Hide requirements on blur only if password is empty
    newPasswordInput.addEventListener("blur", (e) => {
      const password = e.target.value;
      const requirementsDiv = document.getElementById("passwordRequirements");
      if (requirementsDiv && password.length === 0) {
        requirementsDiv.style.display = "none";
        console.log("Hiding password requirements");
      }
    });

    newPasswordInput.addEventListener("input", (e) => {
      const password = e.target.value;
      console.log("New password input changed:", password);

      try {
        // Show requirements if user is typing
        const requirementsDiv = document.getElementById("passwordRequirements");
        if (requirementsDiv && password.length > 0) {
          requirementsDiv.style.display = "block";
        }

        const isValid = updatePasswordRequirements(password);

        // Update input styling
        if (password.length > 0) {
          newPasswordInput.classList.remove("error", "success");
          newPasswordInput.classList.add(isValid ? "success" : "error");
        } else {
          newPasswordInput.classList.remove("error", "success");
        }

        // Update password match indicator if confirm password has value
        const confirmPasswordInput = document.getElementById(
          "confirmPasswordInput"
        );
        if (confirmPasswordInput && confirmPasswordInput.value) {
          updatePasswordMatchIndicator(password, confirmPasswordInput.value);
        }
      } catch (error) {
        console.error("Error in password validation:", error);
      }
    });
  } else {
    console.error("✗ New password input not found!");
  }

  if (confirmPasswordInput) {
    console.log("✓ Adding confirm password validation event listener");
    confirmPasswordInput.addEventListener("input", (e) => {
      const confirmPassword = e.target.value;
      const newPasswordInput = document.getElementById("newPasswordInput");
      const newPassword = newPasswordInput ? newPasswordInput.value : "";
      console.log("Confirm password input changed:", confirmPassword);

      try {
        updatePasswordMatchIndicator(newPassword, confirmPassword);
      } catch (error) {
        console.error("Error in confirm password validation:", error);
      }
    });
  } else {
    console.error("✗ Confirm password input not found!");
  }
}

function updatePasswordMatchIndicator(newPassword, confirmPassword) {
  console.log("Updating password match:", { newPassword, confirmPassword });

  const passwordMatchIndicator = document.getElementById(
    "passwordMatchIndicator"
  );
  const confirmPasswordInput = document.getElementById("confirmPasswordInput");

  if (!passwordMatchIndicator || !confirmPasswordInput) {
    console.error("Match indicator or confirm input not found!");
    return;
  }

  if (!confirmPassword || confirmPassword.length === 0) {
    passwordMatchIndicator.style.display = "none";
    confirmPasswordInput.classList.remove("error", "success");
    return;
  }

  passwordMatchIndicator.style.display = "block";
  const icon = passwordMatchIndicator.querySelector("i");
  const span = passwordMatchIndicator.querySelector("span");

  if (newPassword === confirmPassword && newPassword.length > 0) {
    passwordMatchIndicator.classList.add("success");
    passwordMatchIndicator.classList.remove("error");
    if (icon) icon.className = "fas fa-check";
    if (span) span.textContent = "Passwords match";
    confirmPasswordInput.classList.remove("error");
    confirmPasswordInput.classList.add("success");
    console.log("Passwords match!");
  } else {
    passwordMatchIndicator.classList.remove("success");
    passwordMatchIndicator.classList.add("error");
    if (icon) icon.className = "fas fa-times";
    if (span) span.textContent = "Passwords do not match";
    confirmPasswordInput.classList.remove("success");
    confirmPasswordInput.classList.add("error");
    console.log("Passwords do not match");
  }
}

function isPasswordValid(password) {
  const requirements = validatePassword(password);
  return Object.values(requirements).every((req) => req);
}

// Enhanced save functionality with password change
async function saveProfileChanges() {
  try {
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveBtn.disabled = true;

    // Collect basic form data
    const formData = {
      full_name: document.getElementById("fullNameInput").value,
      username: document.getElementById("usernameInput").value,
      bio: document.getElementById("bioInput").value,
    };

    // Get profile picture if changed
    const profilePictureElement = document.getElementById("profilePicture");
    if (
      profilePictureElement.src &&
      profilePictureElement.src.startsWith("data:image/")
    ) {
      formData.profile_picture = profilePictureElement.src;
    }

    // Handle password change if provided - get fresh references
    const currentPasswordInput = document.getElementById(
      "currentPasswordInput"
    );
    const newPasswordInput = document.getElementById("newPasswordInput");
    const confirmPasswordInput = document.getElementById(
      "confirmPasswordInput"
    );

    const currentPassword = currentPasswordInput
      ? currentPasswordInput.value
      : "";
    const newPassword = newPasswordInput ? newPasswordInput.value : "";
    const confirmPassword = confirmPasswordInput
      ? confirmPasswordInput.value
      : "";

    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword) {
        throw new Error("Current password is required to change password");
      }

      if (!newPassword) {
        throw new Error("New password is required");
      }

      if (!isPasswordValid(newPassword)) {
        throw new Error("New password does not meet requirements");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match");
      }

      formData.current_password = currentPassword;
      formData.new_password = newPassword;
    }

    console.log("Saving profile data:", {
      ...formData,
      current_password: "***",
      new_password: "***",
    });

    // Save through API
    await window.apiClient.updateProfile(formData);

    // Update navigation with new data
    if (typeof updateNavigation === "function") {
      await updateNavigation();
    }

    // Clear password fields on success
    if (currentPassword || newPassword) {
      if (currentPasswordInput) currentPasswordInput.value = "";
      if (newPasswordInput) newPasswordInput.value = "";
      if (confirmPasswordInput) confirmPasswordInput.value = "";

      // Hide validation indicators
      const requirementsDiv = document.getElementById("passwordRequirements");
      const matchIndicator = document.getElementById("passwordMatchIndicator");
      if (requirementsDiv) requirementsDiv.style.display = "none";
      if (matchIndicator) matchIndicator.style.display = "none";

      // Remove input styling
      if (newPasswordInput)
        newPasswordInput.classList.remove("error", "success");
      if (confirmPasswordInput)
        confirmPasswordInput.classList.remove("error", "success");

      // Reset requirements with proper icons
      document
        .querySelectorAll("#passwordRequirements .requirement")
        .forEach((req) => {
          req.classList.remove("valid");
          const icon = req.querySelector("i");
          if (icon) {
            icon.className = "fas fa-times";
          }
        });
    }

    saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
    setTimeout(() => {
      saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
      saveBtn.disabled = false;
      closeModal();
    }, 1000);
  } catch (error) {
    console.error("Failed to save profile:", error);
    saveBtn.innerHTML =
      '<i class="fas fa-exclamation-triangle"></i> Error saving';
    saveBtn.disabled = false;

    // Show error message
    alert(error.message || "Failed to save changes. Please try again.");

    setTimeout(() => {
      saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    }, 3000);
  }
}

// Smooth scrolling for mobile
function initializeSmoothScrolling() {
  const modalBody = document.querySelector(".modal-body");
  let isScrolling = false;

  modalBody.addEventListener("scroll", () => {
    if (!isScrolling) {
      window.requestAnimationFrame(() => {
        isScrolling = false;
      });
      isScrolling = true;
    }
  });
}

// Initialize everything
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Profile settings page initializing...");

  console.log("Initial password validation elements found:", {
    newPasswordInput: !!document.getElementById("newPasswordInput"),
    confirmPasswordInput: !!document.getElementById("confirmPasswordInput"),
    passwordRequirements: !!document.getElementById("passwordRequirements"),
    passwordMatchIndicator: !!document.getElementById("passwordMatchIndicator"),
  });

  initializeTheme();
  initializeSmoothScrolling();

  console.log("Profile settings initialization complete!");

  // Check authentication status
  if (window.apiClient) {
    await window.apiClient.auth.checkAuthStatus();
    if (!window.apiClient.auth.isAuthenticated()) {
      console.log("User not authenticated, redirecting to login...");
      window.location.href = "/welcome.html";
      return;
    }
  } else {
    console.log("API client not available, redirecting to login...");
    window.location.href = "/welcome.html";
    return;
  }

  // Save settings
  saveBtn.addEventListener("click", saveProfileChanges);

  // Setup password validation immediately and also with a delay
  setupPasswordValidation();

  // Also try after a short delay to ensure DOM is fully ready
  setTimeout(() => {
    console.log("Setting up password validation with delay...");
    setupPasswordValidation();
  }, 100);
});

// Add subtle animations on load
window.addEventListener("load", () => {
  document.querySelector(".demo-container").style.animation =
    "fadeInUp 0.8s ease forwards";
});

// Add CSS animation keyframes
const style = document.createElement("style");
style.textContent = `
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
document.head.appendChild(style);
