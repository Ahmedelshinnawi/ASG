/**
 * Profile Settings Modal Component
 * A clean, intuitive profile settings modal for the Storytelling.ai platform
 */

class ProfileSettingsModal {
  constructor(options = {}) {
    this.options = {
      accentColor: options.accentColor || "#4361EE",
      darkMode: options.darkMode || false,
      apiEndpoint: options.apiEndpoint || "/api/profile",
      ...options,
    };

    this.isOpen = false;
    this.currentUser = null;
    this.profilePictureChanged = false;
    this.removedProfilePicture = false;

    this.init();
  }

  init() {
    this.injectStyles();
    this.createModal();
    this.attachEventListeners();
    this.loadUserData();
  }

  injectStyles() {
    const styleId = "profile-settings-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
            /* Profile Settings Modal Styles */
            :root {
                --profile-accent-color: ${this.options.accentColor};
                --profile-accent-hover: ${this.adjustColor(
                  this.options.accentColor,
                  -20
                )};
            }
            
            .profile-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .profile-modal-overlay.active {
                opacity: 1;
                visibility: visible;
            }
            
            .profile-settings-modal {
                background: var(--bg-primary, #ffffff);
                border-radius: 24px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                max-width: 600px;
                width: 90%;
                max-height: 95vh;
                overflow: hidden;
                transform: scale(0.9) translateY(20px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                border: 1px solid var(--border-color, #e5e7eb);
                display: flex;
                flex-direction: column;
            }
            
            .profile-modal-overlay.active .profile-settings-modal {
                transform: scale(1) translateY(0);
            }
            
            .profile-modal-header {
                background: linear-gradient(135deg, var(--profile-accent-color), var(--profile-accent-hover));
                color: white;
                padding: 24px 32px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                position: relative;
                overflow: hidden;
                flex-shrink: 0;
            }
            
            .profile-modal-header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="40" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="80" r="1.5" fill="rgba(255,255,255,0.1)"/></svg>') repeat;
                pointer-events: none;
            }
            
            .profile-header-content {
                display: flex;
                align-items: center;
                gap: 16px;
                position: relative;
                z-index: 1;
            }
            
            .profile-header-icon {
                width: 48px;
                height: 48px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                backdrop-filter: blur(10px);
            }
            
            .profile-header-title {
                font-size: 24px;
                font-weight: 700;
                margin-bottom: 4px;
            }
            
            .profile-header-subtitle {
                font-size: 14px;
                opacity: 0.9;
                font-weight: 400;
            }
            
            .profile-close-btn {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 18px;
                backdrop-filter: blur(10px);
                position: relative;
                z-index: 1;
            }
            
            .profile-close-btn:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: scale(1.05);
            }
            
            .profile-modal-body {
                padding: 0;
                overflow-y: auto;
                flex: 1;
                min-height: 0;
            }
            
            .profile-modal-body::-webkit-scrollbar {
                width: 6px;
            }
            
            .profile-modal-body::-webkit-scrollbar-thumb {
                background: var(--border-color, #e5e7eb);
                border-radius: 3px;
            }
            
            .profile-picture-section {
                padding: 32px;
                text-align: center;
                background: var(--bg-secondary, #f8fafc);
                border-bottom: 1px solid var(--border-color, #e5e7eb);
            }
            
            .profile-picture-container {
                position: relative;
                display: inline-block;
                margin-bottom: 20px;
            }
            
            .profile-picture {
                width: 120px;
                height: 120px;
                border-radius: 50%;
                object-fit: cover;
                border: 4px solid var(--profile-accent-color);
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                transition: all 0.3s ease;
            }
            
            .profile-picture-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 24px;
                opacity: 0;
                transition: all 0.3s ease;
                cursor: pointer;
            }
            
            .profile-picture-container:hover .profile-picture-overlay {
                opacity: 1;
            }
            
            .profile-picture-container:hover .profile-picture {
                transform: scale(1.05);
            }
            
            .profile-stats {
                display: flex;
                justify-content: center;
                gap: 24px;
                margin-top: 20px;
                padding: 20px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                backdrop-filter: blur(10px);
            }
            
            .profile-stat {
                text-align: center;
                flex: 1;
            }
            
            .profile-stat-value {
                font-size: 24px;
                font-weight: 700;
                color: var(--text-primary, #1f2937);
                margin-bottom: 4px;
            }
            
            .profile-stat-label {
                font-size: 12px;
                color: var(--text-secondary, #6b7280);
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .profile-settings-section {
                padding: 24px 32px;
                border-bottom: 1px solid var(--border-color, #e5e7eb);
            }
            
            .profile-settings-section:last-child {
                border-bottom: none;
            }
            
            .profile-section-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 20px;
            }
            
            .profile-section-icon {
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, var(--profile-accent-color), var(--profile-accent-hover));
                color: white;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
            }
            
            .profile-section-title {
                font-size: 18px;
                font-weight: 600;
                color: var(--text-primary, #1f2937);
            }
            
            .profile-form-group {
                margin-bottom: 20px;
            }
            
            .profile-form-label {
                display: block;
                font-size: 14px;
                font-weight: 500;
                color: var(--text-primary, #1f2937);
                margin-bottom: 8px;
            }
            
            .profile-form-input {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid var(--border-color, #e5e7eb);
                border-radius: 12px;
                font-size: 14px;
                background: var(--bg-primary, #ffffff);
                color: var(--text-primary, #1f2937);
                transition: all 0.3s ease;
                font-family: inherit;
            }
            
            .profile-form-input:focus {
                outline: none;
                border-color: var(--profile-accent-color);
                box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
            }
            
            .profile-toggle-group {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px 0;
            }
            
            .profile-toggle-info {
                flex: 1;
            }
            
            .profile-toggle-label {
                font-size: 14px;
                font-weight: 500;
                color: var(--text-primary, #1f2937);
                margin-bottom: 4px;
            }
            
            .profile-toggle-description {
                font-size: 12px;
                color: var(--text-secondary, #6b7280);
            }
            
            .profile-toggle-switch {
                position: relative;
                width: 52px;
                height: 28px;
                background: var(--border-color, #e5e7eb);
                border-radius: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
                border: none;
                outline: none;
            }
            
            .profile-toggle-switch.active {
                background: var(--profile-accent-color);
            }
            
            .profile-toggle-switch::before {
                content: '';
                position: absolute;
                top: 2px;
                left: 2px;
                width: 24px;
                height: 24px;
                background: white;
                border-radius: 50%;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
            
            .profile-toggle-switch.active::before {
                transform: translateX(24px);
            }
            
            .profile-modal-actions {
                padding: 24px 32px;
                background: var(--bg-secondary, #f8fafc);
                display: flex;
                gap: 12px;
                justify-content: flex-end;
                border-top: 1px solid var(--border-color, #e5e7eb);
                flex-shrink: 0;
            }
            
            .profile-btn {
                padding: 12px 24px;
                border-radius: 12px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                border: none;
                font-family: inherit;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .profile-btn-secondary {
                background: var(--bg-primary, #ffffff);
                color: var(--text-secondary, #6b7280);
                border: 2px solid var(--border-color, #e5e7eb);
            }
            
            .profile-btn-secondary:hover {
                background: var(--border-color, #e5e7eb);
                transform: translateY(-1px);
            }
            
            .profile-btn-primary {
                background: linear-gradient(135deg, var(--profile-accent-color), var(--profile-accent-hover));
                color: white;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            }
            
            .profile-btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            }
            
            .profile-btn-danger {
                background: linear-gradient(135deg, #dc2626, #b91c1c);
                color: white;
                box-shadow: 0 4px 6px rgba(220, 38, 38, 0.2);
            }
            
            .profile-btn-danger:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 25px rgba(220, 38, 38, 0.3);
            }
            
            .profile-danger-zone {
                border: 2px solid #fecaca;
                border-radius: 12px;
                padding: 20px;
                margin: 16px 0;
                background: #fef2f2;
            }
            
            .profile-danger-zone h4 {
                color: #dc2626;
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .profile-danger-zone p {
                color: #7f1d1d;
                font-size: 14px;
                margin-bottom: 16px;
                line-height: 1.5;
            }
            
            .profile-delete-form {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .profile-delete-form input {
                padding: 10px 12px;
                border: 2px solid #fca5a5;
                border-radius: 8px;
                font-size: 14px;
                background: white;
                color: #7f1d1d;
            }
            
            .profile-delete-form input:focus {
                outline: none;
                border-color: #dc2626;
                box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
            }
            
            .profile-delete-form input::placeholder {
                color: #fca5a5;
            }
            
            @media (max-width: 768px) {
                .profile-settings-modal {
                    width: 95%;
                    max-height: 98vh;
                    border-radius: 20px;
                }
                
                .profile-modal-header {
                    padding: 20px 24px;
                }
                
                .profile-settings-section {
                    padding: 20px 24px;
                }
                
                .profile-modal-actions {
                    padding: 20px 24px;
                    flex-direction: column-reverse;
                    gap: 12px;
                }
                
                .profile-btn {
                    width: 100%;
                    justify-content: center;
                }
                
                .profile-picture {
                    width: 100px;
                    height: 100px;
                }
            }
        `;

    document.head.appendChild(style);
  }

  createModal() {
    const modalHTML = `
            <div class="profile-modal-overlay" id="profileSettingsModal">
                <div class="profile-settings-modal">
                    <div class="profile-modal-header">
                        <div class="profile-header-content">
                            <div class="profile-header-icon">
                                <i class="fas fa-user-cog"></i>
                            </div>
                            <div>
                                <h2 class="profile-header-title">Profile Settings</h2>
                                <p class="profile-header-subtitle">Manage your account preferences</p>
                            </div>
                        </div>
                        <button class="profile-close-btn" id="profileCloseBtn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="profile-modal-body">
                        <div class="profile-picture-section">
                            <div class="profile-picture-container">
                                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjYwIiBjeT0iNjAiIHI9IjYwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjYwIiBjeT0iNDUiIHI9IjIwIiBmaWxsPSIjOUI5QkEzIi8+CjxwYXRoIGQ9Ik0yMCA5NkMyMCA4MS43OTA5IDMxLjc5MDkgNzAgNDYgNzBIODJDOTYuMjA5MSA3MCA5NCA4MS43OTA5IDk0IDk2VjEyMEgwVjk2SDIwWiIgZmlsbD0iIzlCOUJBMyIvPgo8L3N2Zz4K" alt="Profile Picture" class="profile-picture" id="profilePicture">
                                <div class="profile-picture-overlay">
                                    <i class="fas fa-camera"></i>
                                </div>
                                <input type="file" id="profilePictureInput" accept="image/*" style="display: none;">
                            </div>
                            <p style="color: var(--text-secondary, #6b7280); font-size: 14px; margin-top: 8px; margin-bottom: 16px;">
                                Click to change profile picture<br>
                                <small style="font-size: 12px; opacity: 0.8;">Right-click for more options • Max 5MB • JPEG, PNG, GIF, WebP</small>
                            </p>
                            
                            <!-- User Statistics -->
                            <div class="profile-stats">
                                <div class="profile-stat">
                                    <div class="profile-stat-value" id="totalStories">0</div>
                                    <div class="profile-stat-label">Total Stories</div>
                                </div>
                                <div class="profile-stat">
                                    <div class="profile-stat-value" id="favoriteStories">0</div>
                                    <div class="profile-stat-label">Favorites</div>
                                </div>
                                <div class="profile-stat">
                                    <div class="profile-stat-value" id="memberSince">-</div>
                                    <div class="profile-stat-label">Member Since</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="profile-settings-section">
                            <div class="profile-section-header">
                                <div class="profile-section-icon">
                                    <i class="fas fa-user"></i>
                                </div>
                                <h3 class="profile-section-title">Basic Information</h3>
                            </div>
                            
                            <div class="profile-form-group">
                                <label class="profile-form-label">Username</label>
                                <input type="text" class="profile-form-input" id="username" placeholder="Enter your username">
                            </div>
                            
                            <div class="profile-form-group">
                                <label class="profile-form-label">Full Name</label>
                                <input type="text" class="profile-form-input" id="fullName" placeholder="Enter your full name">
                            </div>
                            
                            <div class="profile-form-group">
                                <label class="profile-form-label">Email Address</label>
                                <input type="email" class="profile-form-input" id="email" placeholder="Enter your email">
                            </div>
                        </div>
                        
                        <div class="profile-settings-section">
                            <div class="profile-section-header">
                                <div class="profile-section-icon">
                                    <i class="fas fa-lock"></i>
                                </div>
                                <h3 class="profile-section-title">Security</h3>
                            </div>
                            
                            <div class="profile-form-group">
                                <label class="profile-form-label">Current Password</label>
                                <input type="password" class="profile-form-input" id="currentPassword" placeholder="Enter current password">
                            </div>
                            
                            <div class="profile-form-group">
                                <label class="profile-form-label">New Password</label>
                                <input type="password" class="profile-form-input" id="newPassword" placeholder="Enter new password">
                            </div>
                            
                            <div class="profile-form-group">
                                <label class="profile-form-label">Confirm New Password</label>
                                <input type="password" class="profile-form-input" id="confirmPassword" placeholder="Confirm new password">
                            </div>
                        </div>
                        
                        <div class="profile-settings-section">
                            <div class="profile-section-header">
                                <div class="profile-section-icon">
                                    <i class="fas fa-shield-alt"></i>
                                </div>
                                <h3 class="profile-section-title">Privacy Settings</h3>
                            </div>
                            
                            <div class="profile-toggle-group">
                                <div class="profile-toggle-info">
                                    <div class="profile-toggle-label">Profile Visibility</div>
                                    <div class="profile-toggle-description">Make your profile visible to other users</div>
                                </div>
                                <button class="profile-toggle-switch" data-setting="profileVisibility"></button>
                            </div>
                            
                            <div class="profile-toggle-group">
                                <div class="profile-toggle-info">
                                    <div class="profile-toggle-label">Story Sharing</div>
                                    <div class="profile-toggle-description">Allow others to view your public stories</div>
                                </div>
                                <button class="profile-toggle-switch" data-setting="storySharing"></button>
                            </div>
                        </div>
                        
                        <div class="profile-settings-section">
                            <div class="profile-section-header">
                                <div class="profile-section-icon">
                                    <i class="fas fa-cog"></i>
                                </div>
                                <h3 class="profile-section-title">Account Preferences</h3>
                            </div>
                            
                            <div class="profile-toggle-group">
                                <div class="profile-toggle-info">
                                    <div class="profile-toggle-label">Email Notifications</div>
                                    <div class="profile-toggle-description">Receive updates about your stories and account</div>
                                </div>
                                <button class="profile-toggle-switch active" data-setting="emailNotifications"></button>
                            </div>
                            
                            <div class="profile-toggle-group">
                                <div class="profile-toggle-info">
                                    <div class="profile-toggle-label">Auto-Save Stories</div>
                                    <div class="profile-toggle-description">Automatically save stories as you create them</div>
                                </div>
                                <button class="profile-toggle-switch active" data-setting="autoSave"></button>
                            </div>
                        </div>
                        
                        <div class="profile-settings-section">
                            <div class="profile-section-header">
                                <div class="profile-section-icon" style="background: linear-gradient(135deg, #dc2626, #b91c1c);">
                                    <i class="fas fa-exclamation-triangle"></i>
                                </div>
                                <h3 class="profile-section-title">Danger Zone</h3>
                            </div>
                            
                            <div class="profile-danger-zone">
                                <h4>
                                    <i class="fas fa-trash-alt"></i>
                                    Delete Account
                                </h4>
                                <p>
                                    Once you delete your account, there is no going back. This will permanently delete your account, 
                                    all your stories, favorites, and associated data. Please be certain.
                                </p>
                                <div class="profile-delete-form">
                                    <input 
                                        type="password" 
                                        id="deleteAccountPassword" 
                                        placeholder="Enter your password to confirm deletion"
                                        class="profile-form-input"
                                        style="border-color: #fca5a5; background: white;"
                                    >
                                    <button 
                                        class="profile-btn profile-btn-danger" 
                                        id="deleteAccountBtn"
                                        style="align-self: flex-start;"
                                    >
                                        <i class="fas fa-trash-alt"></i>
                                        Delete My Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="profile-modal-actions">
                        <button class="profile-btn profile-btn-secondary" id="profileCancelBtn">
                            <i class="fas fa-times"></i>
                            Cancel
                        </button>
                        <button class="profile-btn profile-btn-primary" id="profileSaveBtn">
                            <i class="fas fa-save"></i>
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    this.modal = document.getElementById("profileSettingsModal");
  }

  attachEventListeners() {
    const closeBtn = document.getElementById("profileCloseBtn");
    const cancelBtn = document.getElementById("profileCancelBtn");
    const saveBtn = document.getElementById("profileSaveBtn");

    // Close modal events
    closeBtn?.addEventListener("click", () => this.close());
    cancelBtn?.addEventListener("click", () => this.close());

    // Close on overlay click
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) this.close();
    });

    // Close on ESC key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) this.close();
    });

    // Save button
    saveBtn?.addEventListener("click", () => this.saveSettings());

    // Profile picture upload
    const pictureContainer = document.querySelector(
      ".profile-picture-container"
    );
    const pictureInput = document.getElementById("profilePictureInput");
    const pictureElement = document.getElementById("profilePicture");

    pictureContainer?.addEventListener("click", () => pictureInput.click());

    pictureInput?.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleProfilePictureUpload(file);
      }
    });

    // Add right-click context menu for profile picture removal
    pictureContainer?.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.showProfilePictureContextMenu(e);
    });

    // Toggle switches
    document.querySelectorAll(".profile-toggle-switch").forEach((toggle) => {
      toggle.addEventListener("click", () => {
        toggle.classList.toggle("active");

        // Haptic feedback on mobile
        if ("vibrate" in navigator) {
          navigator.vibrate(50);
        }
      });
    });

    // Delete account button
    const deleteAccountBtn = document.getElementById("deleteAccountBtn");
    deleteAccountBtn?.addEventListener("click", () =>
      this.handleDeleteAccount()
    );
  }

  async loadUserData() {
    try {
      // Check if apiClient is available (from your existing auth system)
      if (window.apiClient && window.apiClient.auth.isAuthenticated()) {
        // Use your existing API to get user data with stats
        const userData = await window.apiClient.getProfile();
        this.populateUserData(userData);
      } else {
        // Only redirect to login if not on index/home page
        const currentPath = window.location.pathname;
        if (currentPath !== "/" && currentPath !== "/index.html") {
          window.location.href = "/welcome.html";
        }
        // If on home page, just don't load profile data
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
      if (error.message.includes("Authentication required")) {
        // Only redirect to login if not on index/home page
        const currentPath = window.location.pathname;
        if (currentPath !== "/" && currentPath !== "/index.html") {
          window.location.href = "/welcome.html";
        }
      }
    }
  }

  populateUserData(userData) {
    // Basic information
    document.getElementById("username").value = userData.username || "";
    document.getElementById("fullName").value = userData.full_name || "";
    document.getElementById("email").value = userData.email || "";

    // Profile picture
    const profilePicture = document.getElementById("profilePicture");
    if (userData.profile_picture) {
      profilePicture.src = userData.profile_picture;
    } else {
      // Use default unknown user avatar
      profilePicture.src =
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjYwIiBjeT0iNjAiIHI9IjYwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjYwIiBjeT0iNDUiIHI9IjIwIiBmaWxsPSIjOUI5QkEzIi8+CjxwYXRoIGQ9Ik0yMCA5NkMyMCA4MS43OTA5IDMxLjc5MDkgNzAgNDYgNzBIODJDOTYuMjA5MSA3MCA5NCA4MS43OTA5IDk0IDk2VjEyMEgwVjk2SDIwWiIgZmlsbD0iIzlCOUJBMyIvPgo8L3N2Zz4K";
    }

    // Statistics
    document.getElementById("totalStories").textContent =
      userData.total_stories || 0;
    document.getElementById("favoriteStories").textContent =
      userData.favorite_stories || 0;

    // Format member since date
    if (userData.created_at) {
      const createdDate = new Date(userData.created_at);
      const formattedDate = createdDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
      document.getElementById("memberSince").textContent = formattedDate;
    }

    // Set toggle states (default values for now, can be extended later)
    const defaultSettings = {
      profileVisibility: true,
      storySharing: true,
      emailNotifications: true,
      autoSave: true,
    };

    Object.entries(defaultSettings).forEach(([key, value]) => {
      const toggle = document.querySelector(`[data-setting="${key}"]`);
      if (toggle) {
        toggle.classList.toggle("active", value);
      }
    });

    this.currentUser = userData;
  }

  async saveSettings() {
    const saveBtn = document.getElementById("profileSaveBtn");
    const originalHTML = saveBtn.innerHTML;

    try {
      // Show loading state
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
      saveBtn.disabled = true;

      // Validate password fields
      const currentPassword = document.getElementById("currentPassword").value;
      const newPassword = document.getElementById("newPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      if (newPassword && newPassword !== confirmPassword) {
        throw new Error("New passwords do not match");
      }

      if (newPassword && newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      // Collect form data
      const formData = {
        username: document.getElementById("username").value,
        full_name: document.getElementById("fullName").value,
        email: document.getElementById("email").value,
      };

      // Add password fields if provided
      if (currentPassword && newPassword) {
        formData.current_password = currentPassword;
        formData.new_password = newPassword;
      }

      // Add profile picture if it was changed
      const profilePicture = document.getElementById("profilePicture");
      if (this.profilePictureChanged) {
        if (this.removedProfilePicture) {
          formData.profile_picture = ""; // Empty string to remove picture
        } else {
          formData.profile_picture = profilePicture.src;
        }
      }

      // Save via API
      if (window.apiClient && window.apiClient.auth.isAuthenticated()) {
        await this.saveToAPI(formData);
      } else {
        throw new Error("Authentication required");
      }

      // Show success state
      saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';

      // Clear password fields
      document.getElementById("currentPassword").value = "";
      document.getElementById("newPassword").value = "";
      document.getElementById("confirmPassword").value = "";

      // Reset profile picture change flag
      this.profilePictureChanged = false;
      this.removedProfilePicture = false;

      // Trigger custom event for other components to listen to
      window.dispatchEvent(
        new CustomEvent("profileUpdated", { detail: formData })
      );

      setTimeout(() => {
        saveBtn.innerHTML = originalHTML;
        saveBtn.disabled = false;
        this.close();
      }, 1000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      saveBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';

      // Show error message to user
      this.showError(error.message);

      setTimeout(() => {
        saveBtn.innerHTML = originalHTML;
        saveBtn.disabled = false;
      }, 2000);
    }
  }

  async saveToAPI(formData) {
    try {
      // Update profile information
      const updatedProfile = await window.apiClient.updateProfile(formData);

      // Update local user data
      if (window.apiClient.auth.user) {
        window.apiClient.auth.user.username = updatedProfile.username;
        window.apiClient.auth.user.email = updatedProfile.email;
        localStorage.setItem(
          "user_data",
          JSON.stringify(window.apiClient.auth.user)
        );
      }

      return updatedProfile;
    } catch (error) {
      throw new Error(error.message || "Failed to save profile settings");
    }
  }

  showError(message) {
    // Create or update error message element
    let errorElement = document.getElementById("profileErrorMessage");
    if (!errorElement) {
      errorElement = document.createElement("div");
      errorElement.id = "profileErrorMessage";
      errorElement.style.cssText = `
        background: #fef2f2;
        color: #dc2626;
        padding: 12px 16px;
        border-radius: 8px;
        margin: 16px 32px;
        border: 1px solid #fecaca;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
      `;

      const modalBody = document.querySelector(".profile-modal-body");
      modalBody.insertBefore(errorElement, modalBody.firstChild);
    }

    errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;

    // Remove error message after 5 seconds
    setTimeout(() => {
      if (errorElement.parentNode) {
        errorElement.parentNode.removeChild(errorElement);
      }
    }, 5000);
  }

  open() {
    this.isOpen = true;
    this.modal.classList.add("active");
    document.body.style.overflow = "hidden";

    // Load fresh user data when opening
    this.loadUserData();
  }

  close() {
    this.isOpen = false;
    this.modal.classList.remove("active");
    document.body.style.overflow = "";
  }

  // Utility method to adjust color brightness
  adjustColor(color, amount) {
    const usePound = color[0] === "#";
    const col = usePound ? color.slice(1) : color;
    const num = parseInt(col, 16);
    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00ff) + amount;
    let b = (num & 0x0000ff) + amount;
    r = r > 255 ? 255 : r < 0 ? 0 : r;
    g = g > 255 ? 255 : g < 0 ? 0 : g;
    b = b > 255 ? 255 : b < 0 ? 0 : b;
    return (
      (usePound ? "#" : "") +
      ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")
    );
  }

  handleProfilePictureUpload(file) {
    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      this.showError(
        "Please upload a valid image file (JPEG, PNG, GIF, or WebP)"
      );
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      this.showError("Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.resizeImage(e.target.result, 300, 300, (resizedDataUrl) => {
        const pictureElement = document.getElementById("profilePicture");
        pictureElement.src = resizedDataUrl;
        this.profilePictureChanged = true;
      });
    };
    reader.readAsDataURL(file);
  }

  resizeImage(dataUrl, maxWidth, maxHeight, callback) {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Calculate new dimensions
      let { width, height } = img;
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and resize image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to base64 with reduced quality for smaller file size
      const resizedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
      callback(resizedDataUrl);
    };
    img.src = dataUrl;
  }

  showProfilePictureContextMenu(e) {
    // Remove existing context menu
    const existingMenu = document.querySelector(
      ".profile-picture-context-menu"
    );
    if (existingMenu) {
      existingMenu.remove();
    }

    const contextMenu = document.createElement("div");
    contextMenu.className = "profile-picture-context-menu";
    contextMenu.style.cssText = `
      position: fixed;
      top: ${e.clientY}px;
      left: ${e.clientX}px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      min-width: 150px;
      overflow: hidden;
    `;

    const menuItems = [
      {
        icon: "fas fa-upload",
        text: "Upload New Photo",
        action: () => {
          document.getElementById("profilePictureInput").click();
          contextMenu.remove();
        },
      },
      {
        icon: "fas fa-trash",
        text: "Remove Photo",
        action: () => {
          this.removeProfilePicture();
          contextMenu.remove();
        },
      },
    ];

    menuItems.forEach((item) => {
      const menuItem = document.createElement("div");
      menuItem.style.cssText = `
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        transition: background-color 0.2s;
        font-size: 14px;
        color: #374151;
      `;

      menuItem.innerHTML = `<i class="${item.icon}"></i> ${item.text}`;

      menuItem.addEventListener("mouseenter", () => {
        menuItem.style.backgroundColor = "#f3f4f6";
      });

      menuItem.addEventListener("mouseleave", () => {
        menuItem.style.backgroundColor = "transparent";
      });

      menuItem.addEventListener("click", item.action);

      contextMenu.appendChild(menuItem);
    });

    document.body.appendChild(contextMenu);

    // Remove context menu when clicking elsewhere
    const removeMenu = (e) => {
      if (!contextMenu.contains(e.target)) {
        contextMenu.remove();
        document.removeEventListener("click", removeMenu);
      }
    };

    setTimeout(() => {
      document.addEventListener("click", removeMenu);
    }, 10);
  }

  removeProfilePicture() {
    const pictureElement = document.getElementById("profilePicture");
    pictureElement.src =
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjYwIiBjeT0iNjAiIHI9IjYwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjYwIiBjeT0iNDUiIHI9IjIwIiBmaWxsPSIjOUI5QkEzIi8+CjxwYXRoIGQ9Ik0yMCA5NkMyMCA4MS43OTA5IDMxLjc5MDkgNzAgNDYgNzBIODJDOTYuMjA5MSA3MCA5NCA4MS43OTA5IDk0IDk2VjEyMEgwVjY5SDIwWiIgZmlsbD0iIzlCOUJBMyIvPgo8L3N2Zz4K";
    this.profilePictureChanged = true;
    this.removedProfilePicture = true;
  }

  async handleDeleteAccount() {
    const deleteAccountBtn = document.getElementById("deleteAccountBtn");
    const passwordInput = document.getElementById("deleteAccountPassword");
    const password = passwordInput.value.trim();

    // Validate password input
    if (!password) {
      this.showError("Please enter your password to delete your account");
      passwordInput.focus();
      return;
    }

    // Show modern confirmation modal instead of browser alert
    const confirmed = await this.showConfirmationModal(
      "Delete Account",
      "⚠️ This action cannot be undone!\n\nYour account and ALL data will be permanently deleted:\n• All your stories and content\n• Your favorites and preferences\n• Your profile and account information\n\nAre you sure you want to delete your account?",
      "Delete Account",
      "Cancel"
    );

    if (!confirmed) {
      return;
    }

    const originalHTML = deleteAccountBtn.innerHTML;

    try {
      // Show loading state
      deleteAccountBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Deleting Account...';
      deleteAccountBtn.disabled = true;

      // Call API to delete account
      if (window.apiClient && window.apiClient.auth.isAuthenticated()) {
        await window.apiClient.deleteAccount(password);

        // Show success message with modern UI
        await this.showSuccessModal(
          "Account Deleted",
          "Your account has been successfully deleted. You will now be redirected to the home page."
        );

        // Clear authentication and redirect
        window.apiClient.auth.clearAuth();
        window.location.href = "/";
      } else {
        throw new Error("Authentication required");
      }
    } catch (error) {
      console.error("Failed to delete account:", error);

      // Show error message
      let errorMessage = "Failed to delete account. ";
      if (error.message.includes("Password is incorrect")) {
        errorMessage += "The password you entered is incorrect.";
        passwordInput.focus();
        passwordInput.select();
      } else {
        errorMessage += error.message || "Please try again.";
      }

      this.showError(errorMessage);

      // Restore button state
      deleteAccountBtn.innerHTML = originalHTML;
      deleteAccountBtn.disabled = false;
    }
  }

  // Modern confirmation modal
  showConfirmationModal(title, message, confirmText, cancelText) {
    return new Promise((resolve) => {
      // Remove existing modal if any
      const existingModal = document.querySelector(
        ".modern-confirmation-modal"
      );
      if (existingModal) {
        existingModal.remove();
      }

      // Create modal overlay
      const overlay = document.createElement("div");
      overlay.className = "modern-confirmation-modal";
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

  // Modern success modal
  showSuccessModal(title, message) {
    return new Promise((resolve) => {
      // Remove existing modal if any
      const existingModal = document.querySelector(".modern-success-modal");
      if (existingModal) {
        existingModal.remove();
      }

      // Create modal overlay
      const overlay = document.createElement("div");
      overlay.className = "modern-success-modal";
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
        max-width: 400px;
        width: 90%;
        text-align: center;
        transform: scale(0.8);
        transition: all 0.3s ease;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
      `;

      modal.innerHTML = `
        <div style="color: #059669; font-size: 3rem; margin-bottom: 1rem;">
          <i class="fas fa-check-circle"></i>
        </div>
        <h2 style="margin-bottom: 1rem; color: #1f2937; font-size: 1.5rem; font-weight: 700;">${title}</h2>
        <p style="margin-bottom: 2rem; color: #6b7280; line-height: 1.6;">${message}</p>
        <button id="successOkBtn" style="
          padding: 0.75rem 1.5rem;
          border: none;
          background: linear-gradient(135deg, #059669, #047857);
          color: white;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1rem;
        ">OK</button>
      `;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      // Add event listener
      const okBtn = modal.querySelector("#successOkBtn");
      okBtn.addEventListener("click", () => {
        overlay.remove();
        resolve(true);
      });

      // Close on overlay click
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          overlay.remove();
          resolve(true);
        }
      });

      // Animate modal appearance
      setTimeout(() => {
        overlay.style.opacity = "1";
        modal.style.transform = "scale(1)";
      }, 10);

      // Add hover effect
      okBtn.addEventListener("mouseenter", () => {
        okBtn.style.transform = "translateY(-1px)";
        okBtn.style.boxShadow = "0 10px 25px rgba(5, 150, 105, 0.3)";
      });
      okBtn.addEventListener("mouseleave", () => {
        okBtn.style.transform = "translateY(0)";
        okBtn.style.boxShadow = "none";
      });
    });
  }
}

// Auto-initialize if DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.profileSettingsModal = new ProfileSettingsModal();
  });
} else {
  window.profileSettingsModal = new ProfileSettingsModal();
}

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = ProfileSettingsModal;
}
