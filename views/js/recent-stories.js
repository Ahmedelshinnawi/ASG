// DOM elements
const loadingContainer = document.getElementById("loadingContainer");
const storiesGrid = document.getElementById("storiesGrid");
const emptyState = document.getElementById("emptyState");
const errorState = document.getElementById("errorState");
const errorMessage = document.getElementById("errorMessage");
const sortSelect = document.getElementById("sortSelect");
const gridViewBtn = document.getElementById("gridViewBtn");
const listViewBtn = document.getElementById("listViewBtn");
const storiesCount = document.getElementById("storiesCount");

// Modal elements
const storyModal = document.getElementById("storyModal");
const closeModal = document.getElementById("closeModal");
const modalStoryContent = document.getElementById("modalStoryContent");
const modalStoryImage = document.getElementById("modalStoryImage");
const modalStoryStats = document.getElementById("modalStoryStats");
const modalStoryMeta = document.getElementById("modalStoryMeta");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const modalToggleFavoriteBtn = document.getElementById(
  "modalToggleFavoriteBtn"
);
const modalDeleteBtn = document.getElementById("modalDeleteBtn");

let currentModalStory = null;
let allStories = [];
let filteredStories = [];

// Function to clean story titles by removing genre and length information
function cleanStoryTitle(title) {
  // Handle null, undefined, or empty string cases
  if (!title || title === null || title === undefined || title === "")
    return "Generated Story";

  // Convert to string to handle any edge cases
  const titleStr = String(title);

  // Handle the case where String(null) returns "null"
  if (titleStr === "null" || titleStr === "undefined") return "Generated Story";

  // Remove genre and length information from the title
  let cleanedTitle = titleStr
    .replace(/\s*\(Genre:\s*[^)]*\)/gi, "") // Remove (Genre: ...)
    .replace(/\s*\(Length:\s*[^)]*\)/gi, "") // Remove (Length: ...)
    .replace(/\s*\(Language:\s*[^)]*\)/gi, "") // Remove (Language: ...)
    .trim();

  // If the cleaned title is empty, return a default
  return cleanedTitle || "Generated Story";
}

// Load stories on page load
document.addEventListener("DOMContentLoaded", async () => {
  await loadRecentStories();
  setupEventListeners();
});

function setupEventListeners() {
  // Sort functionality
  sortSelect?.addEventListener("change", handleSort);

  // View toggle
  gridViewBtn?.addEventListener("click", () => setView("grid"));
  listViewBtn?.addEventListener("click", () => setView("list"));
}

function handleSort() {
  applySortAndDisplay();
}

function applySortAndDisplay() {
  const sortValue = sortSelect.value;

  let sortedStories = [...filteredStories];

  switch (sortValue) {
    case "newest":
      sortedStories.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      break;
    case "oldest":
      sortedStories.sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
      break;
    case "favorites":
      sortedStories = sortedStories.filter((story) => story.is_favorite);
      break;
  }

  displayStories(sortedStories);
  updateStoriesCount(sortedStories.length);
}

function setView(viewType) {
  gridViewBtn.classList.toggle("active", viewType === "grid");
  listViewBtn.classList.toggle("active", viewType === "list");
  storiesGrid.classList.toggle("list-view", viewType === "list");
  localStorage.setItem("viewPreference", viewType);
  // Refresh the display to update card structure
  displayStories(filteredStories);
}

function updateStoriesCount(count) {
  if (storiesCount) {
    const countText = storiesCount.querySelector(".count-text");
    if (countText) {
      countText.textContent = `${count} ${
        count === 1 ? "story" : "stories"
      } found`;
      storiesCount.style.display = count > 0 ? "block" : "none";
    }
  }
}

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

    // Store all stories and filtered stories
    allStories = stories;
    filteredStories = [...stories];

    hideLoading();

    if (stories.length === 0) {
      showEmptyState();
    } else {
      applySortAndDisplay();
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

  if (stories.length === 0) {
    showEmptyState();
    return;
  }

  stories.forEach((story, index) => {
    const storyCard = createStoryCard(story, index);
    storiesGrid.appendChild(storyCard);
  });
}

function createStoryCard(story, index = 0) {
  const card = document.createElement("div");
  card.className = "story-card";
  card.style.animationDelay = `${index * 0.1}s`;

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

  // Check if in list view mode
  const isListView = storiesGrid.classList.contains("list-view");

  if (isListView) {
    card.innerHTML = `
      <div class="story-card-content">
        ${
          story.image_data || story.image_base64
            ? `<img class="story-image" src="data:image/${
                story.image_format || "png"
              };base64,${
                story.image_data || story.image_base64
              }" alt="Story illustration" />`
            : ""
        }
        <div class="story-details">
          <div class="story-header-section">
            <h3 class="story-title">${cleanStoryTitle(
              story.title || story.prompt || "Generated Story"
            )}</h3>
            <div class="story-actions">
              <button class="action-btn favorite-btn ${
                story.is_favorite ? "favorite" : ""
              }" 
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
              <button class="action-btn delete-btn" 
                      onclick="event.stopPropagation(); deleteStory(${
                        story.id
                      }, this.closest('.story-card'));" 
                      title="Delete story">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
          <p class="story-description">${truncatedText}</p>
          <div class="story-footer-section">
            <div class="story-meta-stats">
              <span class="story-date">Created: ${formattedDate}</span>
              <div class="story-stats-row">
                <span class="story-word-count">📝 ${wordCount} words</span>
                ${
                  story.is_favorite
                    ? "<span class='story-favorite-indicator'><i class='fa-solid fa-heart' style='color: #ef4444;'></i> Favorite</span>"
                    : ""
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    // Make the entire card clickable to open the modal
    card.addEventListener("click", (e) => {
      if (!e.target.classList.contains("action-btn")) {
        showStoryModal(story.id);
      }
    });
  } else {
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
          ? `<img class="story-image" src="data:image/${
              story.image_format || "png"
            };base64,${
              story.image_data || story.image_base64
            }" alt="Story illustration" />`
          : ""
      }

      <div class="story-content">${truncatedText}</div>

      <div class="story-footer">
        <button class="read-more-btn" onclick="showStoryModal(${story.id});">
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
  }

  return card;
}

async function toggleFavorite(storyId, button) {
  try {
    await window.apiClient.toggleFavorite(storyId);

    // Update underlying data arrays first
    const updateStoryInArray = (stories) => {
      return stories.map((story) => {
        if (story.id === storyId) {
          return { ...story, is_favorite: !story.is_favorite };
        }
        return story;
      });
    };

    allStories = updateStoryInArray(allStories);
    filteredStories = updateStoryInArray(filteredStories);

    // Get the new favorite status from updated data
    const updatedStory = allStories.find((story) => story.id === storyId);
    const newFavoriteStatus = updatedStory?.is_favorite || false;

    // Update all cards for this story (both current and other view types)
    const allCards = document.querySelectorAll(".story-card");

    allCards.forEach((card) => {
      // Try to find story ID from read-more-btn (grid view) or favorite button (both views)
      const readBtn = card.querySelector(".read-more-btn");
      const favoriteBtn = card.querySelector(
        ".favorite-btn, .action-btn[onclick*='toggleFavorite']"
      );

      let cardStoryId;
      if (readBtn) {
        // Grid view - extract from read-more-btn
        cardStoryId = readBtn.onclick
          ?.toString()
          .match(/showStoryModal\((\d+)\)/)?.[1];
      } else if (favoriteBtn) {
        // List view - extract from favorite button
        cardStoryId = favoriteBtn.onclick
          ?.toString()
          .match(/toggleFavorite\((\d+),/)?.[1];
      }

      if (cardStoryId == storyId) {
        // Find the favorite button - it could be either favorite-btn or action-btn with heart icon
        const favBtn =
          card.querySelector(".favorite-btn") ||
          card.querySelector(".action-btn[onclick*='toggleFavorite']");

        // Check if this card is in list view mode (has story-stats-row)
        const isCardInListView =
          card.querySelector(".story-stats-row") !== null;

        // Find the appropriate stats container based on card's view mode
        const stats = isCardInListView
          ? card.querySelector(".story-stats-row")
          : card.querySelector(".story-stats");

        if (favBtn) {
          if (newFavoriteStatus) {
            favBtn.classList.add("favorite");
            favBtn.innerHTML =
              "<i class='fa-solid fa-heart' style='color: #ef4444;'></i>";
            favBtn.title = "Remove from favorites";

            // Add favorite indicator to stats if not present
            if (stats && !stats.innerHTML.includes("Favorite")) {
              const favoriteSpan = document.createElement("span");
              favoriteSpan.innerHTML =
                "<i class='fa-solid fa-heart' style='color: #ef4444;'></i> Favorite";
              if (isCardInListView) {
                favoriteSpan.className = "story-favorite-indicator";
              }
              stats.appendChild(favoriteSpan);
            }
          } else {
            favBtn.classList.remove("favorite");
            favBtn.innerHTML = "<i class='fa-regular fa-heart'></i>";
            favBtn.title = "Add to favorites";

            // Remove favorite indicator from stats
            if (stats) {
              const favoriteSpan = stats.querySelector("span:last-child");
              if (favoriteSpan && favoriteSpan.innerHTML.includes("Favorite")) {
                favoriteSpan.remove();
              }
            }
          }
        }
      }
    });

    window.apiClient.showSuccessMessage(
      newFavoriteStatus ? "Added to favorites!" : "Removed from favorites!"
    );
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

    // Update modal meta information
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

    if (modalStoryMeta) {
      modalStoryMeta.textContent = `Created on ${formattedDate}`;
    }

    if (story.image_data || story.image_base64) {
      modalStoryImage.src = `data:image/${story.image_format || "png"};base64,${
        story.image_data || story.image_base64
      }`;
      modalStoryImage.style.display = "block";
    } else {
      modalStoryImage.style.display = "none";
    }

    const wordCount = storyText.split(" ").length;
    const readTime = Math.ceil(wordCount / 200); // Average reading speed
    modalStoryStats.innerHTML = `
            <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
            <span><i class="fas fa-file-text"></i> ${wordCount} words</span>
            <span><i class="fas fa-clock"></i> ${readTime} min read</span>
            ${
              story.is_favorite
                ? '<span><i class="fas fa-heart" style="color: #ef4444;"></i> Favorite</span>'
                : ""
            }
        `;

    // Update favorite button
    modalToggleFavoriteBtn.innerHTML = story.is_favorite
      ? '<i class="fas fa-heart"></i> Remove from Favorites'
      : '<i class="fas fa-heart"></i> Add to Favorites';

    modalToggleFavoriteBtn.className = story.is_favorite
      ? "btn-danger"
      : "btn-primary";

    // Show modal
    storyModal.style.display = "flex";
    storyModal.classList.add("show");
    document.body.style.overflow = "hidden";

    // Set focus trap
    setTimeout(() => {
      closeModal.focus();
    }, 100);
  } catch (error) {
    console.error("Failed to load story:", error);
    window.apiClient.showErrorMessage("Failed to load story details.");
  }
}

function showModal() {
  storyModal.style.display = "flex";
  storyModal.classList.add("show");
  document.body.style.overflow = "hidden";
}

function hideModal() {
  storyModal.style.display = "none";
  storyModal.classList.remove("show");
  document.body.style.overflow = "";
  currentModalStory = null;
}

// Modal event listeners
closeModal?.addEventListener("click", hideModal);
modalCloseBtn?.addEventListener("click", hideModal);

storyModal?.addEventListener("click", (e) => {
  if (e.target === storyModal) {
    hideModal();
  }
});

// Handle escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && storyModal?.style.display === "flex") {
    hideModal();
  }
});

modalToggleFavoriteBtn?.addEventListener("click", async () => {
  if (!currentModalStory) return;

  try {
    await window.apiClient.toggleFavorite(currentModalStory.id);

    // Update current story data
    currentModalStory.is_favorite = !currentModalStory.is_favorite;

    // Update underlying data arrays as well
    const updateStoryInArray = (stories) => {
      return stories.map((story) => {
        if (story.id === currentModalStory.id) {
          return { ...story, is_favorite: currentModalStory.is_favorite };
        }
        return story;
      });
    };

    allStories = updateStoryInArray(allStories);
    filteredStories = updateStoryInArray(filteredStories);

    // Update button
    modalToggleFavoriteBtn.innerHTML = currentModalStory.is_favorite
      ? '<i class="fas fa-heart"></i> Remove from Favorites'
      : '<i class="fas fa-heart"></i> Add to Favorites';

    modalToggleFavoriteBtn.className = currentModalStory.is_favorite
      ? "btn-danger"
      : "btn-primary";

    // Update modal stats
    const wordCount = (
      currentModalStory.generated_text ||
      currentModalStory.text ||
      ""
    ).split(" ").length;
    const readTime = Math.ceil(wordCount / 200);
    const formattedDate = new Date(
      currentModalStory.created_at
    ).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    modalStoryStats.innerHTML = `
      <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
      <span><i class="fas fa-file-text"></i> ${wordCount} words</span>
      <span><i class="fas fa-clock"></i> ${readTime} min read</span>
      ${
        currentModalStory.is_favorite
          ? '<span><i class="fas fa-heart" style="color: #ef4444;"></i> Favorite</span>'
          : ""
      }
    `;

    // Update the corresponding card in the grid
    const cards = document.querySelectorAll(".story-card");

    cards.forEach((card) => {
      // Try to find story ID from read-more-btn (grid view) or favorite button (both views)
      const readBtn = card.querySelector(".read-more-btn");
      const favoriteBtn = card.querySelector(
        ".favorite-btn, .action-btn[onclick*='toggleFavorite']"
      );

      let storyId;
      if (readBtn) {
        // Grid view - extract from read-more-btn
        storyId = readBtn.onclick
          ?.toString()
          .match(/showStoryModal\((\d+)\)/)?.[1];
      } else if (favoriteBtn) {
        // List view - extract from favorite button
        storyId = favoriteBtn.onclick
          ?.toString()
          .match(/toggleFavorite\((\d+),/)?.[1];
      }

      if (storyId == currentModalStory.id) {
        // Find the favorite button - it could be either favorite-btn or action-btn with heart icon
        const favBtn =
          card.querySelector(".favorite-btn") ||
          card.querySelector(".action-btn[onclick*='toggleFavorite']");

        // Check if this card is in list view mode (has story-stats-row)
        const isCardInListView =
          card.querySelector(".story-stats-row") !== null;

        // Find the appropriate stats container based on card's view mode
        const stats = isCardInListView
          ? card.querySelector(".story-stats-row")
          : card.querySelector(".story-stats");

        if (favBtn) {
          if (currentModalStory.is_favorite) {
            favBtn.classList.add("favorite");
            favBtn.innerHTML =
              "<i class='fa-solid fa-heart' style='color: #ef4444;'></i>";
            favBtn.title = "Remove from favorites";

            // Add favorite indicator to stats if not present
            if (stats && !stats.innerHTML.includes("Favorite")) {
              const favoriteSpan = document.createElement("span");
              favoriteSpan.innerHTML =
                "<i class='fa-solid fa-heart' style='color: #ef4444;'></i> Favorite";
              if (isCardInListView) {
                favoriteSpan.className = "story-favorite-indicator";
              }
              stats.appendChild(favoriteSpan);
            }
          } else {
            favBtn.classList.remove("favorite");
            favBtn.innerHTML = "<i class='fa-regular fa-heart'></i>";
            favBtn.title = "Add to favorites";

            // Remove favorite indicator from stats
            if (stats) {
              const favoriteSpan = stats.querySelector("span:last-child");
              if (favoriteSpan && favoriteSpan.innerHTML.includes("Favorite")) {
                favoriteSpan.remove();
              }
            }
          }
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

modalDeleteBtn?.addEventListener("click", async () => {
  if (!currentModalStory) return;

  const confirmed = await window.apiClient.showConfirmationModal(
    "Delete Story",
    "Are you sure you want to delete this story? This action cannot be undone.",
    "Delete Story",
    "Cancel"
  );

  if (!confirmed) return;

  try {
    await window.apiClient.deleteContent(currentModalStory.id);

    // Find and remove the corresponding card
    const cards = document.querySelectorAll(".story-card");
    cards.forEach((card) => {
      // Try to find story ID from read-more-btn (grid view) or favorite button (both views)
      const readBtn = card.querySelector(".read-more-btn");
      const favoriteBtn = card.querySelector(
        ".favorite-btn, .action-btn[onclick*='toggleFavorite']"
      );

      let storyId;
      if (readBtn) {
        // Grid view - extract from read-more-btn
        storyId = readBtn.onclick
          ?.toString()
          .match(/showStoryModal\((\d+)\)/)?.[1];
      } else if (favoriteBtn) {
        // List view - extract from favorite button
        storyId = favoriteBtn.onclick
          ?.toString()
          .match(/toggleFavorite\((\d+),/)?.[1];
      }

      if (storyId == currentModalStory.id) {
        card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        card.style.opacity = "0";
        card.style.transform = "scale(0.8)";

        setTimeout(() => {
          card.remove();

          // Update stories data
          allStories = allStories.filter((s) => s.id !== currentModalStory.id);
          filteredStories = filteredStories.filter(
            (s) => s.id !== currentModalStory.id
          );

          // Check if no stories left
          if (storiesGrid.children.length === 0) {
            showEmptyState();
          } else {
            updateStoriesCount(filteredStories.length);
          }
        }, 300);
      }
    });

    hideModal();
    window.apiClient.showSuccessMessage("Story deleted successfully.");
  } catch (error) {
    console.error("Failed to delete story:", error);
    window.apiClient.showErrorMessage(
      "Failed to delete story. Please try again."
    );
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
