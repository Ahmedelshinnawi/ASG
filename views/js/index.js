// Wait for profile modal to be available
function waitForProfileModal(callback, maxAttempts = 50) {
  let attempts = 0;

  const checkModal = () => {
    attempts++;
    console.log(`Checking for profile modal, attempt ${attempts}`);

    if (window.profileSettingsModal) {
      console.log("Profile modal found!");
      callback();
      return;
    }

    if (attempts >= maxAttempts) {
      console.error("Profile modal not found after maximum attempts");
      alert(
        "Profile settings is not available. Please refresh the page and try again."
      );
      return;
    }

    setTimeout(checkModal, 100);
  };

  checkModal();
}

// Show loading state for system stories
function showSystemStoriesLoading() {
  const teachingGrid = document.getElementById("teachingStoriesGrid");
  const recommendedGrid = document.getElementById("recommendedStoriesGrid");

  const loadingHTML = `
    <div class="loading-placeholder">
      <div class="loading-spinner"></div>
      <p>Loading stories...</p>
    </div>
  `;

  if (teachingGrid) {
    teachingGrid.innerHTML = loadingHTML;
  }
  if (recommendedGrid) {
    recommendedGrid.innerHTML = loadingHTML;
  }
}

// Show error state for system stories
function showSystemStoriesError(error) {
  const teachingGrid = document.getElementById("teachingStoriesGrid");
  const recommendedGrid = document.getElementById("recommendedStoriesGrid");

  const errorHTML = `
    <div class="loading-placeholder error-state">
      <p>⚠️ Failed to load stories</p>
      <button onclick="loadSystemStories()" class="retry-btn">Retry</button>
    </div>
  `;

  if (teachingGrid) {
    teachingGrid.innerHTML = errorHTML;
  }
  if (recommendedGrid) {
    recommendedGrid.innerHTML = errorHTML;
  }

  console.error("System stories loading error:", error);
}

// Update navigation with better error handling
async function updateNavigation() {
  try {
    const loginBtn = document.querySelector(".login-btn");
    const navProfile = document.getElementById("navProfile");

    if (!window.apiClient) {
      console.warn("API client not available yet");
      return;
    }

    if (window.apiClient.auth.isAuthenticated()) {
      if (loginBtn) loginBtn.style.display = "none";
      if (navProfile) navProfile.style.display = "flex";

      try {
        const profile = await window.apiClient.getProfile();

        // Update username
        const userNameElement = document.querySelector(".user-name");
        const dropdownUserName = document.getElementById("dropdownUserName");
        if (userNameElement && profile.username) {
          userNameElement.textContent = profile.username;
        }
        if (dropdownUserName && profile.username) {
          dropdownUserName.textContent = profile.username;
        }

        // Update full name in dropdown
        const dropdownUserFullName = document.getElementById(
          "dropdownUserFullName"
        );
        if (dropdownUserFullName) {
          if (profile.full_name) {
            dropdownUserFullName.textContent = profile.full_name;
            dropdownUserFullName.style.display = "block";
          } else {
            dropdownUserFullName.style.display = "none";
          }
        }

        // Update email
        const dropdownUserEmail = document.getElementById("dropdownUserEmail");
        if (dropdownUserEmail && profile.email) {
          dropdownUserEmail.textContent = profile.email;
        }

        // Update profile pictures
        const userAvatar = document.getElementById("userAvatar");
        const dropdownAvatar = document.querySelector(".dropdown-avatar");
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
        const adminLink = document.getElementById("adminLink");
        if (adminLink) {
          adminLink.style.display = profile.is_admin ? "block" : "none";
        }

        await window.apiClient.updateProfilePictures();
      } catch (error) {
        console.error("Failed to update navigation profile:", error);
      }
    } else {
      if (loginBtn) loginBtn.style.display = "block";
      if (navProfile) navProfile.style.display = "none";
    }
  } catch (error) {
    console.error("Navigation update error:", error);
  }
}

// Load system stories with better error handling and loading states
async function loadSystemStories() {
  console.log("Starting to load system stories...");

  try {
    // Show loading state immediately
    showSystemStoriesLoading();

    // Check if API client is available
    if (!window.apiClient) {
      throw new Error("API client not available");
    }

    console.log("Fetching teaching stories...");
    const teachingStories = await window.apiClient.getTeachingStories();
    console.log("Teaching stories response:", teachingStories);

    if (teachingStories && teachingStories.stories) {
      displayStories(teachingStories.stories, "teachingStoriesGrid");
    } else {
      console.warn("No teaching stories received");
      displayStories([], "teachingStoriesGrid");
    }

    console.log("Fetching recommended stories...");
    const recommendedStories = await window.apiClient.getRecommendedStories();
    console.log("Recommended stories response:", recommendedStories);

    if (recommendedStories && recommendedStories.stories) {
      displayStories(recommendedStories.stories, "recommendedStoriesGrid");
    } else {
      console.warn("No recommended stories received");
      displayStories([], "recommendedStoriesGrid");
    }

    console.log("System stories loading completed!");
  } catch (error) {
    console.error("Failed to load system stories:", error);
    showSystemStoriesError(error);
  }
}

function displayStories(stories, containerId) {
  console.log(`Displaying stories for container: ${containerId}`, stories);
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container not found: ${containerId}`);
    return;
  }

  container.innerHTML = "";

  if (stories && stories.length > 0) {
    console.log(`Creating ${stories.length} story cards`);
    stories.forEach((story) => {
      const storyCard = createStoryCard(story);
      container.appendChild(storyCard);
    });
  } else {
    console.log("No stories available");
    container.innerHTML =
      '<div class="loading-placeholder">No stories available at the moment. Please try again later.</div>';
  }
}

function createStoryCard(story) {
  console.log("Creating story card for:", story.title, story);
  const card = document.createElement("div");
  card.className = "story-card";
  card.setAttribute("data-story-id", story.id);

  const img = document.createElement("img");
  if (story.image_data) {
    console.log(
      `Setting image for story: ${story.title}, format: ${story.image_format}`
    );
    img.src = `data:image/${story.image_format || "png"};base64,${
      story.image_data
    }`;
  } else {
    console.log(`No image data for story: ${story.title}, using fallback`);
    img.src =
      "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=200&h=200&fit=crop";
  }
  img.alt = story.title;

  img.style.cssText = "";

  img.onerror = function () {
    console.error(`Failed to load image for story: ${story.title}`);
    this.src =
      "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=200&h=200&fit=crop";
  };

  img.onload = function () {
    console.log(`Image loaded successfully for story: ${story.title}`);
  };

  const titleOverlay = document.createElement("div");
  titleOverlay.style.cssText = `
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0,0,0,0.7));
    color: white;
    padding: 1rem;
    font-weight: 600;
    font-size: 0.9rem;
  `;
  titleOverlay.textContent = story.title;

  card.style.position = "relative";

  card.appendChild(img);
  card.appendChild(titleOverlay);

  card.addEventListener("click", () => {
    showStoryModal(story);
  });

  console.log("Story card created successfully");
  return card;
}

function showStoryModal(story) {
  const modal = document.getElementById("storyModal");
  const modalTitle = document.getElementById("storyModalTitle");
  const modalBody = document.getElementById("storyModalBody");

  modalTitle.textContent = story.title;

  const imageHtml = story.image_data
    ? `<img src="data:image/${story.image_format || "png"};base64,${
        story.image_data
      }" 
          alt="${story.title}" 
          class="story-modal-image" />`
    : "";

  const content = `
    <div class="story-modal-meta">
      <p class="story-modal-category">System Story • ${story.category}</p>
    </div>
    ${imageHtml}
    <div class="story-modal-text">${story.generated_text}</div>
  `;

  modalBody.innerHTML = content;
  showCustomStoryModal();
}

function showCustomStoryModal() {
  const modal = document.getElementById("storyModal");
  modal.style.display = "flex";
  setTimeout(() => {
    modal.classList.add("show");
  }, 10);
}

function hideCustomStoryModal() {
  const modal = document.getElementById("storyModal");
  modal.classList.remove("show");
  setTimeout(() => {
    modal.style.display = "none";
  }, 300);
}

function showFallbackStories() {
  const fallbackTeaching = [
    {
      src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      alt: "Teacher story",
    },
    {
      src: "https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=200&h=200&fit=crop",
      alt: "Captain story",
    },
    {
      src: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=200&h=200&fit=crop",
      alt: "School story",
    },
    {
      src: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=200&h=200&fit=crop",
      alt: "Chef story",
    },
  ];

  const fallbackRecommended = [
    {
      src: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=200&fit=crop",
      alt: "Adventure story",
    },
    {
      src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      alt: "Teacher story",
    },
    {
      src: "https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=200&h=200&fit=crop",
      alt: "Captain story",
    },
    {
      src: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=200&h=200&fit=crop",
      alt: "School story",
    },
  ];

  displayFallbackStories(fallbackTeaching, "teachingStoriesGrid");
  displayFallbackStories(fallbackRecommended, "recommendedStoriesGrid");
}

function displayFallbackStories(stories, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";
  stories.forEach((story) => {
    const card = document.createElement("div");
    card.className = "story-card";
    card.innerHTML = `<img src="${story.src}" alt="${story.alt}" />`;
    container.appendChild(card);
  });
}

// Enhanced event listener setup with better error handling
function setupEventListeners() {
  console.log("Setting up event listeners...");

  // User dropdown functionality
  const userDropdownBtn = document.getElementById("userDropdownBtn");
  const userDropdownMenu = document.getElementById("userDropdownMenu");

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
    document.addEventListener("click", handleOutsideClick);
  }

  function closeDropdown() {
    if (userDropdownBtn) userDropdownBtn.classList.remove("active");
    if (userDropdownMenu) userDropdownMenu.classList.remove("show");
    document.removeEventListener("click", handleOutsideClick);
  }

  function handleOutsideClick(event) {
    const dropdown = document.querySelector(".user-dropdown");
    if (dropdown && !dropdown.contains(event.target)) {
      closeDropdown();
    }
  }

  // Connect dropdown button
  userDropdownBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  // Connect profile settings button with improved error handling
  const profileSettingsBtn = document.getElementById("profileSettingsBtn");
  profileSettingsBtn?.addEventListener("click", () => {
    console.log("Profile Settings button clicked");
    closeDropdown();

    waitForProfileModal(() => {
      if (window.profileSettingsModal) {
        console.log("Opening profile settings modal...");
        window.profileSettingsModal.open();
      }
    });
  });

  // Connect logout button
  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn?.addEventListener("click", () => {
    closeDropdown();
    if (window.apiClient) {
      window.apiClient.logout();
    } else {
      localStorage.removeItem("token");
      window.location.href = "/welcome.html";
    }
  });

  // Modal close handlers
  const modal = document.getElementById("storyModal");
  const closeBtn = document.getElementById("storyModalClose");
  const okBtn = document.getElementById("storyModalOk");

  closeBtn?.addEventListener("click", hideCustomStoryModal);
  okBtn?.addEventListener("click", hideCustomStoryModal);

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) {
      hideCustomStoryModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.classList.contains("show")) {
      hideCustomStoryModal();
    }
  });

  console.log("Event listeners setup completed");
}

// Test function for debugging dropdown issues
function testDropdownAsLoggedInUser() {
  console.log("=== TESTING DROPDOWN FUNCTIONALITY ===");

  const userDropdownBtn = document.getElementById("userDropdownBtn");
  const userDropdownMenu = document.getElementById("userDropdownMenu");
  const profileSettingsBtn = document.getElementById("profileSettingsBtn");

  console.log("Dropdown button:", userDropdownBtn);
  console.log("Dropdown menu:", userDropdownMenu);
  console.log("Profile settings button:", profileSettingsBtn);
  console.log("Profile modal available:", !!window.profileSettingsModal);
  console.log("API client available:", !!window.apiClient);
  console.log("User authenticated:", window.apiClient?.auth.isAuthenticated());
}

// Enhanced initialization with better timing
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM Content Loaded - Starting initialization...");

  // Wait for API client to be available
  let attempts = 0;
  const maxAttempts = 50;

  const waitForAPIClient = () => {
    return new Promise((resolve) => {
      const checkAPI = () => {
        attempts++;
        if (window.apiClient) {
          console.log("API client found!");
          resolve();
          return;
        }

        if (attempts >= maxAttempts) {
          console.error("API client not found after maximum attempts");
          resolve();
          return;
        }

        setTimeout(checkAPI, 100);
      };
      checkAPI();
    });
  };

  await waitForAPIClient();

  // Setup event listeners
  setupEventListeners();

  // Load system stories with retry logic
  const loadWithRetry = async (retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        await loadSystemStories();
        break;
      } catch (error) {
        console.error(`System stories loading attempt ${i + 1} failed:`, error);
        if (i === retries - 1) {
          showSystemStoriesError(error);
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }
  };

  await loadWithRetry();

  // Update navigation
  await updateNavigation();

  // Test dropdown after a delay
  setTimeout(() => {
    testDropdownAsLoggedInUser();
  }, 1000);

  console.log("Initialization completed!");
});

// Listen for auth status changes
window.addEventListener("authStatusChanged", async () => {
  await updateNavigation();
});

// Listen for profile updates
window.addEventListener("profileUpdated", async () => {
  await window.apiClient.updateProfilePictures();
});

// Periodic auth check
setInterval(async () => {
  await updateNavigation();
}, 10000); // Reduced frequency to 10 seconds
