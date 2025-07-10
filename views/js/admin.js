let isAdmin = false;

// Page initialization
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Admin page DOM loaded, initializing...");

  try {
    // Wait a bit to ensure all elements are rendered
    await new Promise((resolve) => setTimeout(resolve, 100));

    await checkAdminAccess();
    await loadSystemStories();
    setupEventListeners();

    console.log("Admin page initialization completed");
  } catch (error) {
    console.error("Error during admin page initialization:", error);

    // Show error message to user if something goes wrong during initialization
    if (window.apiClient && window.apiClient.showErrorMessage) {
      window.apiClient.showErrorMessage(
        "Failed to initialize admin dashboard. Please refresh the page."
      );
    }
  }
});

async function checkAdminAccess() {
  const authWarning = document.getElementById("authWarning");
  const adminContent = document.querySelectorAll(".admin-section");

  try {
    // Ensure API client is available
    if (!window.apiClient) {
      console.error("API client not available");
      showAuthWarning();
      return;
    }

    if (!window.apiClient.auth.isAuthenticated()) {
      showAuthWarning();
      return;
    }

    // Get user profile to check admin status
    const profile = await window.apiClient.getProfile();
    isAdmin = profile.is_admin;

    if (!isAdmin) {
      showAuthWarning();
      return;
    }

    // Show admin content and update navigation
    if (authWarning) {
      authWarning.style.display = "none";
    }
    adminContent.forEach((section) => {
      if (section) {
        section.style.display = "block";
      }
    });
    await updateNavigation();
  } catch (error) {
    console.error("Admin access check failed:", error);
    showAuthWarning();
  }
}

function showAuthWarning() {
  const authWarning = document.getElementById("authWarning");
  const adminContent = document.querySelectorAll(".admin-section");

  if (authWarning) {
    authWarning.style.display = "block";
  }

  adminContent.forEach((section) => {
    if (section) {
      section.style.display = "none";
    }
  });
}

async function updateNavigation() {
  const loginBtn = document.querySelector(".login-btn");
  const navProfile = document.getElementById("navProfile");
  const adminLink = document.getElementById("adminLink");
  const userAvatar = document.getElementById("userAvatar");
  const userName = document.querySelector(".user-name");
  const dropdownUserName = document.getElementById("dropdownUserName");
  const dropdownUserEmail = document.getElementById("dropdownUserEmail");
  const dropdownAvatar = document.getElementById("dropdownAvatar");

  if (window.apiClient.auth.isAuthenticated()) {
    if (loginBtn) {
      loginBtn.style.display = "none";
    }
    if (navProfile) {
      navProfile.style.display = "flex";
    }

    // Update user information
    try {
      const profile = await window.apiClient.getProfile();

      // Update username
      if (userName && profile.username) {
        userName.textContent = profile.username;
      }

      // Update dropdown username and email
      if (dropdownUserName && profile.username) {
        dropdownUserName.textContent = profile.username;
      }

      if (dropdownUserEmail && profile.email) {
        dropdownUserEmail.textContent = profile.email;
      }

      // Update profile pictures
      const profilePictureUrl =
        profile.profile_picture || window.apiClient.getDefaultAvatarUrl();

      if (userAvatar) {
        userAvatar.src = profilePictureUrl;
        userAvatar.onerror = () => {
          userAvatar.src = window.apiClient.getDefaultAvatarUrl();
        };
      }

      if (dropdownAvatar) {
        dropdownAvatar.src = profilePictureUrl;
        dropdownAvatar.onerror = () => {
          dropdownAvatar.src = window.apiClient.getDefaultAvatarUrl();
        };
      }

      // Show/hide admin link
      if (isAdmin && adminLink) {
        adminLink.style.display = "block";
      }
    } catch (error) {
      console.error("Failed to update profile information:", error);
    }

    // Update all profile pictures
    await window.apiClient.updateProfilePictures();
  } else {
    if (loginBtn) {
      loginBtn.style.display = "block";
    }
    if (navProfile) {
      navProfile.style.display = "none";
    }
  }
}

async function loadSystemStories() {
  if (!isAdmin) return;

  const container = document.getElementById("storiesContainer");
  const loadingState = document.getElementById("loadingState");

  // Add null checks for DOM elements to prevent errors
  if (!container) {
    console.error("Stories container element not found");
    return;
  }

  try {
    // Only show loading state if the element exists
    if (loadingState) {
      loadingState.style.display = "flex";
    }

    const response = await window.apiClient.getAdminSystemStories();

    // Add null checks to prevent "can't read properties of null" error
    if (!response) {
      throw new Error("No response received from server");
    }

    const stories = response.stories || [];

    // Hide loading state if the element exists
    if (loadingState) {
      loadingState.style.display = "none";
    }

    if (stories.length === 0) {
      container.innerHTML =
        '<div class="empty-state">No system stories created yet.</div>';
    } else {
      displayStories(stories);
    }
  } catch (error) {
    console.error("Failed to load system stories:", error);

    // Hide loading state if the element exists
    if (loadingState) {
      loadingState.style.display = "none";
    }

    container.innerHTML =
      '<div class="empty-state">Failed to load stories.</div>';
  }
}

function displayStories(stories) {
  const container = document.getElementById("storiesContainer");

  // Add null check for container element
  if (!container) {
    console.error("Stories container element not found");
    return;
  }

  // Add null check to prevent errors
  if (!stories || !Array.isArray(stories)) {
    container.innerHTML =
      '<div class="empty-state">No stories available.</div>';
    return;
  }

  const grid = document.createElement("div");
  grid.className = "stories-grid";

  stories.forEach((story) => {
    if (story) {
      // Add null check for individual story
      const card = createStoryCard(story);
      if (card) {
        grid.appendChild(card);
      }
    }
  });

  container.innerHTML = "";
  container.appendChild(grid);
}

function createStoryCard(story) {
  const card = document.createElement("div");
  card.className = "admin-story-card";

  // Add null checks to prevent errors
  const title = story?.title || "Untitled Story";
  const category = story?.category || "unknown";
  const generatedText = story?.generated_text || "No content available";
  const storyId = story?.id || 0;

  card.innerHTML = `
          <div class="story-card-header">
            <h3 class="story-title">${title}</h3>
            <span class="story-category ${category}">${category}</span>
          </div>
          <div class="story-content">${generatedText}</div>
          <div class="story-actions">
            <button class="action-btn view-btn" onclick="viewStory(${storyId})">
              <i class="fas fa-eye"></i> View
            </button>
            <button class="action-btn delete-btn" onclick="deleteStory(${storyId})">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        `;

  return card;
}

function setupEventListeners() {
  // Create story form
  const form = document.getElementById("createStoryForm");
  if (form) {
    form.addEventListener("submit", handleCreateStory);
  } else {
    console.warn("Create story form not found");
  }

  // Navigation events
  const loginBtn = document.querySelector(".login-btn");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      window.location.href = "welcome.html";
    });
  }

  // User dropdown
  const userDropdownBtn = document.getElementById("userDropdownBtn");
  const userDropdownMenu = document.getElementById("userDropdownMenu");
  const dropdownArrow = document.querySelector(".dropdown-arrow");

  function toggleDropdown() {
    const isOpen = userDropdownMenu?.classList.contains("show");
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }

  function openDropdown() {
    if (userDropdownBtn) userDropdownBtn.classList.add("active");
    if (userDropdownMenu) userDropdownMenu.classList.add("show");
    if (dropdownArrow) dropdownArrow.style.transform = "rotate(180deg)";
    document.addEventListener("click", handleOutsideClick);
  }

  function closeDropdown() {
    if (userDropdownBtn) userDropdownBtn.classList.remove("active");
    if (userDropdownMenu) userDropdownMenu.classList.remove("show");
    if (dropdownArrow) dropdownArrow.style.transform = "";
    document.removeEventListener("click", handleOutsideClick);
  }

  function handleOutsideClick(event) {
    if (userDropdownBtn && !userDropdownBtn.contains(event.target)) {
      closeDropdown();
    }
  }

  if (userDropdownBtn && userDropdownMenu) {
    userDropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleDropdown();
    });
  }

  // Logout button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await window.apiClient.logout();
      window.location.href = "index.html";
    });
  }
}

async function handleCreateStory(e) {
  e.preventDefault();

  if (!isAdmin) {
    window.apiClient.showErrorMessage("Admin access required");
    return;
  }

  const titleElement = document.getElementById("storyTitle");
  const categoryElement = document.getElementById("storyCategory");
  const promptElement = document.getElementById("storyPrompt");
  const createBtn = document.getElementById("createBtn");

  // Add null checks for form elements
  if (!titleElement || !categoryElement || !promptElement || !createBtn) {
    console.error("Required form elements not found");
    window.apiClient.showErrorMessage(
      "Form elements not found. Please refresh the page."
    );
    return;
  }

  const title = titleElement.value.trim();
  const category = categoryElement.value;
  const prompt = promptElement.value.trim();

  if (!title || !category || !prompt) {
    window.apiClient.showErrorMessage("Please fill in all fields");
    return;
  }

  try {
    // Show loading state
    createBtn.disabled = true;
    createBtn.innerHTML = '<div class="loading-spinner"></div> Generating...';

    const storyData = {
      title: title,
      category: category,
      prompt: prompt,
    };

    console.log("Creating story with data:", storyData);

    const response = await window.apiClient.createSystemStory(storyData);

    console.log("Create story response:", response);

    // Check if the response indicates success
    if (
      response &&
      (response.id || response.message || response.success !== false)
    ) {
      window.apiClient.showSuccessMessage("System story created successfully!");

      // Reset form
      const form = document.getElementById("createStoryForm");
      if (form) {
        form.reset();
      }

      // Reload stories after successful creation
      await loadSystemStories();
    } else {
      throw new Error("Story creation failed - invalid response");
    }
  } catch (error) {
    console.error("Failed to create system story:", error);

    // Provide more specific error messages
    let errorMessage = "Failed to create system story";
    if (error.message) {
      if (error.message.includes("500")) {
        errorMessage =
          "Server error occurred while generating story. Please try again.";
      } else if (error.message.includes("403")) {
        errorMessage = "You don't have permission to create stories";
      } else if (error.message.includes("Authentication required")) {
        errorMessage = "Please log in to create stories";
      } else {
        errorMessage = error.message;
      }
    }

    window.apiClient.showErrorMessage(errorMessage);

    // Still reload stories in case the creation actually worked
    // This addresses the issue where creation works but shows error
    setTimeout(async () => {
      console.log(
        "Reloading stories after error to check if creation actually worked..."
      );
      await loadSystemStories();
    }, 2000);
  } finally {
    // Ensure button is re-enabled even if elements were null
    if (createBtn) {
      createBtn.disabled = false;
      createBtn.innerHTML =
        '<i class="fas fa-magic"></i> Generate System Story';
    }
  }
}

async function viewStory(storyId) {
  try {
    const response = await window.apiClient.getAdminSystemStories();

    // Add null checks to prevent errors
    if (!response || !response.stories) {
      window.apiClient.showErrorMessage("Failed to load story data");
      return;
    }

    const story = response.stories.find((s) => s && s.id === storyId);

    if (!story) {
      window.apiClient.showErrorMessage("Story not found");
      return;
    }

    const imageHtml = story.image_data
      ? `<img src="data:image/${story.image_format || "png"};base64,${
          story.image_data
        }" 
                  alt="${story.title || "Story Image"}" 
                  style="width: 100%; max-width: 500px; max-height: 400px; object-fit: contain; 
                         border-radius: 0.75rem; margin: 0 auto 1.5rem; display: block; 
                         box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); background: #f8fafc;" />`
      : "";

    const content = `
            <div style="text-align: center; margin-bottom: 1rem;">
              <h2 style="color: #1f2937; margin-bottom: 0.5rem; font-size: 1.25rem;">${
                story.title || "Untitled Story"
              }</h2>
              <p style="color: #6b7280; font-size: 0.9rem;">System Story • ${
                story.category || "unknown"
              }</p>
            </div>
            ${imageHtml}
            <div style="line-height: 1.8; color: #374151; font-size: 1rem; text-align: left; max-height: 50vh; overflow-y: auto;">
              ${story.generated_text || "No content available"}
            </div>
            <div style="margin-top: 1rem; padding: 0.75rem; background: #f9fafb; border-radius: 0.5rem; font-size: 0.9rem;">
              <strong>Prompt:</strong> ${story.prompt || "No prompt available"}
            </div>
          `;

    window.apiClient.showModal(story.title || "Story Details", content);
  } catch (error) {
    console.error("Failed to view story:", error);
    window.apiClient.showErrorMessage("Failed to load story details");
  }
}

async function deleteStory(storyId) {
  const confirmed = await window.apiClient.showConfirmationModal(
    "Delete System Story",
    "Are you sure you want to delete this system story? This action cannot be undone.",
    "Delete Story",
    "Cancel"
  );

  if (!confirmed) {
    return;
  }

  try {
    console.log(`Attempting to delete story with ID: ${storyId}`);

    const response = await window.apiClient.deleteSystemStory(storyId);

    console.log("Delete response:", response);

    // Check if the response indicates success
    if (response && (response.message || response.success !== false)) {
      window.apiClient.showSuccessMessage("System story deleted successfully");

      // Reload stories after successful deletion
      await loadSystemStories();
    } else {
      throw new Error("Deletion failed - invalid response");
    }
  } catch (error) {
    console.error("Failed to delete story:", error);

    // Provide more specific error messages
    let errorMessage = "Failed to delete story";
    if (error.message) {
      if (error.message.includes("404")) {
        errorMessage = "Story not found or already deleted";
      } else if (error.message.includes("403")) {
        errorMessage = "You don't have permission to delete this story";
      } else if (error.message.includes("Authentication required")) {
        errorMessage = "Please log in to delete stories";
      } else {
        errorMessage = error.message;
      }
    }

    window.apiClient.showErrorMessage(errorMessage);

    // Still reload stories in case the deletion actually worked
    // This addresses the issue where deletion works but shows error
    setTimeout(async () => {
      console.log(
        "Reloading stories after error to check if deletion actually worked..."
      );
      await loadSystemStories();
    }, 1000);
  }
}

// Add dropdown styles
const style = document.createElement("style");
style.textContent = `
        .user-dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          min-width: 200px;
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.3s ease;
          z-index: 1000;
        }

        .user-dropdown-menu.show {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .nav-profile {
          position: relative;
          cursor: pointer;
        }

        .user-dropdown {
          position: relative;
        }

        .user-dropdown-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 8px 12px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
          font-weight: 500;
          backdrop-filter: blur(10px);
        }

        .user-dropdown-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        .user-dropdown-btn.active {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .profile-info {
              display: flex;   
               align-items: center;
               gap: 8px;
               background: rgba(255, 255, 255, 0.1);
               border: 2px solid rgba(255, 255, 255, 0.2);
               color: white;
               padding: 8px 12px;
               border-radius: 12px;
               cursor: pointer;
               transition: all 0.3s ease;
               font-size: 14px;
               font-weight: 500;
               backdrop-filter: blur(10px);
        }

        .profile-info:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        .profile-picture {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }

        .user-name {
          font-weight: 600;
          color: white;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .dropdown-arrow {
          color: white;
          font-size: 0.8rem;
          transition: transform 0.3s ease;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 20px;
          background: none;
          border: none;
          color: #374151;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          font-family: inherit;
        }

        .dropdown-item:hover {
          background: #f9fafb;
          color: #4361ee;
        }

        .dropdown-item i {
          width: 16px;
          text-align: center;
          opacity: 0.7;
        }

        .dropdown-item:hover i {
          opacity: 1;
        }

        .logout-item {
          color: #dc2626;
        }

        .logout-item:hover {
          background: #fef2f2;
          color: #dc2626;
        }

        .loading-state {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 2rem;
          color: #6b7280;
        }
      `;
document.head.appendChild(style);
