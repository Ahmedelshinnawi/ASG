// DOM elements
      const teamImage = document.getElementById("teamImage");
      const particles = document.getElementById("particles");

      // Initialize the page
      document.addEventListener("DOMContentLoaded", function () {
        initializeAnimations();
        createParticles();
        setupScrollAnimations();
        setupInteractiveElements();
        initializeAuthentication();
      });

      function initializeAnimations() {
        // Animate elements on page load
        setTimeout(() => {
          const elements = document.querySelectorAll(".fade-in");
          elements.forEach((element, index) => {
            setTimeout(() => {
              element.classList.add("visible");
            }, index * 200);
          });
        }, 300);
      }

      function createParticles() {
        const particleCount = 20;

        for (let i = 0; i < particleCount; i++) {
          const particle = document.createElement("div");
          particle.className = "particle";

          const size = Math.random() * 4 + 2;
          particle.style.width = size + "px";
          particle.style.height = size + "px";
          particle.style.left = Math.random() * 100 + "%";
          particle.style.animationDuration = Math.random() * 3 + 7 + "s";
          particle.style.animationDelay = Math.random() * 2 + "s";

          particles.appendChild(particle);
        }
      }

      function setupScrollAnimations() {
        const observerOptions = {
          threshold: 0.1,
          rootMargin: "0px 0px -50px 0px",
        };

        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
            }
          });
        }, observerOptions);

        // Observe elements for scroll animations
        document.querySelectorAll(".fade-in").forEach((el) => {
          observer.observe(el);
        });
      }

      function setupInteractiveElements() {
        // Team image interaction
        teamImage.addEventListener("click", function () {
          this.style.transform = "scale(1.05) rotate(1deg)";
          setTimeout(() => {
            this.style.transform = "scale(1) rotate(0deg)";
          }, 300);

          showToast("Meet our amazing team! 👥✨");
        });

        // Team member card interaction
        const memberCards = document.querySelectorAll(".team-member-card");
        memberCards.forEach((memberCard) => {
          memberCard.addEventListener("mouseenter", function () {
            this.style.transform = "translateY(-15px) scale(1.02)";
          });

          memberCard.addEventListener("mouseleave", function () {
            this.style.transform = "translateY(0) scale(1)";
          });

          // Add click interaction for team member cards
          memberCard.addEventListener("click", function () {
            const memberName = this.querySelector(".member-name").textContent;
            const memberRole = this.querySelector(".member-role").textContent;
            showToast(`Meet ${memberName} - ${memberRole}! 👨‍💻✨`);
          });
        });

        // Social links interaction
        document
          .querySelectorAll(".social-link, .footer-social-icon")
          .forEach((link) => {
            link.addEventListener("click", function (e) {
              e.preventDefault();
              const platform = this.getAttribute("title") || "Social media";
              showToast(`${platform} link clicked! 🔗`);
            });
          });

        // Navigation links
        document.querySelectorAll(".nav-link").forEach((link) => {
          link.addEventListener("click", function (e) {
            if (this.getAttribute("href") === "#") {
              e.preventDefault();
              showToast(
                `${this.textContent} functionality would be implemented here.`
              );
            }
          });
        });

        // Footer links
        document.querySelectorAll(".footer-link").forEach((link) => {
          link.addEventListener("click", function (e) {
            if (this.getAttribute("href") === "#") {
              e.preventDefault();
              showToast(`${this.textContent} page would be implemented here.`);
            }
          });
        });
      }

      function showToast(message, type = "info") {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll(".toast");
        existingToasts.forEach((toast) => toast.remove());

        // Create new toast
        const toast = document.createElement("div");
        toast.className = "toast";
        toast.style.cssText = `
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 1rem 2rem;
          border-radius: 0.5rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          transform: translateY(100px);
          opacity: 0;
          transition: all 0.3s ease;
          z-index: 1000;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        `;
        toast.textContent = message;

        document.body.appendChild(toast);

        // Show toast
        setTimeout(() => {
          toast.style.transform = "translateY(0)";
          toast.style.opacity = "1";
        }, 100);

        // Hide toast after 3 seconds
        setTimeout(() => {
          toast.style.transform = "translateY(100px)";
          toast.style.opacity = "0";
          setTimeout(() => {
            if (toast.parentNode) {
              toast.remove();
            }
          }, 300);
        }, 3000);
      }

      // Parallax effect for team image
      window.addEventListener("scroll", () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.3;

        if (teamImage) {
          teamImage.style.transform = `translateY(${rate}px)`;
        }
      });

      // Keyboard shortcuts
      document.addEventListener("keydown", function (e) {
        // Press 'H' to go to home
        if (e.key.toLowerCase() === "h" && !e.ctrlKey && !e.altKey) {
          const activeElement = document.activeElement;
          if (
            activeElement.tagName !== "INPUT" &&
            activeElement.tagName !== "TEXTAREA"
          ) {
            window.location.href = "index.html";
          }
        }

        // Press 'G' to go to generate story
        if (e.key.toLowerCase() === "g" && !e.ctrlKey && !e.altKey) {
          const activeElement = document.activeElement;
          if (
            activeElement.tagName !== "INPUT" &&
            activeElement.tagName !== "TEXTAREA"
          ) {
            window.location.href = "generate-story.html";
          }
        }
      });

      // Dynamic background gradient
      function updateGradient() {
        const time = Date.now() * 0.0001;
        const x = Math.sin(time) * 50 + 50;
        const y = Math.cos(time * 0.7) * 50 + 50;

        document.body.style.background = `
          radial-gradient(circle at ${x}% ${y}%, 
            rgba(59, 130, 246, 0.8) 0%, 
            rgba(37, 99, 235, 0.9) 50%, 
            rgba(29, 78, 216, 1) 100%
          )
        `;
      }

      // Update gradient every 100ms for smooth animation
      setInterval(updateGradient, 100);

      // Add some interactive glow effects
      document
        .querySelectorAll(".team-member-card, .company-description")
        .forEach((element) => {
          element.addEventListener("mouseenter", function () {
            if (this.classList.contains("team-member-card")) {
              this.style.boxShadow = "0 30px 60px rgba(236, 72, 153, 0.4)";
            } else {
              this.style.boxShadow = "0 20px 40px rgba(236, 72, 153, 0.3)";
            }
          });

          element.addEventListener("mouseleave", function () {
            if (this.classList.contains("team-member-card")) {
              this.style.boxShadow = "0 20px 40px rgba(0, 0, 0, 0.2)";
            } else {
              this.style.boxShadow = "0 20px 40px rgba(0, 0, 0, 0.2)";
            }
          });
        });

      // Loading animation for images
      teamImage.addEventListener("load", function () {
        this.style.opacity = "0";
        this.style.transition = "opacity 0.5s ease";
        setTimeout(() => {
          this.style.opacity = "1";
        }, 100);
      });

      // User Dropdown Navigation Functionality
      async function initializeAuthentication() {
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
              const dropdownUserName =
                document.getElementById("dropdownUserName");
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
              const dropdownUserEmail =
                document.getElementById("dropdownUserEmail");
              if (dropdownUserEmail && profile.email) {
                dropdownUserEmail.textContent = profile.email;
              }

              // Update profile pictures
              const userAvatar = document.getElementById("userAvatar");
              const dropdownAvatar = document.querySelector(".dropdown-avatar");
              const profilePictureUrl =
                profile.profile_picture ||
                window.apiClient.getDefaultAvatarUrl();

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
        const profileSettingsBtn =
          document.getElementById("profileSettingsBtn");
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

        // Connect login button
        const loginBtn = document.querySelector(".login-btn");
        loginBtn?.addEventListener("click", () => {
          window.location.href = "welcome.html";
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
        await updateNavigation();

        // Check auth status periodically
        setInterval(async () => {
          await updateNavigation();
        }, 5000);
      }