document.addEventListener("DOMContentLoaded", () => {
  console.log("Welcome page initializing...");

  const elements = {
    loginTab: document.getElementById("loginTab"),
    registerTab: document.getElementById("registerTab"),
    loginForm: document.getElementById("loginForm"),
    registerForm: document.getElementById("registerForm"),
    loginUsernameInput: document.getElementById("loginUsername"),
    loginPasswordInput: document.getElementById("loginPassword"),
    loginBtn: document.getElementById("loginBtn"),
    loginSpinner: document.getElementById("loginSpinner"),
    loginBtnText: document.getElementById("loginBtnText"),
    loginError: document.getElementById("loginError"),
    registerFirstNameInput: document.getElementById("registerFirstName"),
    registerLastNameInput: document.getElementById("registerLastName"),
    registerUsernameInput: document.getElementById("registerUsername"),
    registerEmailInput: document.getElementById("registerEmail"),
    registerGenderInput: document.getElementById("registerGender"),
    registerPasswordInput: document.getElementById("registerPassword"),
    registerConfirmPasswordInput: document.getElementById(
      "registerConfirmPassword"
    ),
    registerBtn: document.getElementById("registerBtn"),
    registerSpinner: document.getElementById("registerSpinner"),
    registerBtnText: document.getElementById("registerBtnText"),
    registerError: document.getElementById("registerError"),
    registerSuccess: document.getElementById("registerSuccess"),
    forgotPasswordLink: document.getElementById("forgotPasswordLink"),
    resetModal: document.getElementById("resetModal"),
    closeResetModal: document.getElementById("closeResetModal"),
    resetPasswordForm: document.getElementById("resetPasswordForm"),
    resetEmailInput: document.getElementById("resetEmail"),
    resetBtn: document.getElementById("resetBtn"),
    resetSpinner: document.getElementById("resetSpinner"),
    resetBtnText: document.getElementById("resetBtnText"),
    resetError: document.getElementById("resetError"),
    resetSuccess: document.getElementById("resetSuccess"),
  };

  console.log("Password validation elements found:", {
    passwordInput: !!elements.registerPasswordInput,
    confirmInput: !!elements.registerConfirmPasswordInput,
    requirements: !!document.getElementById("registerPasswordRequirements"),
    matchIndicator: !!document.getElementById("registerPasswordMatchIndicator"),
  });

  function validatePassword(password) {
    return {
      length: password.length >= 8,
      letter: /[a-zA-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
  }

  function updatePasswordRequirements(password) {
    console.log("Updating password requirements for:", password);

    const requirementsDiv = document.getElementById(
      "registerPasswordRequirements"
    );
    if (!requirementsDiv) {
      console.error("Requirements div not found!");
      return false;
    }

    const requirements = validatePassword(password);
    console.log("Requirements:", requirements);

    // Always show requirements if div is visible, update validation state
    const reqElements = {
      length: document.getElementById("registerLengthReq"),
      letter: document.getElementById("registerLetterReq"),
      number: document.getElementById("registerNumberReq"),
      special: document.getElementById("registerSpecialReq"),
    };

    Object.keys(requirements).forEach((key) => {
      const element = reqElements[key];
      if (element) {
        const icon = element.querySelector("i");
        if (requirements[key]) {
          element.classList.add("valid");
          if (icon) {
            icon.className = "fas fa-check";
          }
          console.log(`${key} requirement: VALID`);
        } else {
          element.classList.remove("valid");
          if (icon) {
            icon.className = "fas fa-times";
          }
          console.log(`${key} requirement: INVALID`);
        }
      } else {
        console.error(`${key} requirement element not found!`);
      }
    });

    return Object.values(requirements).every((req) => req);
  }

  function updatePasswordMatch(password, confirmPassword) {
    console.log("Updating password match:", { password, confirmPassword });

    const matchIndicator = document.getElementById(
      "registerPasswordMatchIndicator"
    );
    const confirmInput = elements.registerConfirmPasswordInput;

    if (!matchIndicator || !confirmInput) {
      console.error("Match indicator or confirm input not found!");
      return;
    }

    if (!confirmPassword || confirmPassword.length === 0) {
      matchIndicator.style.display = "none";
      confirmInput.classList.remove("error", "success");
      return;
    }

    matchIndicator.style.display = "block";
    const icon = matchIndicator.querySelector("i");
    const span = matchIndicator.querySelector("span");

    if (password === confirmPassword && password.length > 0) {
      matchIndicator.classList.add("success");
      matchIndicator.classList.remove("error");
      if (icon) icon.className = "fas fa-check";
      if (span) span.textContent = "Passwords match";
      confirmInput.classList.remove("error");
      confirmInput.classList.add("success");
      console.log("Passwords match!");
    } else {
      matchIndicator.classList.remove("success");
      matchIndicator.classList.add("error");
      if (icon) icon.className = "fas fa-times";
      if (span) span.textContent = "Passwords do not match";
      confirmInput.classList.remove("success");
      confirmInput.classList.add("error");
      console.log("Passwords do not match");
    }
  }

  function showError(element, message) {
    if (element) {
      element.textContent = message;
      element.style.display = "block";
    }
  }

  function showSuccess(element, message) {
    if (element) {
      element.textContent = message;
      element.style.display = "block";
    }
  }

  function showLoading(btn, spinner, textEl, loadingText) {
    if (btn) btn.disabled = true;
    if (spinner) spinner.style.display = "block";
    if (textEl) textEl.textContent = loadingText;
  }

  function hideLoading(btn, spinner, textEl, originalText) {
    if (btn) btn.disabled = false;
    if (spinner) spinner.style.display = "none";
    if (textEl) textEl.textContent = originalText;
  }

  function clearMessages() {
    const messages = [
      elements.loginError,
      elements.registerError,
      elements.registerSuccess,
    ];
    messages.forEach((msg) => {
      if (msg) msg.style.display = "none";
    });
  }

  function clearResetMessages() {
    const messages = [elements.resetError, elements.resetSuccess];
    messages.forEach((msg) => {
      if (msg) msg.style.display = "none";
    });
  }

  if (elements.loginTab) {
    elements.loginTab.addEventListener("click", () => {
      elements.loginTab.classList.add("active");
      elements.registerTab.classList.remove("active");
      elements.loginForm.classList.add("active");
      elements.registerForm.classList.remove("active");
      clearMessages();
    });
  }

  if (elements.registerTab) {
    elements.registerTab.addEventListener("click", () => {
      elements.registerTab.classList.add("active");
      elements.loginTab.classList.remove("active");
      elements.registerForm.classList.add("active");
      elements.loginForm.classList.remove("active");
      clearMessages();
    });
  }

  if (elements.registerPasswordInput) {
    console.log("✓ Adding password validation event listener");

    // Show requirements on focus or when user starts typing
    elements.registerPasswordInput.addEventListener("focus", () => {
      const requirementsDiv = document.getElementById(
        "registerPasswordRequirements"
      );
      if (requirementsDiv) {
        requirementsDiv.style.display = "block";
      }
    });

    // Only hide requirements on blur if password is empty
    elements.registerPasswordInput.addEventListener("blur", (e) => {
      const password = e.target.value;
      const requirementsDiv = document.getElementById(
        "registerPasswordRequirements"
      );
      if (requirementsDiv && password.length === 0) {
        requirementsDiv.style.display = "none";
      }
    });

    elements.registerPasswordInput.addEventListener("input", (e) => {
      const password = e.target.value;
      console.log("Password input changed:", password);

      try {
        // Always show requirements when user starts typing
        const requirementsDiv = document.getElementById(
          "registerPasswordRequirements"
        );
        if (requirementsDiv) {
          requirementsDiv.style.display = "block";
        }

        const isValid = updatePasswordRequirements(password);

        // Update input styling based on password validity
        if (password.length > 0) {
          elements.registerPasswordInput.classList.remove("error", "success");
          elements.registerPasswordInput.classList.add(
            isValid ? "success" : "error"
          );
        } else {
          elements.registerPasswordInput.classList.remove("error", "success");
        }

        // Update password match if confirm password has value
        if (
          elements.registerConfirmPasswordInput &&
          elements.registerConfirmPasswordInput.value
        ) {
          updatePasswordMatch(
            password,
            elements.registerConfirmPasswordInput.value
          );
        }
      } catch (error) {
        console.error("Error in password validation:", error);
      }
    });
  } else {
    console.error("✗ Password input not found!");
  }

  if (elements.registerConfirmPasswordInput) {
    console.log("✓ Adding confirm password validation event listener");

    // Add real-time validation on input
    elements.registerConfirmPasswordInput.addEventListener("input", (e) => {
      const confirmPassword = e.target.value;
      const password = elements.registerPasswordInput
        ? elements.registerPasswordInput.value
        : "";
      console.log("Confirm password input changed:", confirmPassword);

      try {
        updatePasswordMatch(password, confirmPassword);

        // Additional visual feedback for the confirm password field
        if (confirmPassword.length > 0) {
          const isMatching =
            password === confirmPassword && password.length > 0;
          elements.registerConfirmPasswordInput.classList.remove(
            "error",
            "success"
          );
          elements.registerConfirmPasswordInput.classList.add(
            isMatching ? "success" : "error"
          );
        } else {
          elements.registerConfirmPasswordInput.classList.remove(
            "error",
            "success"
          );
        }
      } catch (error) {
        console.error("Error in confirm password validation:", error);
      }
    });

    // Also validate on focus to show immediate feedback
    elements.registerConfirmPasswordInput.addEventListener("focus", (e) => {
      const confirmPassword = e.target.value;
      const password = elements.registerPasswordInput
        ? elements.registerPasswordInput.value
        : "";

      if (confirmPassword.length > 0) {
        const isMatching = password === confirmPassword && password.length > 0;
        elements.registerConfirmPasswordInput.classList.remove(
          "error",
          "success"
        );
        elements.registerConfirmPasswordInput.classList.add(
          isMatching ? "success" : "error"
        );
      }
    });
  } else {
    console.error("✗ Confirm password input not found!");
  }

  if (elements.forgotPasswordLink) {
    elements.forgotPasswordLink.addEventListener("click", (e) => {
      e.preventDefault();
      if (elements.resetModal) {
        elements.resetModal.style.display = "flex";
        if (elements.resetEmailInput) elements.resetEmailInput.focus();
      }
    });
  }

  if (elements.closeResetModal) {
    elements.closeResetModal.addEventListener("click", () => {
      if (elements.resetModal) {
        elements.resetModal.style.display = "none";
        clearResetMessages();
      }
    });
  }

  if (elements.resetModal) {
    elements.resetModal.addEventListener("click", (e) => {
      if (e.target === elements.resetModal) {
        elements.resetModal.style.display = "none";
        clearResetMessages();
      }
    });
  }

  if (elements.loginForm) {
    elements.loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearMessages();

      const username = elements.loginUsernameInput
        ? elements.loginUsernameInput.value.trim()
        : "";
      const password = elements.loginPasswordInput
        ? elements.loginPasswordInput.value.trim()
        : "";

      if (!username || !password) {
        showError(elements.loginError, "Please fill in all fields");
        return;
      }

      try {
        showLoading(
          elements.loginBtn,
          elements.loginSpinner,
          elements.loginBtnText,
          "Logging in..."
        );
        const user = await window.apiClient.login(username, password);
        window.location.href = "/index.html";
      } catch (error) {
        hideLoading(
          elements.loginBtn,
          elements.loginSpinner,
          elements.loginBtnText,
          "Continue"
        );
        showError(
          elements.loginError,
          error.message || "Login failed. Please try again."
        );
      }
    });
  }

  if (elements.registerForm) {
    elements.registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearMessages();

      const firstName = elements.registerFirstNameInput
        ? elements.registerFirstNameInput.value.trim()
        : "";
      const lastName = elements.registerLastNameInput
        ? elements.registerLastNameInput.value.trim()
        : "";
      const username = elements.registerUsernameInput
        ? elements.registerUsernameInput.value.trim()
        : "";
      const email = elements.registerEmailInput
        ? elements.registerEmailInput.value.trim()
        : "";
      const gender = elements.registerGenderInput
        ? elements.registerGenderInput.value
        : "";
      const password = elements.registerPasswordInput
        ? elements.registerPasswordInput.value.trim()
        : "";
      const confirmPassword = elements.registerConfirmPasswordInput
        ? elements.registerConfirmPasswordInput.value.trim()
        : "";

      if (
        !firstName ||
        !lastName ||
        !username ||
        !email ||
        !gender ||
        !password ||
        !confirmPassword
      ) {
        showError(elements.registerError, "Please fill in all fields");
        return;
      }

      if (password !== confirmPassword) {
        showError(elements.registerError, "Passwords do not match");
        return;
      }

      // Validate password strength before submitting
      const passwordValidation = validatePassword(password);
      const isPasswordValid = Object.values(passwordValidation).every(
        (req) => req
      );

      if (!isPasswordValid) {
        const failedRequirements = [];
        if (!passwordValidation.length)
          failedRequirements.push("at least 8 characters");
        if (!passwordValidation.letter)
          failedRequirements.push("at least one letter");
        if (!passwordValidation.number)
          failedRequirements.push("at least one number");
        if (!passwordValidation.special)
          failedRequirements.push("at least one special character (!@#$%^&*)");

        showError(
          elements.registerError,
          `Password must contain ${failedRequirements.join(", ")}`
        );

        // Show password requirements if they're hidden
        const requirementsDiv = document.getElementById(
          "registerPasswordRequirements"
        );
        if (requirementsDiv) {
          requirementsDiv.style.display = "block";
        }

        return;
      }

      try {
        showLoading(
          elements.registerBtn,
          elements.registerSpinner,
          elements.registerBtnText,
          "Creating account..."
        );

        await window.apiClient.register(username, email, password);

        hideLoading(
          elements.registerBtn,
          elements.registerSpinner,
          elements.registerBtnText,
          "Continue"
        );
        showSuccess(
          elements.registerSuccess,
          "Account created successfully! You can now login."
        );

        const inputs = [
          elements.registerFirstNameInput,
          elements.registerLastNameInput,
          elements.registerUsernameInput,
          elements.registerEmailInput,
          elements.registerPasswordInput,
          elements.registerConfirmPasswordInput,
        ];

        inputs.forEach((input) => {
          if (input) input.value = "";
        });

        if (elements.registerGenderInput)
          elements.registerGenderInput.value = "";

        const requirementsDiv = document.getElementById(
          "registerPasswordRequirements"
        );
        const matchIndicator = document.getElementById(
          "registerPasswordMatchIndicator"
        );
        if (requirementsDiv) requirementsDiv.style.display = "none";
        if (matchIndicator) matchIndicator.style.display = "none";

        if (elements.registerPasswordInput)
          elements.registerPasswordInput.classList.remove("error", "success");
        if (elements.registerConfirmPasswordInput)
          elements.registerConfirmPasswordInput.classList.remove(
            "error",
            "success"
          );

        document
          .querySelectorAll("#registerPasswordRequirements .requirement")
          .forEach((req) => {
            req.classList.remove("valid");
            const icon = req.querySelector("i");
            if (icon) {
              icon.className = "fas fa-times";
            }
          });

        setTimeout(() => {
          if (elements.loginTab) elements.loginTab.click();
        }, 2000);
      } catch (error) {
        hideLoading(
          elements.registerBtn,
          elements.registerSpinner,
          elements.registerBtnText,
          "Continue"
        );

        let errorMessage = "Registration failed. Please try again.";

        if (error.message) {
          if (
            error.message.includes("Password must be at least 8 characters")
          ) {
            errorMessage = "Password must be at least 8 characters long";
          } else if (
            error.message.includes("Password must contain at least one letter")
          ) {
            errorMessage = "Password must contain at least one letter";
          } else if (
            error.message.includes("Password must contain at least one number")
          ) {
            errorMessage = "Password must contain at least one number";
          } else if (
            error.message.includes(
              "Password must contain at least one special character"
            )
          ) {
            errorMessage =
              "Password must contain at least one special character (!@#$%^&*)";
          } else if (error.message.includes("Username already registered")) {
            errorMessage =
              "Username is already taken. Please choose a different username.";
          } else if (error.message.includes("Email already registered")) {
            errorMessage =
              "Email is already registered. Please use a different email or try logging in.";
          } else {
            errorMessage = error.message;
          }
        }

        showError(elements.registerError, errorMessage);
      }
    });
  }

  if (elements.resetPasswordForm) {
    elements.resetPasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearResetMessages();

      const email = elements.resetEmailInput
        ? elements.resetEmailInput.value.trim()
        : "";

      if (!email) {
        showError(elements.resetError, "Please enter your email address");
        return;
      }

      try {
        showLoading(
          elements.resetBtn,
          elements.resetSpinner,
          elements.resetBtnText,
          "Sending..."
        );

        const response = await fetch(
          `${window.location.origin}/auth/request-password-reset`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || "Failed to send reset email");
        }

        const data = await response.json();
        hideLoading(
          elements.resetBtn,
          elements.resetSpinner,
          elements.resetBtnText,
          "Send Reset Link"
        );

        showSuccess(
          elements.resetSuccess,
          "Password reset link sent to your email!"
        );
        if (elements.resetEmailInput) elements.resetEmailInput.value = "";
        setTimeout(() => {
          if (elements.resetModal) {
            elements.resetModal.style.display = "none";
            clearResetMessages();
          }
        }, 3000);
      } catch (error) {
        hideLoading(
          elements.resetBtn,
          elements.resetSpinner,
          elements.resetBtnText,
          "Send Reset Link"
        );
        showError(
          elements.resetError,
          error.message || "Failed to send reset email. Please try again."
        );
      }
    });
  }

  if (
    window.apiClient &&
    window.apiClient.auth &&
    window.apiClient.auth.isAuthenticated()
  ) {
    window.apiClient.auth
      .checkAuthStatus()
      .then((isValid) => {
        if (isValid) {
          window.location.href = "/index.html";
        }
      })
      .catch((error) => {
        console.error("Auth check failed:", error);
      });
  }

  document.addEventListener("keydown", (e) => {
    if (
      e.key === "Escape" &&
      elements.resetModal &&
      elements.resetModal.style.display === "flex"
    ) {
      elements.resetModal.style.display = "none";
      clearResetMessages();
    }
  });

  console.log("Welcome page initialization complete!");
});
