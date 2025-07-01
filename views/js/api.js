// API Configuration
const API_BASE_URL = window.location.origin;

// Authentication utilities
class AuthManager {
  constructor() {
    this.token = localStorage.getItem("auth_token");
    this.user = JSON.parse(localStorage.getItem("user_data") || "null");
  }

  isAuthenticated() {
    return !!this.token;
  }

  setAuth(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem("auth_token", token);
    localStorage.setItem("user_data", JSON.stringify(user));
  }

  clearAuth() {
    this.token = null;
    this.user = null;
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
  }

  getAuthHeaders() {
    if (!this.token) {
      return {};
    }
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };
  }

  async checkAuthStatus() {
    if (!this.token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const userData = await response.json();
        this.user = userData;
        localStorage.setItem("user_data", JSON.stringify(userData));
        return true;
      } else {
        this.clearAuth();
        return false;
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      return false;
    }
  }
}

// API Client
class APIClient {
  constructor() {
    this.auth = new AuthManager();
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    // For public endpoints (system stories), don't add auth headers
    const isPublicEndpoint =
      endpoint.includes("/system-stories") && !endpoint.includes("/admin/");

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...(isPublicEndpoint ? {} : this.auth.getAuthHeaders()),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401 && !isPublicEndpoint) {
        this.auth.clearAuth();
        this.showAuthRequiredMessage();
        throw new Error("Authentication required");
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Request failed:", error);
      throw error;
    }
  }

  // Authentication methods
  async login(username, password) {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Login failed");
    }

    const data = await response.json();

    // Get user info
    const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    });

    if (userResponse.ok) {
      const userData = await userResponse.json();
      this.auth.setAuth(data.access_token, userData);
      return userData;
    }

    throw new Error("Failed to get user information");
  }

  async register(username, email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email,
        password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Registration failed");
    }

    return await response.json();
  }

  logout() {
    this.auth.clearAuth();
    window.location.href = "/index.html";
  }

  // Password reset methods
  async requestPasswordReset(email) {
    const response = await fetch(
      `${API_BASE_URL}/auth/request-password-reset`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to send reset email");
    }

    return await response.json();
  }

  async resetPassword(token, newPassword) {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reset_token: token,
        new_password: newPassword,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to reset password");
    }

    return await response.json();
  }

  // Complete password reset flow for demo purposes
  async completePasswordReset(email, newPassword, confirmPassword) {
    if (newPassword !== confirmPassword) {
      throw new Error("Passwords do not match");
    }

    if (newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    // First, request the reset token
    const resetResponse = await this.requestPasswordReset(email);

    if (!resetResponse.reset_token) {
      throw new Error("Reset token not available in demo mode");
    }

    // Then, reset the password using the token
    return await this.resetPassword(resetResponse.reset_token, newPassword);
  }

  // Story generation methods
  async generateStory(prompt) {
    if (!this.auth.isAuthenticated()) {
      this.showAuthRequiredMessage();
      throw new Error("Authentication required");
    }

    return await this.makeRequest("/generate/content", {
      method: "POST",
      body: JSON.stringify({ text: prompt }),
    });
  }

  async getStoryHistory(limit = 10) {
    if (!this.auth.isAuthenticated()) {
      this.showAuthRequiredMessage();
      throw new Error("Authentication required");
    }

    return await this.makeRequest(`/generate/history?limit=${limit}`);
  }

  async getFavorites(limit = 10) {
    if (!this.auth.isAuthenticated()) {
      this.showAuthRequiredMessage();
      throw new Error("Authentication required");
    }

    return await this.makeRequest(`/generate/favorites?limit=${limit}`);
  }

  async toggleFavorite(contentId) {
    if (!this.auth.isAuthenticated()) {
      this.showAuthRequiredMessage();
      throw new Error("Authentication required");
    }

    return await this.makeRequest(`/generate/content/${contentId}/favorite`, {
      method: "POST",
    });
  }

  async deleteContent(contentId) {
    if (!this.auth.isAuthenticated()) {
      this.showAuthRequiredMessage();
      throw new Error("Authentication required");
    }

    return await this.makeRequest(`/generate/content/${contentId}`, {
      method: "DELETE",
    });
  }

  // Profile management methods
  async getProfile() {
    return await this.makeRequest("/auth/profile");
  }

  async updateProfile(profileData) {
    // Clean the profile data to ensure proper serialization
    const cleanedData = { ...profileData };

    // If profile_picture is provided and it's a data URL, ensure it's properly formatted
    if (
      cleanedData.profile_picture &&
      cleanedData.profile_picture.startsWith("data:image/")
    ) {
      // Keep as is - it's already a valid data URL
    } else if (cleanedData.profile_picture === "") {
      // Empty string means remove the picture
    } else if (
      cleanedData.profile_picture &&
      !cleanedData.profile_picture.startsWith("data:image/")
    ) {
      // If it's a URL (like the default avatar), remove it from the update
      delete cleanedData.profile_picture;
    }

    return await this.makeRequest("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(cleanedData),
    });
  }

  async changePassword(currentPassword, newPassword) {
    return await this.makeRequest("/auth/password", {
      method: "PUT",
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  }

  async deleteAccount(password) {
    return await this.makeRequest("/auth/account", {
      method: "DELETE",
      body: JSON.stringify({
        password: password,
      }),
    });
  }

  async getCurrentUser() {
    return await this.makeRequest("/auth/me");
  }

  // UI Helper methods
  showAuthRequiredMessage() {
    this.showModal(
      "Authentication Required",
      "You need to log in to generate stories. Please log in to continue.",
      [
        {
          text: "Login",
          action: () => (window.location.href = "/welcome.html"),
          primary: true,
        },
        {
          text: "Cancel",
          action: () => {},
          primary: false,
        },
      ]
    );
  }

  showModal(title, message, buttons = []) {
    // Remove existing modal if any
    const existingModal = document.querySelector(".auth-modal-overlay");
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal overlay
    const overlay = document.createElement("div");
    overlay.className = "auth-modal-overlay";
    overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

    // Create modal content
    const modal = document.createElement("div");
    modal.className = "auth-modal-content";
    modal.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 1rem;
            max-width: 500px;
            width: 90%;
            text-align: center;
            transform: scale(0.8);
            transition: transform 0.3s ease;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
        `;

    // Create modal HTML
    let buttonsHtml = "";
    if (buttons.length === 0) {
      buttonsHtml = `
                <button class="modal-btn modal-btn-primary" onclick="this.closest('.auth-modal-overlay').remove()">
                    OK
                </button>
            `;
    } else {
      buttonsHtml = buttons
        .map(
          (btn) => `
                <button class="modal-btn ${
                  btn.primary ? "modal-btn-primary" : "modal-btn-secondary"
                }" 
                        data-action="${btn.text}">
                    ${btn.text}
                </button>
            `
        )
        .join("");
    }

    modal.innerHTML = `
            <h2 style="margin-bottom: 1rem; color: #1f2937; font-size: 1.5rem;">${title}</h2>
            <p style="margin-bottom: 2rem; color: #6b7280; line-height: 1.6;">${message}</p>
            <div style="display: flex; gap: 1rem; justify-content: center;">
                ${buttonsHtml}
            </div>
        `;

    // Add button event listeners
    buttons.forEach((btn) => {
      const buttonEl = modal.querySelector(`[data-action="${btn.text}"]`);
      if (buttonEl) {
        buttonEl.addEventListener("click", () => {
          btn.action();
          overlay.remove();
        });
      }
    });

    // Add styles for modal buttons
    const style = document.createElement("style");
    style.textContent = `
            .modal-btn {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 0.5rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 1rem;
            }
            .modal-btn-primary {
                background: #2563eb;
                color: white;
            }
            .modal-btn-primary:hover {
                background: #1d4ed8;
                transform: translateY(-1px);
            }
            .modal-btn-secondary {
                background: #f3f4f6;
                color: #374151;
            }
            .modal-btn-secondary:hover {
                background: #e5e7eb;
            }
        `;
    document.head.appendChild(style);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Animate modal appearance
    setTimeout(() => {
      overlay.style.opacity = "1";
      modal.style.transform = "scale(1)";
    }, 10);

    // Close on overlay click
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        overlay.remove();
        document.removeEventListener("keydown", handleEscape);
      }
    };
    document.addEventListener("keydown", handleEscape);
  }

  showSuccessMessage(message) {
    this.showModal("Success", message);
  }

  showErrorMessage(message) {
    this.showModal("Error", message);
  }

  // Modern confirmation modal for delete actions
  showConfirmationModal(
    title,
    message,
    confirmText = "Delete",
    cancelText = "Cancel"
  ) {
    return new Promise((resolve) => {
      // Remove existing modal if any
      const existingModal = document.querySelector(
        ".delete-confirmation-modal"
      );
      if (existingModal) {
        existingModal.remove();
      }

      // Create modal overlay
      const overlay = document.createElement("div");
      overlay.className = "delete-confirmation-modal";
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10001;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;

      // Create modal content
      const modal = document.createElement("div");
      modal.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 16px;
        max-width: 500px;
        width: 90%;
        text-align: center;
        transform: scale(0.8);
        transition: all 0.3s ease;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
      `;

      modal.innerHTML = `
        <div style="color: #dc2626; font-size: 3rem; margin-bottom: 1rem;">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h2 style="margin-bottom: 1rem; color: #1f2937; font-size: 1.5rem; font-weight: 700;">${title}</h2>
        <p style="margin-bottom: 2rem; color: #6b7280; line-height: 1.6; white-space: pre-line;">${message}</p>
        <div style="display: flex; gap: 1rem; justify-content: center;">
          <button id="cancelConfirmBtn" style="
            padding: 0.75rem 1.5rem;
            border: 2px solid #e5e7eb;
            background: white;
            color: #374151;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 1rem;
          ">${cancelText}</button>
          <button id="confirmDeleteBtn" style="
            padding: 0.75rem 1.5rem;
            border: none;
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            color: white;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 1rem;
          ">${confirmText}</button>
        </div>
      `;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      // Add event listeners
      const cancelBtn = modal.querySelector("#cancelConfirmBtn");
      const confirmBtn = modal.querySelector("#confirmDeleteBtn");

      cancelBtn.addEventListener("click", () => {
        overlay.remove();
        resolve(false);
      });

      confirmBtn.addEventListener("click", () => {
        overlay.remove();
        resolve(true);
      });

      // Close on overlay click
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          overlay.remove();
          resolve(false);
        }
      });

      // Close on Escape key
      const handleEscape = (e) => {
        if (e.key === "Escape") {
          overlay.remove();
          document.removeEventListener("keydown", handleEscape);
          resolve(false);
        }
      };
      document.addEventListener("keydown", handleEscape);

      // Animate modal appearance
      setTimeout(() => {
        overlay.style.opacity = "1";
        modal.style.transform = "scale(1)";
      }, 10);

      // Add hover effects
      cancelBtn.addEventListener("mouseenter", () => {
        cancelBtn.style.background = "#f3f4f6";
      });
      cancelBtn.addEventListener("mouseleave", () => {
        cancelBtn.style.background = "white";
      });

      confirmBtn.addEventListener("mouseenter", () => {
        confirmBtn.style.transform = "translateY(-1px)";
        confirmBtn.style.boxShadow = "0 10px 25px rgba(220, 38, 38, 0.3)";
      });
      confirmBtn.addEventListener("mouseleave", () => {
        confirmBtn.style.transform = "translateY(0)";
        confirmBtn.style.boxShadow = "none";
      });
    });
  }

  // Utility function to get default avatar URL
  getDefaultAvatarUrl() {
    // SVG-based unknown user avatar that's more appropriate than the current photo
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjYwIiBjeT0iNjAiIHI9IjYwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjYwIiBjeT0iNDUiIHI9IjIwIiBmaWxsPSIjOUI5QkEzIi8+CjxwYXRoIGQ9Ik0yMCA5NkMyMCA4MS43OTA5IDMxLjc5MDkgNzAgNDYgNzBIODJDOTYuMjA5MSA3MCA5NCA4MS43OTA5IDk0IDk2VjEyMEgwVjk2SDIwWiIgZmlsbD0iIzlCOUJBMyIvPgo8L3N2Zz4K";
  }

  // System Stories Methods
  async getSystemStories(category = null) {
    const endpoint = category
      ? `/generate/system-stories?category=${category}`
      : "/generate/system-stories";

    return await this.makeRequest(endpoint, {
      method: "GET",
      headers: {}, // No auth required for public system stories
    });
  }

  async getTeachingStories() {
    return await this.getSystemStories("teaching");
  }

  async getRecommendedStories() {
    return await this.getSystemStories("recommended");
  }

  // Admin System Story Methods
  async createSystemStory(storyData) {
    if (!this.auth.isAuthenticated()) {
      this.showAuthRequiredMessage();
      throw new Error("Authentication required");
    }

    return await this.makeRequest("/generate/admin/system-story", {
      method: "POST",
      body: JSON.stringify(storyData),
    });
  }

  async getAdminSystemStories() {
    if (!this.auth.isAuthenticated()) {
      this.showAuthRequiredMessage();
      throw new Error("Authentication required");
    }

    return await this.makeRequest("/generate/admin/system-stories");
  }

  async deleteSystemStory(storyId) {
    if (!this.auth.isAuthenticated()) {
      this.showAuthRequiredMessage();
      throw new Error("Authentication required");
    }

    return await this.makeRequest(`/generate/admin/system-story/${storyId}`, {
      method: "DELETE",
    });
  }

  // Function to update profile pictures across the page
  async updateProfilePictures() {
    if (!this.auth.isAuthenticated()) {
      return;
    }

    try {
      // Get user profile with picture
      const profile = await this.getProfile();

      // Get the profile picture URL (use profile picture or default)
      const profilePictureUrl =
        profile.profile_picture || this.getDefaultAvatarUrl();

      // Update all profile picture elements on the page
      const profilePictureSelectors = [
        "#userAvatar",
        ".user-avatar",
        ".dropdown-avatar",
        "#currentAvatar",
        ".profile-picture", // This matches the navigation dropdown
      ];

      profilePictureSelectors.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element) => {
          if (element) {
            element.src = profilePictureUrl;
            element.onerror = () => {
              element.src = this.getDefaultAvatarUrl();
            };
          }
        });
      });

      // Also update user info if elements exist
      if (profile.username) {
        const usernameElements = document.querySelectorAll(
          "#userName, .user-name, #dropdownUserName, .dropdown-user-name, #currentUsername"
        );
        usernameElements.forEach((element) => {
          if (element) {
            element.textContent = profile.username;
          }
        });
      }

      if (profile.email) {
        const emailElements = document.querySelectorAll(
          "#dropdownUserEmail, .dropdown-user-email, #currentEmail"
        );
        emailElements.forEach((element) => {
          if (element) {
            element.textContent = profile.email;
          }
        });
      }
    } catch (error) {
      console.error("Failed to update profile pictures:", error);
    }
  }
}

// Create global API client instance
window.apiClient = new APIClient();

// Initialize authentication status on page load
document.addEventListener("DOMContentLoaded", async () => {
  await window.apiClient.auth.checkAuthStatus();
  await updateUIForAuthStatus();
});

// Update UI based on authentication status
async function updateUIForAuthStatus() {
  const isAuthenticated = window.apiClient.auth.isAuthenticated();
  const user = window.apiClient.auth.user;

  // Update login button
  const loginBtn = document.querySelector(".login-btn");
  const navProfile = document.getElementById("navProfile");

  if (loginBtn) {
    if (isAuthenticated && user) {
      loginBtn.style.display = "none";
      if (navProfile) {
        navProfile.style.display = "flex";
      }

      // Update profile pictures and user info dynamically
      await window.apiClient.updateProfilePictures();

      // Update the username directly in the navigation
      const userNameElement = document.querySelector(".user-name");
      if (userNameElement && user.username) {
        userNameElement.textContent = user.username;
      }

      // Update profile picture directly
      const profilePicElement = document.querySelector(".profile-picture");
      if (profilePicElement) {
        const profilePictureUrl =
          user.profile_picture || window.apiClient.getDefaultAvatarUrl();
        profilePicElement.src = profilePictureUrl;
        profilePicElement.onerror = () => {
          profilePicElement.src = window.apiClient.getDefaultAvatarUrl();
        };
      }
    } else {
      loginBtn.textContent = "Login";
      loginBtn.style.display = "block";
      if (navProfile) {
        navProfile.style.display = "none";
      }
      loginBtn.onclick = () => (window.location.href = "/welcome.html");
    }
  }
}

// Show user menu when authenticated
function showUserMenu() {
  const user = window.apiClient.auth.user;
  window.apiClient.showModal(
    `Welcome, ${user.username}!`,
    `Email: ${user.email}\nMember since: ${new Date(
      user.created_at || Date.now()
    ).toLocaleDateString()}`,
    [
      {
        text: "View Favorites",
        action: () => (window.location.href = "/favorites.html"),
        primary: false,
      },
      {
        text: "Logout",
        action: () => window.apiClient.logout(),
        primary: true,
      },
    ]
  );
}
