// Enhanced favorites page with better loading and error handling
let currentPage = 1;
const itemsPerPage = 10;
let isLoading = false;
let hasMoreItems = true;

// Show loading state
function showLoadingState() {
  const loadingContainer = document.getElementById("loadingContainer");
  const authRequired = document.getElementById("authRequired");
  const emptyState = document.getElementById("emptyState");
  const favoritesGrid = document.getElementById("favoritesGrid");

  if (loadingContainer) loadingContainer.style.display = "flex";
  if (authRequired) authRequired.style.display = "none";
  if (emptyState) emptyState.style.display = "none";
  if (favoritesGrid) favoritesGrid.style.display = "none";
}

// Show error state
function showErrorState(error) {
  const loadingContainer = document.getElementById("loadingContainer");
  const authRequired = document.getElementById("authRequired");
  const emptyState = document.getElementById("emptyState");
  const favoritesGrid = document.getElementById("favoritesGrid");

  if (loadingContainer) loadingContainer.style.display = "none";
  if (authRequired) authRequired.style.display = "none";
  if (emptyState) emptyState.style.display = "none";
  if (favoritesGrid) {
    favoritesGrid.style.display = "grid";
    favoritesGrid.innerHTML = `
      <div class="loading-placeholder error-state">
        <p>⚠️ Failed to load favorites</p>
        <p style="font-size: 0.875rem; margin: 0.5rem 0;">${
          error.message || "Please try again later"
        }</p>
        <button onclick="loadFavorites()" class="retry-btn">Retry</button>
      </div>
    `;
  }
}

// Show empty state
function showEmptyState() {
  const loadingContainer = document.getElementById("loadingContainer");
  const authRequired = document.getElementById("authRequired");
  const emptyState = document.getElementById("emptyState");
  const favoritesGrid = document.getElementById("favoritesGrid");

  if (loadingContainer) loadingContainer.style.display = "none";
  if (authRequired) authRequired.style.display = "none";
  if (emptyState) emptyState.style.display = "block";
  if (favoritesGrid) favoritesGrid.style.display = "none";
}

// Show auth required state
function showAuthRequired() {
  const loadingContainer = document.getElementById("loadingContainer");
  const authRequired = document.getElementById("authRequired");
  const emptyState = document.getElementById("emptyState");
  const favoritesGrid = document.getElementById("favoritesGrid");

  if (loadingContainer) loadingContainer.style.display = "none";
  if (authRequired) authRequired.style.display = "block";
  if (emptyState) emptyState.style.display = "none";
  if (favoritesGrid) favoritesGrid.style.display = "none";
}

// Show favorites grid
function showFavoritesGrid() {
  const loadingContainer = document.getElementById("loadingContainer");
  const authRequired = document.getElementById("authRequired");
  const emptyState = document.getElementById("emptyState");
  const favoritesGrid = document.getElementById("favoritesGrid");

  if (loadingContainer) loadingContainer.style.display = "none";
  if (authRequired) authRequired.style.display = "none";
  if (emptyState) emptyState.style.display = "none";
  if (favoritesGrid) favoritesGrid.style.display = "grid";
}

// Enhanced navigation update
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

// Enhanced favorites loading with better error handling
async function loadFavorites(page = 1, append = false) {
  console.log(`Loading favorites - page: ${page}, append: ${append}`);

  if (isLoading) {
    console.log("Already loading, skipping request");
    return;
  }

  isLoading = true;

  try {
    // Check authentication first
    if (!window.apiClient) {
      throw new Error("API client not available");
    }

    if (!window.apiClient.auth.isAuthenticated()) {
      console.log("User not authenticated, showing auth required");
      showAuthRequired();
      return;
    }

    // Show loading state for first page
    if (page === 1 && !append) {
      showLoadingState();
    }

    console.log("Fetching favorites from API...");
    const response = await window.apiClient.getFavorites(itemsPerPage);
    console.log("Favorites response:", response);

    if (!response) {
      throw new Error("No response received from server");
    }

    const favorites =
      response.content || response.stories || response.favorites || [];
    console.log(`Received ${favorites.length} favorites`);

    // Update pagination state
    hasMoreItems = favorites.length === itemsPerPage;

    if (favorites.length === 0) {
      showEmptyState();
      return;
    }

    // Display favorites
    displayFavorites(favorites, append);

    // Update current page
    currentPage = page;

    console.log("Favorites loaded successfully");
  } catch (error) {
    console.error("Failed to load favorites:", error);

    // Show specific error messages
    if (
      error.message.includes("Authentication required") ||
      error.message.includes("Not authenticated")
    ) {
      showAuthRequired();
      return;
    }

    showErrorState(error);
  } finally {
    isLoading = false;
  }
}

function displayFavorites(favorites, append = false) {
  const favoritesGrid = document.getElementById("favoritesGrid");
  if (!favoritesGrid) {
    console.error("Favorites grid not found");
    return;
  }

  // Show the grid and clear it if not appending
  showFavoritesGrid();

  if (!append) {
    favoritesGrid.innerHTML = "";
  }

  if (favorites && favorites.length > 0) {
    favorites.forEach((favorite) => {
      const favoriteCard = createFavoriteCard(favorite);
      favoritesGrid.appendChild(favoriteCard);
    });

    // Add load more button if there are more items
    // if (hasMoreItems && !document.getElementById("loadMoreBtn")) {
    //   const loadMoreBtn = document.createElement("button");
    //   loadMoreBtn.id = "loadMoreBtn";
    //   loadMoreBtn.className = "load-more-btn";
    //   loadMoreBtn.textContent = "Load More";
    //   loadMoreBtn.onclick = () => loadFavorites(currentPage + 1, true);

    //   const loadMoreContainer = document.createElement("div");
    //   loadMoreContainer.className = "load-more-container";
    //   loadMoreContainer.appendChild(loadMoreBtn);

    //   favoritesGrid.appendChild(loadMoreContainer);
    // }
  }
}

function createFavoriteCard(favorite) {
  console.log("Creating favorite card for:", favorite);
  const card = document.createElement("div");
  card.className = "story-card";
  card.setAttribute("data-content-id", favorite.id);

  // Use the old card structure that matches the CSS
  const imageUrl = favorite.image_data
    ? `data:image/${favorite.image_format || "png"};base64,${
        favorite.image_data
      }`
    : "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=200&h=150&fit=crop";

  const createdDate = new Date(favorite.created_at).toLocaleDateString();
  const shortDescription =
    favorite.generated_text && favorite.generated_text.length > 200
      ? favorite.generated_text.substring(0, 200) + "..."
      : favorite.generated_text || "No content available";

  card.innerHTML = `
    <div class="story-card-content">
      <img src="${imageUrl}" alt="Story illustration" class="story-image" />
      <div class="story-details">
        <h3 class="story-title">${
          favorite.prompt || favorite.title || "Generated Story"
        }</h3>
        <p class="story-description">${shortDescription}</p>
        <div class="story-meta">
          <span class="story-date">Created: ${createdDate}</span>
        </div>
        <div class="story-actions">
          <button class="action-btn favorite-btn" onclick="toggleFavorite(${
            favorite.id
          })" title="Remove from favorites">
            ❤️
          </button>
          <button class="action-btn delete-btn" onclick="deleteStory(${
            favorite.id
          })" title="Delete story">
            🗑️
          </button>
        </div>
      </div>
    </div>
  `;

  // Add click handler to view full story
  card.addEventListener("click", (e) => {
    if (!e.target.classList.contains("action-btn")) {
      viewStory(favorite);
    }
  });

  return card;
}

function viewStory(story) {
  const modal = document.getElementById("storyModal");
  const modalTitle = document.getElementById("storyModalTitle");
  const modalBody = document.getElementById("storyModalBody");

  if (!modal || !modalTitle || !modalBody) {
    console.error("Modal elements not found");
    return;
  }

  // Set the title
  modalTitle.textContent = story.prompt || story.title || "Generated Story";

  // Create the modal content
  const imageUrl = story.image_data
    ? `data:image/${story.image_format || "png"};base64,${story.image_data}`
    : null;

  let modalContent = `
    <div class="story-modal-meta">
      <p class="story-modal-date">Created: ${new Date(
        story.created_at
      ).toLocaleDateString()}</p>
    </div>
  `;

  if (imageUrl) {
    modalContent += `
      <img src="${imageUrl}" alt="Story illustration" class="story-modal-image" />
    `;
  }

  modalContent += `
    <div class="story-modal-text">${
      story.generated_text || story.content || "No content available"
    }</div>
  `;

  modalBody.innerHTML = modalContent;

  // Show the modal
  showStoryModal();
}

function showStoryModal() {
  const modal = document.getElementById("storyModal");
  if (modal) {
    modal.style.display = "flex";
    setTimeout(() => {
      modal.classList.add("show");
    }, 10);
  }
}

function hideStoryModal() {
  const modal = document.getElementById("storyModal");
  if (modal) {
    modal.classList.remove("show");
    setTimeout(() => {
      modal.style.display = "none";
    }, 300);
  }
}

async function toggleFavorite(storyId) {
  try {
    await window.apiClient.toggleFavorite(storyId);
    // Remove the story from the favorites list
    const storyCard = document.querySelector(`[data-content-id="${storyId}"]`);
    if (storyCard) {
      storyCard.remove();
    }

    // Check if there are any stories left
    const favoritesGrid = document.getElementById("favoritesGrid");
    const remainingCards = favoritesGrid.querySelectorAll(".story-card");
    if (remainingCards.length === 0) {
      showEmptyState();
    }

    if (window.apiClient.showSuccessMessage) {
      window.apiClient.showSuccessMessage("Story removed from favorites!");
    }
  } catch (error) {
    console.error("Failed to toggle favorite:", error);
    if (window.apiClient.showErrorMessage) {
      window.apiClient.showErrorMessage(
        "Failed to update favorite status. Please try again."
      );
    }
  }
}

async function deleteStory(storyId) {
  const confirmed = await window.apiClient.showConfirmationModal(
    "Delete Story",
    "Are you sure you want to delete this story? This action cannot be undone.",
    "Delete Story",
    "Cancel"
  );

  if (!confirmed) {
    return;
  }

  try {
    await window.apiClient.deleteContent(storyId);

    // Remove the story from the UI
    const storyCard = document.querySelector(`[data-content-id="${storyId}"]`);
    if (storyCard) {
      storyCard.remove();
    }

    // Check if there are any stories left
    const favoritesGrid = document.getElementById("favoritesGrid");
    const remainingCards = favoritesGrid.querySelectorAll(".story-card");
    if (remainingCards.length === 0) {
      showEmptyState();
    }

    if (window.apiClient.showSuccessMessage) {
      window.apiClient.showSuccessMessage("Story deleted successfully!");
    }
  } catch (error) {
    console.error("Failed to delete story:", error);
    if (window.apiClient.showErrorMessage) {
      window.apiClient.showErrorMessage(
        "Failed to delete story. Please try again."
      );
    }
  }
}

// Enhanced event listener setup
function setupEventListeners() {
  console.log("Setting up favorites page event listeners...");

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

  // Connect profile settings button
  const profileSettingsBtn = document.getElementById("profileSettingsBtn");
  profileSettingsBtn?.addEventListener("click", () => {
    console.log("Profile Settings button clicked");
    closeDropdown();

    if (window.profileSettingsModal) {
      window.profileSettingsModal.open();
    } else {
      alert(
        "Profile settings is not available. Please refresh the page and try again."
      );
    }
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

  closeBtn?.addEventListener("click", hideStoryModal);
  okBtn?.addEventListener("click", hideStoryModal);

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) {
      hideStoryModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.classList.contains("show")) {
      hideStoryModal();
    }
  });

  console.log("Favorites page event listeners setup completed");
}

// Enhanced initialization
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Favorites page - DOM Content Loaded");

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

  // Update navigation
  await updateNavigation();

  // Load favorites with retry logic
  const loadWithRetry = async (retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        await loadFavorites();
        break;
      } catch (error) {
        console.error(`Favorites loading attempt ${i + 1} failed:`, error);
        if (i === retries - 1) {
          showErrorState(error);
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }
  };

  await loadWithRetry();

  console.log("Favorites page initialization completed!");
});

// Listen for auth status changes
window.addEventListener("authStatusChanged", async () => {
  await updateNavigation();
});

// Listen for profile updates
window.addEventListener("profileUpdated", async () => {
  await window.apiClient.updateProfilePictures();
});
