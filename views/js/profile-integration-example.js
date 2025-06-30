// Authentication simulation and UI management
      let isAuthenticated = false;

      function updateAuthStatus() {
        const statusIndicator = document.getElementById("statusIndicator");
        const statusText = document.getElementById("statusText");
        const loginBtn = document.getElementById("loginBtn");
        const navProfile = document.getElementById("navProfile");

        if (window.apiClient && window.apiClient.auth.isAuthenticated()) {
          isAuthenticated = true;
          statusIndicator.classList.add("authenticated");
          statusText.textContent = "Authenticated";
          loginBtn.style.display = "none";
          navProfile.style.display = "flex";
        } else if (isAuthenticated) {
          // Demo mode - simulated authentication
          statusIndicator.classList.add("authenticated");
          statusText.textContent = "Demo Mode (Simulated)";
          loginBtn.style.display = "none";
          navProfile.style.display = "flex";
        } else {
          statusIndicator.classList.remove("authenticated");
          statusText.textContent = "Not Authenticated";
          loginBtn.style.display = "block";
          navProfile.style.display = "none";
        }
      }

      // Event listeners
      document.addEventListener("DOMContentLoaded", () => {
        // Profile settings button
        document
          .getElementById("profileSettingsBtn")
          ?.addEventListener("click", () => {
            if (window.profileSettingsModal) {
              window.profileSettingsModal.open();
            }
          });

        // Demo buttons
        document
          .getElementById("openProfileModal")
          ?.addEventListener("click", () => {
            if (window.profileSettingsModal) {
              window.profileSettingsModal.open();
            }
          });

        document
          .getElementById("simulateLogin")
          ?.addEventListener("click", () => {
            isAuthenticated = true;
            updateAuthStatus();
          });

        document
          .getElementById("simulateLogout")
          ?.addEventListener("click", () => {
            isAuthenticated = false;
            updateAuthStatus();
          });

        document
          .getElementById("toggleTheme")
          ?.addEventListener("click", () => {
            const currentTheme =
              document.documentElement.getAttribute("data-theme");
            const newTheme = currentTheme === "dark" ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", newTheme);
            localStorage.setItem("theme", newTheme);
          });

        // Login button
        document.getElementById("loginBtn")?.addEventListener("click", () => {
          window.location.href = "/welcome.html";
        });

        // Initialize theme
        const savedTheme = localStorage.getItem("theme") || "light";
        document.documentElement.setAttribute("data-theme", savedTheme);

        // Initial auth status
        updateAuthStatus();

        // Listen for profile updates
        window.addEventListener("profileUpdated", (event) => {
          console.log("Profile updated:", event.detail);

          // Update user name in navigation
          const userName = document.getElementById("userName");
          if (userName && event.detail.fullName) {
            userName.textContent = event.detail.fullName;
          }

          // Show success notification
          const notification = document.createElement("div");
          notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: white;
                    padding: 16px 24px;
                    border-radius: 12px;
                    font-weight: 600;
                    z-index: 10000;
                    transform: translateX(100%);
                    transition: transform 0.3s ease;
                    box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
                `;
          notification.innerHTML = `
                    <i class="fas fa-check-circle" style="margin-right: 8px;"></i>
                    Profile updated successfully!
                `;

          document.body.appendChild(notification);

          setTimeout(() => {
            notification.style.transform = "translateX(0)";
          }, 100);

          setTimeout(() => {
            notification.style.transform = "translateX(100%)";
            setTimeout(() => notification.remove(), 300);
          }, 3000);
        });

        // Check auth status periodically
        setInterval(updateAuthStatus, 5000);
      });