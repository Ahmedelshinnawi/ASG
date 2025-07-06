// DOM elements
const loadingContainer = document.getElementById("loadingContainer");
const storiesGrid = document.getElementById("storiesGrid");
const emptyState = document.getElementById("emptyState");
const errorState = document.getElementById("errorState");
const errorMessage = document.getElementById("errorMessage");

// Modal elements
const storyModal = document.getElementById("storyModal");
const closeModal = document.getElementById("closeModal");
const modalStoryContent = document.getElementById("modalStoryContent");
const modalStoryImage = document.getElementById("modalStoryImage");
const modalStoryStats = document.getElementById("modalStoryStats");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const modalToggleFavoriteBtn = document.getElementById(
  "modalToggleFavoriteBtn"
);
const modalDeleteBtn = document.getElementById("modalDeleteBtn");

let currentModalStory = null;

// Load stories on page load
document.addEventListener("DOMContentLoaded", async () => {
  await loadRecentStories();
});

async function loadRecentStories() {
  try {
    // Check authentication
    if (!window.apiClient.auth.isAuthenticated()) {
      showError("Please log in to view your recent stories.");
      return;
    }

    showLoading();

    // Get user's story history
    const response = await window.apiClient.getStoryHistory(50); // Get last 50 stories

    // Extract the stories array from the response
    const stories = response.content || response || [];

    hideLoading();

    if (stories.length === 0) {
      showEmptyState();
    } else {
      displayStories(stories);
    }
  } catch (error) {
    hideLoading();
    console.error("Failed to load stories:", error);
    showError(
      error.message || "Failed to load your stories. Please try again."
    );
  }
}

function showLoading() {
  loadingContainer.style.display = "flex";
  storiesGrid.style.display = "none";
  emptyState.style.display = "none";
  errorState.style.display = "none";
}

function hideLoading() {
  loadingContainer.style.display = "none";
}

function showEmptyState() {
  emptyState.style.display = "block";
  storiesGrid.style.display = "none";
  errorState.style.display = "none";
}

function showError(message) {
  errorMessage.textContent = message;
  errorState.style.display = "block";
  storiesGrid.style.display = "none";
  emptyState.style.display = "none";
}

function displayStories(stories) {
  storiesGrid.innerHTML = "";
  storiesGrid.style.display = "grid";
  emptyState.style.display = "none";
  errorState.style.display = "none";

  stories.forEach((story) => {
    const storyCard = createStoryCard(story);
    storiesGrid.appendChild(storyCard);
  });
}

function createStoryCard(story) {
  const card = document.createElement("div");
  card.className = "story-card";

  const formattedDate = new Date(story.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const storyText = story.generated_text || story.text || "";
  const truncatedText =
    storyText.length > 200 ? storyText.substring(0, 200) + "..." : storyText;

  const wordCount = storyText.split(" ").length;

  card.innerHTML = `
          <div class="story-header">
            <div class="story-date">${formattedDate}</div>
            <div class="story-actions">
              <button class="action-btn ${story.is_favorite ? "favorite" : ""}" 
                      onclick="event.stopPropagation(); toggleFavorite(${
                        story.id
                      }, this);" 
                      title="${
                        story.is_favorite
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }">
                ${
                  story.is_favorite
                    ? "<i class='fa-solid fa-heart' style='color: #ef4444;'></i>"
                    : "<i class='fa-regular fa-heart'></i>"
                }
              </button>
              <button class="action-btn" 
                      onclick="event.stopPropagation(); deleteStory(${
                        story.id
                      }, this.closest('.story-card'));" 
                      title="Delete story">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>

          ${
            story.image_data || story.image_base64
              ? `
            <img class="story-image" 
                 src="data:image/${story.image_format || "png"};base64,${
                  story.image_data || story.image_base64
                }" 
                 alt="Story illustration" />
          `
              : ""
          }

          <div class="story-content">${truncatedText}</div>

          <div class="story-footer">
            <button class="read-more-btn" onclick="showStoryModal(${
              story.id
            });">
              Read Full Story
            </button>
            <div class="story-stats">
              <span>📝 ${wordCount} words</span>
              ${
                story.is_favorite
                  ? "<span><i class='fa-solid fa-heart' style='color: #ef4444;'></i> Favorite</span>"
                  : ""
              }
            </div>
          </div>
        `;

  return card;
}

async function toggleFavorite(storyId, button) {
  try {
    await window.apiClient.toggleFavorite(storyId);

    // Update button appearance
    const isFavorite = button.classList.contains("favorite");
    if (isFavorite) {
      button.classList.remove("favorite");
      button.innerHTML = "<i class='fa-regular fa-heart'></i>";
      button.title = "Add to favorites";
    } else {
      button.classList.add("favorite");
      button.innerHTML =
        "<i class='fa-solid fa-heart' style='color: #ef4444;'></i>";
      button.title = "Remove from favorites";
    }

    // Update stats in the same card
    const card = button.closest(".story-card");
    const stats = card.querySelector(".story-stats");
    const favoriteSpan = stats.querySelector("span:last-child");

    if (
      isFavorite &&
      favoriteSpan &&
      favoriteSpan.textContent.includes("Favorite")
    ) {
      favoriteSpan.remove();
    } else if (!isFavorite) {
      const favoriteIndicator = document.createElement("span");
      favoriteIndicator.innerHTML =
        "<i class='fa-solid fa-heart' style='color: #ef4444;'></i> Favorite";
      stats.appendChild(favoriteIndicator);
    }
  } catch (error) {
    console.error("Failed to toggle favorite:", error);
    window.apiClient.showErrorMessage("Failed to update favorite status.");
  }
}

async function deleteStory(storyId, cardElement) {
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

    // Remove the card with animation
    cardElement.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    cardElement.style.opacity = "0";
    cardElement.style.transform = "scale(0.8)";

    setTimeout(() => {
      cardElement.remove();

      // Check if no stories left
      if (storiesGrid.children.length === 0) {
        showEmptyState();
      }
    }, 300);

    window.apiClient.showSuccessMessage("Story deleted successfully.");
  } catch (error) {
    console.error("Failed to delete story:", error);
    window.apiClient.showErrorMessage(
      "Failed to delete story. Please try again."
    );
  }
}

async function showStoryModal(storyId) {
  try {
    // Find the story in our current data or fetch it
    const response = await window.apiClient.getStoryHistory(50);
    const stories = response.content || response || [];
    const story = stories.find((s) => s.id === storyId);

    if (!story) {
      window.apiClient.showErrorMessage("Story not found.");
      return;
    }

    currentModalStory = story;

    // Populate modal
    const storyText = story.generated_text || story.text || "";
    modalStoryContent.textContent = storyText;

    if (story.image_data || story.image_base64) {
      modalStoryImage.src = `data:image/${story.image_format || "png"};base64,${
        story.image_data || story.image_base64
      }`;
      modalStoryImage.style.display = "block";
    } else {
      modalStoryImage.style.display = "none";
    }

    const formattedDate = new Date(story.created_at).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );

    const wordCount = storyText.split(" ").length;
    modalStoryStats.innerHTML = `
            <span>📅 Created: ${formattedDate}</span>
            <span>📝 ${wordCount} words</span>
          `;

    // Update favorite button
    modalToggleFavoriteBtn.textContent = story.is_favorite
      ? "Remove from Favorites"
      : "Add to Favorites";
    modalToggleFavoriteBtn.className = story.is_favorite
      ? "btn-secondary"
      : "btn-primary";

    // Show modal
    showModal();
  } catch (error) {
    console.error("Failed to show story:", error);
    window.apiClient.showErrorMessage("Failed to load story details.");
  }
}

function showModal() {
  storyModal.style.display = "flex";
  storyModal.classList.add("show");
  setTimeout(() => {
    storyModal.style.opacity = "1";
    storyModal.querySelector(".modal-content").style.transform = "scale(1)";
  }, 10);
}

function hideModal() {
  storyModal.style.opacity = "0";
  storyModal.querySelector(".modal-content").style.transform = "scale(0.8)";
  setTimeout(() => {
    storyModal.style.display = "none";
    storyModal.classList.remove("show");
    currentModalStory = null;
  }, 300);
}

// Modal event listeners
closeModal.addEventListener("click", hideModal);
modalCloseBtn.addEventListener("click", hideModal);

storyModal.addEventListener("click", (e) => {
  if (e.target === storyModal) {
    hideModal();
  }
});

modalToggleFavoriteBtn.addEventListener("click", async () => {
  if (!currentModalStory) return;

  try {
    await window.apiClient.toggleFavorite(currentModalStory.id);

    // Update current story data
    currentModalStory.is_favorite = !currentModalStory.is_favorite;

    // Update button
    modalToggleFavoriteBtn.textContent = currentModalStory.is_favorite
      ? "Remove from Favorites"
      : "Add to Favorites";
    modalToggleFavoriteBtn.className = currentModalStory.is_favorite
      ? "btn-secondary"
      : "btn-primary";

    // Update the card in the background
    const cards = document.querySelectorAll(".story-card");
    cards.forEach((card) => {
      const favoriteBtn = card.querySelector(".action-btn");
      if (
        favoriteBtn &&
        favoriteBtn.onclick.toString().includes(currentModalStory.id)
      ) {
        if (currentModalStory.is_favorite) {
          favoriteBtn.classList.add("favorite");
          favoriteBtn.innerHTML =
            "<i class='fa-solid fa-heart' style='color: #ef4444;'></i>";
          favoriteBtn.title = "Remove from favorites";
        } else {
          favoriteBtn.classList.remove("favorite");
          favoriteBtn.innerHTML = "<i class='fa-regular fa-heart'></i>";
          favoriteBtn.title = "Add to favorites";
        }
      }
    });

    window.apiClient.showSuccessMessage(
      currentModalStory.is_favorite
        ? "Added to favorites!"
        : "Removed from favorites!"
    );
  } catch (error) {
    console.error("Failed to toggle favorite:", error);
    window.apiClient.showErrorMessage("Failed to update favorite status.");
  }
});

modalDeleteBtn.addEventListener("click", async () => {
  if (!currentModalStory) return;

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
    await window.apiClient.deleteContent(currentModalStory.id);

    hideModal();

    // Remove the card from the grid
    const cards = document.querySelectorAll(".story-card");
    cards.forEach((card) => {
      const deleteBtn = card.querySelector('.action-btn[title="Delete story"]');
      if (
        deleteBtn &&
        deleteBtn.onclick.toString().includes(currentModalStory.id)
      ) {
        card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        card.style.opacity = "0";
        card.style.transform = "scale(0.8)";

        setTimeout(() => {
          card.remove();

          // Check if no stories left
          if (storiesGrid.children.length === 0) {
            showEmptyState();
          }
        }, 300);
      }
    });

    window.apiClient.showSuccessMessage("Story deleted successfully.");
  } catch (error) {
    console.error("Failed to delete story:", error);
    window.apiClient.showErrorMessage(
      "Failed to delete story. Please try again."
    );
  }
});

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    hideModal();
  }
});

// User Dropdown Navigation Functionality
document.addEventListener("DOMContentLoaded", () => {
  // Show/hide profile button based on auth status
  async function updateNavigation() {
    const loginBtn = document.querySelector(".login-btn");
    const navProfile = document.getElementById("navProfile");

    if (window.apiClient && window.apiClient.auth.isAuthenticated()) {
      loginBtn.style.display = "none";
      navProfile.style.display = "flex";

      try {
        // Get fresh user profile data
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
          if (profile.is_admin) {
            adminLink.style.display = "block";
          } else {
            adminLink.style.display = "none";
          }
        }
      } catch (error) {
        console.error("Failed to update navigation profile:", error);
      }

      // Update profile pictures and user info dynamically
      await window.apiClient.updateProfilePictures();
    } else {
      loginBtn.style.display = "block";
      navProfile.style.display = "none";
    }
  }

  // Dropdown functionality
  const userDropdownBtn = document.getElementById("userDropdownBtn");
  const userDropdownMenu = document.getElementById("userDropdownMenu");

  function toggleDropdown() {
    const isOpen = userDropdownMenu.classList.contains("show");
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }

  function openDropdown() {
    userDropdownBtn.classList.add("active");
    userDropdownMenu.classList.add("show");

    // Close dropdown when clicking outside
    document.addEventListener("click", handleOutsideClick);
  }

  function closeDropdown() {
    userDropdownBtn.classList.remove("active");
    userDropdownMenu.classList.remove("show");

    // Remove outside click listener
    document.removeEventListener("click", handleOutsideClick);
  }

  function handleOutsideClick(event) {
    const dropdown = document.querySelector(".user-dropdown");
    if (!dropdown.contains(event.target)) {
      closeDropdown();
    }
  }

  // Connect dropdown button
  userDropdownBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  // Connect profile settings button to modal
  const profileSettingsBtn = document.getElementById("profileSettingsBtn");
  profileSettingsBtn?.addEventListener("click", () => {
    closeDropdown(); // Close dropdown first
    if (window.profileSettingsModal) {
      window.profileSettingsModal.open();
    }
  });

  // Connect logout button
  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn?.addEventListener("click", () => {
    closeDropdown(); // Close dropdown first
    if (window.apiClient) {
      window.apiClient.logout();
    } else {
      // Fallback logout
      localStorage.removeItem("token");
      window.location.href = "/welcome.html";
    }
  });

  // Listen for auth status changes
  window.addEventListener("authStatusChanged", async () => {
    await updateNavigation();
  });

  // Listen for profile updates to refresh user info
  window.addEventListener("profileUpdated", async (event) => {
    // Update profile pictures and user data
    await window.apiClient.updateProfilePictures();
  });

  // Initial navigation update
  updateNavigation();

  // Check auth status periodically
  setInterval(async () => {
    await updateNavigation();
  }, 5000);
});
