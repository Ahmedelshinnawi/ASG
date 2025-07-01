// DOM elements
const storyForm = document.getElementById("storyForm");
const generateBtn = document.getElementById("generateBtn");
const loadingSpinner = document.getElementById("loadingSpinner");
const btnText = document.getElementById("btnText");
const storyDisplaySection = document.getElementById("storyDisplaySection");
const storyContent = document.getElementById("storyContent");
const storyImage = document.getElementById("storyImage");
const regenerateBtn = document.getElementById("regenerateBtn");
const saveBtn = document.getElementById("saveBtn");

// Modal elements (kept for backwards compatibility)
const resultModal = document.getElementById("resultModal");
const modalStoryContent = document.getElementById("modalStoryContent");
const modalStoryImage = document.getElementById("modalStoryImage");
const closeModal = document.getElementById("closeModal");
const modalRegenerateBtn = document.getElementById("modalRegenerateBtn");
const modalSaveBtn = document.getElementById("modalSaveBtn");

let currentStoryData = null;

// Form submission handler - Connect to real API
storyForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const topic = document.getElementById("storyTopic").value.trim();
  const wordCount = document.getElementById("wordCount").value;
  const genre = document.getElementById("genre").value;
  const language = document.getElementById("language").value;

  if (!topic) {
    window.apiClient.showErrorMessage("Please enter a story topic!");
    return;
  }

  // Check authentication
  if (!window.apiClient.auth.isAuthenticated()) {
    window.apiClient.showAuthRequiredMessage();
    return;
  }

  try {
    // Show loading state
    showLoading();

    // Enhance the prompt with additional details
    let enhancedPrompt = topic;
    if (genre && genre.trim()) {
      enhancedPrompt += ` (Genre: ${genre})`;
    }
    if (wordCount && wordCount.trim()) {
      enhancedPrompt += ` (Length: approximately ${wordCount} words)`;
    }
    if (language && language.trim() && language.toLowerCase() !== "english") {
      enhancedPrompt += ` (Language: ${language})`;
    }

    // Call the real API
    const response = await window.apiClient.generateStory(enhancedPrompt);
    currentStoryData = response;

    // Display the generated story and image inline
    displayStory(response);
    hideLoading();
    showStoryDisplay();
  } catch (error) {
    hideLoading();
    console.error("Story generation failed:", error);

    if (error.message === "Authentication required") {
      // Already handled by the API client
      return;
    }

    window.apiClient.showErrorMessage(
      error.message || "Failed to generate story. Please try again."
    );
  }
});

function showLoading() {
  generateBtn.disabled = true;
  loadingSpinner.style.display = "block";
  btnText.textContent = "Generating your story...";
}

function hideLoading() {
  generateBtn.disabled = false;
  loadingSpinner.style.display = "none";
  btnText.textContent = "🚀 Generate";
}

function displayStory(storyData) {
  // Display the generated text in inline display
  storyContent.textContent = storyData.text;

  // Display the generated image
  if (storyData.image_base64) {
    storyImage.src = `data:image/${storyData.image_format || "png"};base64,${
      storyData.image_base64
    }`;
    storyImage.style.display = "block";
  } else {
    storyImage.style.display = "none";
  }
}

function showStoryDisplay() {
  storyDisplaySection.classList.add("active");
  storyDisplaySection.scrollIntoView({ behavior: "smooth" });
}

function hideStoryDisplay() {
  storyDisplaySection.classList.remove("active");
}

// Modal functions (kept for backwards compatibility)
function showModal() {
  resultModal.style.display = "flex";
  setTimeout(() => {
    resultModal.style.opacity = "1";
    resultModal.querySelector(".modal-content").style.transform = "scale(1)";
  }, 10);
}

function hideModal() {
  resultModal.style.opacity = "0";
  resultModal.querySelector(".modal-content").style.transform = "scale(0.8)";
  setTimeout(() => {
    resultModal.style.display = "none";
  }, 300);
}

// Inline story display event listeners
regenerateBtn.addEventListener("click", () => {
  hideStoryDisplay();
  storyForm.dispatchEvent(new Event("submit"));
});

saveBtn.addEventListener("click", async () => {
  if (!currentStoryData) {
    window.apiClient.showErrorMessage("No story to save!");
    return;
  }

  try {
    // Toggle favorite status (this will save it as favorite)
    await window.apiClient.toggleFavorite(currentStoryData.id);
    window.apiClient.showSuccessMessage(
      "Story saved to your favorites! 📚\nView it in your Favorites page."
    );
  } catch (error) {
    console.error("Failed to save story:", error);
    window.apiClient.showErrorMessage(
      error.message || "Failed to save story. Please try again."
    );
  }
});

// Modal event listeners (kept for backwards compatibility)
closeModal.addEventListener("click", hideModal);

resultModal.addEventListener("click", (e) => {
  if (e.target === resultModal) {
    hideModal();
  }
});

modalRegenerateBtn.addEventListener("click", () => {
  hideModal();
  storyForm.dispatchEvent(new Event("submit"));
});

modalSaveBtn.addEventListener("click", async () => {
  if (!currentStoryData) {
    window.apiClient.showErrorMessage("No story to save!");
    return;
  }

  try {
    // Toggle favorite status (this will save it as favorite)
    await window.apiClient.toggleFavorite(currentStoryData.id);
    window.apiClient.showSuccessMessage(
      "Story saved to your favorites! 📚\nView it in your Favorites page."
    );
    hideModal();
  } catch (error) {
    console.error("Failed to save story:", error);
    window.apiClient.showErrorMessage(
      error.message || "Failed to save story. Please try again."
    );
  }
});

// Auto-resize textarea
document.getElementById("storyTopic").addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";
});

// Add animation effects
document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".generator-card");
  container.style.opacity = "0";
  container.style.transform = "translateY(50px)";

  setTimeout(() => {
    container.style.transition = "opacity 1s ease, transform 1s ease";
    container.style.opacity = "1";
    container.style.transform = "translateY(0)";
  }, 500);
});

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Ctrl/Cmd + Enter to generate story
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    if (!generateBtn.disabled) {
      storyForm.dispatchEvent(new Event("submit"));
    }
  }

  // Escape to close modal
  if (e.key === "Escape") {
    hideModal();
    const keywordsModal = document.getElementById("keywordsModal");
    if (keywordsModal && keywordsModal.style.display === "flex") {
      const hideKeywordsModalFunc = window.hideKeywordsModal;
      if (hideKeywordsModalFunc) {
        hideKeywordsModalFunc();
      }
    }
  }
});

// User Dropdown Navigation Functionality
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Content Loaded - Initializing all components...");

  // Initialize keywords modal first
  setTimeout(() => {
    initializeKeywordsModal();
    initializeKeywordTags();
  }, 100);

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
    console.log("Profile Settings button clicked"); // Debug log
    closeDropdown(); // Close dropdown first
    if (window.profileSettingsModal) {
      console.log("Opening profile settings modal..."); // Debug log
      window.profileSettingsModal.open();
    } else {
      console.error("Profile settings modal not available!"); // Debug log
      alert(
        "Profile settings modal is not available. Please refresh the page and try again."
      );
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

// Keywords Info Modal functionality
function initializeKeywordsModal() {
  const keywordsInfoIcon = document.getElementById("keywordsInfoIcon");
  const keywordsModal = document.getElementById("keywordsModal");
  const closeKeywordsModal = document.getElementById("closeKeywordsModal");

  console.log("Initializing keywords modal...");
  console.log("keywordsInfoIcon:", keywordsInfoIcon);
  console.log("keywordsModal:", keywordsModal);
  console.log("closeKeywordsModal:", closeKeywordsModal);

  if (!keywordsInfoIcon || !keywordsModal || !closeKeywordsModal) {
    console.error("Keywords modal elements not found!");
    return;
  }

  function showKeywordsModal() {
    console.log("Showing keywords modal...");
    keywordsModal.style.display = "flex";
    document.body.style.overflow = "hidden";

    // Force reflow and add animation
    keywordsModal.offsetHeight;
    keywordsModal.classList.add("show");

    // Scale animation for modal content
    const modalContent = keywordsModal.querySelector(".modal-content");
    if (modalContent) {
      modalContent.style.transform = "scale(0.8)";
      setTimeout(() => {
        modalContent.style.transform = "scale(1)";
      }, 10);
    }
  }

  function hideKeywordsModal() {
    console.log("Hiding keywords modal...");
    keywordsModal.classList.remove("show");

    // Scale animation for modal content
    const modalContent = keywordsModal.querySelector(".modal-content");
    if (modalContent) {
      modalContent.style.transform = "scale(0.8)";
    }

    setTimeout(() => {
      keywordsModal.style.display = "none";
      document.body.style.overflow = "auto";
    }, 300);
  }

  // Expose hideKeywordsModal globally for escape key handler
  window.hideKeywordsModal = hideKeywordsModal;

  // Event listeners for keywords modal
  keywordsInfoIcon.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Info icon clicked!");
    showKeywordsModal();
  });

  closeKeywordsModal.addEventListener("click", hideKeywordsModal);

  // Close modal when clicking outside
  keywordsModal.addEventListener("click", (e) => {
    if (e.target === keywordsModal) {
      hideKeywordsModal();
    }
  });

  console.log("Keywords modal initialized successfully!");
}

// Add click functionality to keyword tags (copy to clipboard)
function initializeKeywordTags() {
  const keywordTags = document.querySelectorAll(".keyword-tag");
  console.log("Found keyword tags:", keywordTags.length);

  keywordTags.forEach((tag) => {
    tag.addEventListener("click", async () => {
      const keyword = tag.textContent;

      try {
        await navigator.clipboard.writeText(keyword);

        // Show feedback
        const originalText = tag.textContent;
        tag.textContent = "Copied!";
        tag.style.background = "linear-gradient(135deg, #10b981, #059669)";
        tag.style.color = "white";

        setTimeout(() => {
          tag.textContent = originalText;
          tag.style.background = "";
          tag.style.color = "";
        }, 1000);
      } catch (err) {
        console.log("Failed to copy keyword:", err);
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = keyword;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);

        // Show feedback
        const originalText = tag.textContent;
        tag.textContent = "Copied!";
        tag.style.background = "linear-gradient(135deg, #10b981, #059669)";
        tag.style.color = "white";

        setTimeout(() => {
          tag.textContent = originalText;
          tag.style.background = "";
          tag.style.color = "";
        }, 1000);
      }
    });
  });
}
