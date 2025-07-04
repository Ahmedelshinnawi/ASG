let isAdmin = false;

// Page initialization
document.addEventListener("DOMContentLoaded", async () => {
  await checkAdminAccess();
  await loadSystemStories();
  setupEventListeners();
});

async function checkAdminAccess() {
  const authWarning = document.getElementById("authWarning");
  const adminContent = document.querySelectorAll(".admin-section");

  try {
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
    authWarning.style.display = "none";
    adminContent.forEach((section) => (section.style.display = "block"));
    await updateNavigation();
  } catch (error) {
    console.error("Admin access check failed:", error);
    showAuthWarning();
  }
}

function showAuthWarning() {
  const authWarning = document.getElementById("authWarning");
  const adminContent = document.querySelectorAll(".admin-section");

  authWarning.style.display = "block";
  adminContent.forEach((section) => (section.style.display = "none"));
}

async function updateNavigation() {
  const loginBtn = document.querySelector(".login-btn");
  const navProfile = document.getElementById("navProfile");
  const adminLink = document.getElementById("adminLink");

  if (window.apiClient.auth.isAuthenticated()) {
    loginBtn.style.display = "none";
    navProfile.style.display = "flex";

    if (isAdmin) {
      adminLink.style.display = "block";
    }

    await window.apiClient.updateProfilePictures();
  } else {
    loginBtn.style.display = "block";
    navProfile.style.display = "none";
  }
}

async function loadSystemStories() {
  if (!isAdmin) return;

  const container = document.getElementById("storiesContainer");
  const loadingState = document.getElementById("loadingState");

  try {
    loadingState.style.display = "flex";

    const response = await window.apiClient.getAdminSystemStories();
    const stories = response.stories;

    loadingState.style.display = "none";

    if (stories.length === 0) {
      container.innerHTML =
        '<div class="empty-state">No system stories created yet.</div>';
    } else {
      displayStories(stories);
    }
  } catch (error) {
    console.error("Failed to load system stories:", error);
    loadingState.style.display = "none";
    container.innerHTML =
      '<div class="empty-state">Failed to load stories.</div>';
  }
}

function displayStories(stories) {
  const container = document.getElementById("storiesContainer");
  const grid = document.createElement("div");
  grid.className = "stories-grid";

  stories.forEach((story) => {
    const card = createStoryCard(story);
    grid.appendChild(card);
  });

  container.innerHTML = "";
  container.appendChild(grid);
}

function createStoryCard(story) {
  const card = document.createElement("div");
  card.className = "admin-story-card";

  card.innerHTML = `
          <div class="story-card-header">
            <h3 class="story-title">${story.title}</h3>
            <span class="story-category ${story.category}">${story.category}</span>
          </div>
          <div class="story-content">${story.generated_text}</div>
          <div class="story-actions">
            <button class="action-btn view-btn" onclick="viewStory(${story.id})">
              <i class="fas fa-eye"></i> View
            </button>
            <button class="action-btn delete-btn" onclick="deleteStory(${story.id})">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        `;

  return card;
}

function setupEventListeners() {
  // Create story form
  const form = document.getElementById("createStoryForm");
  form.addEventListener("submit", handleCreateStory);

  // Navigation events
  const loginBtn = document.querySelector(".login-btn");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      window.location.href = "welcome.html";
    });
  }

  // User dropdown
  const userDropdownBtn = document.getElementById("navProfile");
  const userDropdownMenu = document.getElementById("userDropdownMenu");

  if (userDropdownBtn && userDropdownMenu) {
    userDropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      userDropdownMenu.classList.toggle("show");
    });

    document.addEventListener("click", () => {
      userDropdownMenu.classList.remove("show");
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

  const title = document.getElementById("storyTitle").value.trim();
  const category = document.getElementById("storyCategory").value;
  const prompt = document.getElementById("storyPrompt").value.trim();
  const createBtn = document.getElementById("createBtn");

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

    await window.apiClient.createSystemStory(storyData);

    window.apiClient.showSuccessMessage("System story created successfully!");

    // Reset form
    document.getElementById("createStoryForm").reset();

    // Reload stories
    await loadSystemStories();
  } catch (error) {
    console.error("Failed to create system story:", error);
    window.apiClient.showErrorMessage(
      error.message || "Failed to create system story"
    );
  } finally {
    createBtn.disabled = false;
    createBtn.innerHTML = '<i class="fas fa-magic"></i> Generate System Story';
  }
}

async function viewStory(storyId) {
  try {
    const response = await window.apiClient.getAdminSystemStories();
    const story = response.stories.find((s) => s.id === storyId);

    if (!story) {
      window.apiClient.showErrorMessage("Story not found");
      return;
    }

    const imageHtml = story.image_data
      ? `<img src="data:image/${story.image_format || "png"};base64,${
          story.image_data
        }" 
                  alt="${story.title}" 
                  style="width: 100%; max-width: 500px; max-height: 400px; object-fit: contain; 
                         border-radius: 0.75rem; margin: 0 auto 1.5rem; display: block; 
                         box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); background: #f8fafc;" />`
      : "";

    const content = `
            <div style="text-align: center; margin-bottom: 1.5rem;">
              <h2 style="color: #1f2937; margin-bottom: 0.5rem;">${story.title}</h2>
              <p style="color: #6b7280; font-size: 0.9rem;">System Story • ${story.category}</p>
            </div>
            ${imageHtml}
            <div style="line-height: 1.8; color: #374151; font-size: 1.1rem; text-align: left;">
              ${story.generated_text}
            </div>
            <div style="margin-top: 1rem; padding: 1rem; background: #f9fafb; border-radius: 0.5rem;">
              <strong>Prompt:</strong> ${story.prompt}
            </div>
          `;

    window.apiClient.showModal(story.title, content);
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
    await window.apiClient.deleteSystemStory(storyId);
    window.apiClient.showSuccessMessage("System story deleted successfully");
    await loadSystemStories();
  } catch (error) {
    console.error("Failed to delete story:", error);
    window.apiClient.showErrorMessage("Failed to delete story");
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

        .profile-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border-radius: 0.5rem;
          transition: background 0.3s ease;
        }

        .profile-info:hover {
          background: rgba(0, 0, 0, 0.1);
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

        .nav-profile:hover .dropdown-arrow {
          transform: rotate(180deg);
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
