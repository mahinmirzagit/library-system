document.addEventListener("DOMContentLoaded", function () {
  checkLoginStatus();

  const logoutDropdown = document.querySelector(
    ".dropdown-item.logout-dropdown"
  );
  const profileDropdown = document.querySelector(
    ".dropdown-item.profile-dropdown"
  );
  const settingsDropdown = document.querySelector(
    ".dropdown-item.settings-dropdown"
  );
  const goToLibraryBtn = document.querySelector(".go-to-library-btn");
  const profileBtn = document.querySelector(".profile-btn");
  const dropdownMenu = document.querySelector(".dropdown-menu");

  if (logoutDropdown) {
    logoutDropdown.addEventListener("click", handleLogout);
  }

  if (profileDropdown) {
    profileDropdown.addEventListener("click", handleProfile);
  }

  if (settingsDropdown) {
    settingsDropdown.addEventListener("click", handleSettings);
  }

  if (goToLibraryBtn) {
    goToLibraryBtn.addEventListener("click", handleGoToLibrary);
  }

  if (profileBtn && dropdownMenu) {
    profileBtn.addEventListener("click", () => {
      dropdownMenu.classList.toggle("show");
    });

    document.addEventListener("click", (event) => {
      if (
        !profileBtn.contains(event.target) &&
        !dropdownMenu.contains(event.target)
      ) {
        dropdownMenu.classList.remove("show");
      }
    });
  }

  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");
  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });

  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("active");
    });
  });

  const yearSpan = document.getElementById("current-year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  const animatedElements = document.querySelectorAll(".hidden");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

  animatedElements.forEach((el) => observer.observe(el));

  const modal = document.getElementById("auth-modal");
  const loginBtn = document.querySelector(".login-btn");
  const signupBtn = document.querySelector(".signup-btn");
  const closeBtn = document.querySelector(".close");
  const readMoreBtn = document.querySelector(".read-more-btn");
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");
  const payButtons = []; // payment removed – kept to avoid reference errors
  const submitButtons = document.querySelectorAll(".submit-btn");
  let generatedCode = null; // legacy – no longer used

  loginBtn.addEventListener("click", () => {
    modal.style.display = "block";
    switchTab("login");
  });

  readMoreBtn.addEventListener("click", (e) => {
    const userEmail = localStorage.getItem("userEmail");
    if (userEmail) {
      handleGoToLibrary();
    } else {
      modal.style.display = "block";
      switchTab("register");
    }
  });

  signupBtn.addEventListener("click", () => {
    modal.style.display = "block";
    switchTab("register");
  });

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tab = button.getAttribute("data-tab");
      switchTab(tab);
    });
  });

  const switchToRegister = document.querySelector(".switch-to-register");
  if (switchToRegister) {
    switchToRegister.addEventListener("click", (e) => {
      e.preventDefault();
      switchTab("register");
    });
  }

  const switchToLogin = document.querySelector(".switch-to-login");
  if (switchToLogin) {
    switchToLogin.addEventListener("click", (e) => {
      e.preventDefault();
      switchTab("login");
    });
  }

  // ── Handle Firebase Email Link sign-in (runs on page load) ──────────────
  // When user clicks the magic link in their email, Firebase redirects here.
  (async function handleEmailLinkReturn() {
    if (!window._firebaseAuth) return;
    if (!window._firebaseAuth.isSignInWithEmailLink(window.location.href)) {
      // No email link in URL — clear any stale localStorage to prevent phantom firings
      if (!localStorage.getItem("emailForSignIn")) return;
      // Only clear if the URL clearly has no link params
      const hasLinkParams = window.location.href.includes("oobCode");
      if (!hasLinkParams) {
        localStorage.removeItem("emailForSignIn");
        localStorage.removeItem("pendingRole");
        localStorage.removeItem("pendingAdminCode");
        localStorage.removeItem("pendingIntent");
      }
      return;
    }

    let email = localStorage.getItem("emailForSignIn");
    if (!email) {
      email = window.prompt("Please enter your email address to complete sign-in:");
      if (!email) {
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
    }

    // ⚠️ IMPORTANT: Save the original URL BEFORE cleaning it.
    // Firebase's signInWithEmailLink needs the oobCode query param that's in the URL.
    const originalHref = window.location.href;

    // Clean the URL right away so refreshing doesn't re-trigger
    window.history.replaceState({}, document.title, window.location.pathname);

    const role = localStorage.getItem("pendingRole") || "user";
    const adminCode = localStorage.getItem("pendingAdminCode") || "";
    const intent = localStorage.getItem("pendingIntent") || "register";

    // Clear localStorage before the async call
    localStorage.removeItem("emailForSignIn");
    localStorage.removeItem("pendingRole");
    localStorage.removeItem("pendingAdminCode");
    localStorage.removeItem("pendingIntent");

    try {
      // Pass originalHref (with oobCode) — NOT the cleaned window.location.href
      const result = await window._firebaseAuth.signInWithEmailLink(email, originalHref);
      const idToken = await result.user.getIdToken();
      await createFirebaseSession(idToken, role, adminCode, intent, result.user.displayName || email.split("@")[0]);
    } catch (err) {
      console.error("Email link sign-in error:", err);
      // Distinguish actual error types for better UX
      const msg = err.message || "";
      setTimeout(() => {
        modal.style.display = "block";
        if (msg.includes("No account found")) {
          // Server says no account → redirect to register tab
          switchTab("register");
          showError("general-error", "No account found. Please register first.");
        } else if (msg.includes("already exists") || msg.includes("already registered")) {
          switchTab("login");
          showError("general-error", "Account already exists. Please log in.");
        } else if (err.code === "auth/invalid-action-code" || err.code === "auth/expired-action-code") {
          showError("general-error", "Sign-in link has expired. Click 'Continue with Email' and request a new one.");
        } else if (err.code === "auth/invalid-email") {
          showError("general-error", "Email does not match the sign-in link. Please try again.");
        } else {
          showError("general-error", msg || "Sign-in failed. Please try again.");
        }
      }, 400);
    }
  })();

  // ── Handle URL param messages (from server-side redirects) ────────────────
  (function handleAuthMessages() {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    const msg = params.get("msg");
    if (!tab && !msg) return;

    if (tab === "login" || tab === "register") {
      modal.style.display = "block";
      switchTab(tab);
    }

    const messages = {
      "already-registered": "This email is already registered. Please log in instead.",
      "not-registered": "No account found with this email. Please register first.",
      "admin-code-required": "Invalid admin code. Please try again.",
    };

    if (msg && messages[msg]) {
      setTimeout(() => showError("general-error", messages[msg]), 200);
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  })();

  // ── Register form: show/hide admin code row ───────────────────────────────
  const registerForm = document.querySelector("#register-tab .auth-form");
  const adminCodeRow = document.getElementById("admin-code-row");
  const adminRadio = document.getElementById("register-admin");
  const userRadio = document.getElementById("register-user");

  if (adminRadio && adminCodeRow) {
    adminRadio.addEventListener("change", () => {
      adminCodeRow.style.display = adminRadio.checked ? "block" : "none";
    });
    userRadio.addEventListener("change", () => {
      adminCodeRow.style.display = "none";
    });
  }

  // ── Firebase: Unified session creator ────────────────────────────────────
  // Called after ANY successful Firebase sign-in. Posts idToken to backend.
  async function createFirebaseSession(idToken, role, adminCode, intent, displayName) {
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, role, adminCode, intent, displayName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Authentication failed");
    localStorage.setItem("userEmail", data.user.email);
    localStorage.setItem("userName", data.user.name);
    localStorage.setItem("userRole", data.user.role);
    window.location.href = data.redirectTo;
  }

  // ── Firebase: Sign in with popup (Google or Microsoft) ────────────────────
  async function signInWithFirebasePopup(providerName, role, adminCode, intent) {
    let provider;
    if (providerName === "google") {
      provider = new firebase.auth.GoogleAuthProvider();
    } else if (providerName === "microsoft") {
      provider = new firebase.auth.OAuthProvider("microsoft.com");
      provider.setCustomParameters({ tenant: "common" });
    } else {
      return;
    }

    try {
      const result = await window._firebaseAuth.signInWithPopup(provider);
      const idToken = await result.user.getIdToken();
      await createFirebaseSession(idToken, role, adminCode, intent, result.user.displayName);
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") return;
      if (err.code === "auth/account-exists-with-different-credential") {
        throw new Error("This email is already registered with a different sign-in method. Try a different option.");
      }
      throw err;
    }
  }

  // ── Social Auth Buttons & Role Modal ─────────────────────────────────────
  const googleBtns = document.querySelectorAll(".social-btn.google");
  const outlookBtns = document.querySelectorAll(".social-btn.outlook");
  const phoneEmailBtns = document.querySelectorAll(".social-btn.phone-email");

  const roleSelectModal = document.getElementById("role-select-modal");
  const roleModalClose = document.getElementById("role-modal-close");
  const roleModalConfirm = document.getElementById("role-modal-confirm");
  const roleModalTitle = document.getElementById("role-modal-title");
  const roleModalIcon = document.getElementById("role-modal-provider-icon");
  const socialAdminCodeRow = document.getElementById("social-admin-code-row");
  const socialAdminCodeInput = document.getElementById("social-admin-code");
  const socialAdminCodeError = document.getElementById("social-admin-code-error");
  let pendingProvider = null;
  let pendingIntent = "register";

  const googleSVG = `<svg width="48" height="48" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>`;
  const outlookSVG = `<svg width="48" height="48" viewBox="0 0 23 23"><rect fill="#f25022" x="1" y="1" width="10" height="10"/><rect fill="#7fba00" x="12" y="1" width="10" height="10"/><rect fill="#00a4ef" x="1" y="12" width="10" height="10"/><rect fill="#ffb900" x="12" y="12" width="10" height="10"/></svg>`;

  function openRoleModal(provider, intent) {
    pendingProvider = provider;
    pendingIntent = intent;
    roleModalTitle.textContent = `Continue with ${provider === "google" ? "Google" : "Microsoft"}`;
    roleModalIcon.innerHTML = provider === "google" ? googleSVG : outlookSVG;
    document.querySelectorAll('input[name="social-role"]').forEach(r => r.checked = r.value === "user");
    if (socialAdminCodeRow) socialAdminCodeRow.style.display = "none";
    if (socialAdminCodeInput) socialAdminCodeInput.value = "";
    if (socialAdminCodeError) socialAdminCodeError.style.display = "none";
    roleSelectModal.style.display = "block";
  }

  // Show admin code when admin role selected in role modal
  document.querySelectorAll('input[name="social-role"]').forEach(radio => {
    radio.addEventListener("change", () => {
      if (socialAdminCodeRow) {
        socialAdminCodeRow.style.display = radio.value === "admin" && radio.checked ? "block" : "none";
      }
    });
  });

  roleModalClose.addEventListener("click", () => { roleSelectModal.style.display = "none"; });
  window.addEventListener("click", e => { if (e.target === roleSelectModal) roleSelectModal.style.display = "none"; });

  roleModalConfirm.addEventListener("click", async () => {
    const role = document.querySelector('input[name="social-role"]:checked')?.value || "user";

    // Pre-validate admin code before launching popup
    if (role === "admin" && pendingIntent === "register") {
      const code = socialAdminCodeInput ? socialAdminCodeInput.value.trim() : "";
      if (!code) {
        if (socialAdminCodeError) { socialAdminCodeError.textContent = "Admin secret code is required."; socialAdminCodeError.style.display = "block"; }
        return;
      }
      try {
        const res = await fetch("/api/auth/validate-admin-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();
        if (!data.valid) {
          if (socialAdminCodeError) { socialAdminCodeError.textContent = data.error || "Invalid admin code."; socialAdminCodeError.style.display = "block"; }
          return;
        }
      } catch {
        if (socialAdminCodeError) { socialAdminCodeError.textContent = "Network error. Try again."; socialAdminCodeError.style.display = "block"; }
        return;
      }
    }

    roleSelectModal.style.display = "none";
    const adminCode = socialAdminCodeInput?.value.trim() || "";

    try {
      await signInWithFirebasePopup(pendingProvider, role, adminCode, pendingIntent);
    } catch (err) {
      modal.style.display = "block";
      showError("general-error", err.message || "Sign-in failed. Please try again.");
    }
  });

  // Google buttons — direct login or show role modal for register
  googleBtns.forEach(btn => {
    btn.addEventListener("click", async () => {
      const intent = document.querySelector(".tab-btn.active")?.dataset.tab === "register" ? "register" : "login";
      if (intent === "login") {
        try {
          await signInWithFirebasePopup("google", null, "", "login");
        } catch (err) {
          showError("general-error", err.message || "Sign-in failed.");
        }
      } else {
        openRoleModal("google", "register");
      }
    });
  });

  // Outlook/Microsoft buttons
  outlookBtns.forEach(btn => {
    btn.addEventListener("click", async () => {
      const intent = document.querySelector(".tab-btn.active")?.dataset.tab === "register" ? "register" : "login";
      if (intent === "login") {
        try {
          await signInWithFirebasePopup("microsoft", null, "", "login");
        } catch (err) {
          showError("general-error", err.message || "Sign-in failed.");
        }
      } else {
        openRoleModal("microsoft", "register");
      }
    });
  });

  // ── Email Magic Link Modal ────────────────────────────────────────────────
  const otpModal = document.getElementById("otp-modal");
  const otpModalClose = document.getElementById("otp-modal-close");
  const otpStep1 = document.getElementById("otp-step-1");
  const otpStep2 = document.getElementById("otp-step-2");
  const otpEmailInput = document.getElementById("otp-email-input");
  const otpEmailError = document.getElementById("otp-email-error");
  const otpSendBtn = document.getElementById("otp-send-btn");
  const otpResend = document.getElementById("otp-resend-link");
  let otpSelectedRole = "user";
  let otpIntent = "register";

  // Role pill toggle
  document.querySelectorAll(".otp-role-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".otp-role-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      otpSelectedRole = pill.dataset.role;
      const otpAdminRow = document.getElementById("otp-admin-code-row");
      if (otpAdminRow) otpAdminRow.style.display = (otpSelectedRole === "admin" && otpIntent === "register") ? "block" : "none";
    });
  });

  function openOtpModal() {
    otpIntent = document.querySelector(".tab-btn.active")?.dataset.tab === "register" ? "register" : "login";
    otpStep1.style.display = "block";
    otpStep2.style.display = "none";
    otpEmailInput.value = "";
    otpEmailError.style.display = "none";
    otpSelectedRole = "user";
    document.querySelectorAll(".otp-role-pill").forEach(p => p.classList.toggle("active", p.dataset.role === "user"));
    const otpAdminRow = document.getElementById("otp-admin-code-row");
    if (otpAdminRow) otpAdminRow.style.display = "none";
    const otpRoleRow = document.querySelector(".otp-role-row");
    if (otpRoleRow) otpRoleRow.style.display = otpIntent === "register" ? "flex" : "none";
    otpModal.style.display = "block";
  }

  otpModalClose.addEventListener("click", () => { otpModal.style.display = "none"; });
  window.addEventListener("click", e => { if (e.target === otpModal) otpModal.style.display = "none"; });
  phoneEmailBtns.forEach(btn => btn.addEventListener("click", openOtpModal));

  async function sendEmailLink() {
    const email = otpEmailInput.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      otpEmailError.textContent = "Please enter a valid email address.";
      otpEmailError.style.display = "block";
      return;
    }

    // Validate admin code before sending link
    if (otpIntent === "register" && otpSelectedRole === "admin") {
      const adminCodeEl = document.getElementById("otp-admin-code-input");
      const adminCode = adminCodeEl ? adminCodeEl.value.trim() : "";
      if (!adminCode) {
        otpEmailError.textContent = "Admin Secret Code is required to register as Admin.";
        otpEmailError.style.display = "block";
        return;
      }
      // Pre-validate on backend
      try {
        const chk = await fetch("/api/auth/validate-admin-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: adminCode }),
        });
        const chkData = await chk.json();
        if (!chkData.valid) {
          otpEmailError.textContent = chkData.error || "Invalid admin secret code.";
          otpEmailError.style.display = "block";
          return;
        }
        localStorage.setItem("pendingAdminCode", adminCode);
      } catch {
        otpEmailError.textContent = "Network error. Please try again.";
        otpEmailError.style.display = "block";
        return;
      }
    }

    otpEmailError.style.display = "none";
    otpSendBtn.disabled = true;
    otpSendBtn.textContent = "Sending link...";

    // Store context for when user returns from email link
    localStorage.setItem("emailForSignIn", email);
    localStorage.setItem("pendingRole", otpSelectedRole);
    localStorage.setItem("pendingIntent", otpIntent);

    const actionCodeSettings = {
      url: window.location.origin + "/",
      handleCodeInApp: true,
    };

    try {
      await window._firebaseAuth.sendSignInLinkToEmail(email, actionCodeSettings);
      // Update hint text and show step 2
      const hint = otpStep2.querySelector(".otp-sent-hint");
      if (hint) hint.textContent = `Sign-in link sent to ${email}. Check your inbox!`;
      otpStep1.style.display = "none";
      otpStep2.style.display = "block";
    } catch (err) {
      console.error("Email link error:", err);
      otpEmailError.textContent = err.message || "Failed to send sign-in link. Please try again.";
      otpEmailError.style.display = "block";
    } finally {
      otpSendBtn.disabled = false;
      otpSendBtn.textContent = "Send Sign-In Link";
    }
  }

  otpSendBtn.addEventListener("click", sendEmailLink);
  otpResend.addEventListener("click", e => { e.preventDefault(); sendEmailLink(); });

  function switchTab(tab) {
    tabButtons.forEach((btn) => btn.classList.remove("active"));
    tabPanes.forEach((pane) => pane.classList.remove("active"));

    document.querySelector(`[data-tab="${tab}"]`).classList.add("active");
    document.getElementById(`${tab}-tab`).classList.add("active");
  }

  const regTabForm = document.querySelector("#register-tab form");
  if (regTabForm) {
    const inputs = regTabForm.querySelectorAll("input");
    inputs.forEach((input) => {
      input.addEventListener("input", () => {
        let errorId = "";
        let isValid = false;
        let errorMessage = "";

        switch (input.name) {
          case "name":
            errorId = "username-error";
            isValid = input.value.trim() && !/\s/.test(input.value);
            errorMessage = isValid
              ? ""
              : "Username is required and cannot contain spaces.";
            break;
          case "email":
            errorId = "email-error";
            const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
            isValid = gmailRegex.test(input.value);
            errorMessage = isValid
              ? ""
              : "Please enter a valid Gmail address (e.g., example@gmail.com).";
            break;
          case "password":
            errorId = "password-error";
            isValid = /(?=.*[a-zA-Z])(?=.*\d)(?=.*\W)/.test(input.value);
            errorMessage = isValid
              ? ""
              : "Password must contain at least one letter, one number, and one symbol.";
            break;
          case "confirmPassword":
            errorId = "confirm-password-error";
            const password = regTabForm.querySelector(
              'input[name="password"]'
            );
            isValid =
              input.value.trim() &&
              password &&
              password.value.trim() &&
              input.value === password.value;
            errorMessage = isValid ? "" : "Passwords do not match.";
            break;
          case "cardNumber":
            errorId = "card-number-error";
            isValid = /^\d{16}$/.test(input.value);
            errorMessage = isValid
              ? ""
              : "Card number must be exactly 16 digits.";
            break;
          case "expiry":
            errorId = "expiry-error";
            isValid = /^(0[1-9]|1[0-2])\/\d{2}$/.test(input.value);
            errorMessage = isValid
              ? ""
              : "Expiry date must be in MM/YY format.";
            break;
          case "cvv":
            errorId = "cvv-error";
            isValid = /^\d{3}$/.test(input.value);
            errorMessage = isValid ? "" : "CVV must be exactly 3 digits.";
            break;
          case "verificationCode":
            errorId = "register-code-error";
            isValid = /^(ADM|USR)\d{3}-[A-Z]{3}$/.test(input.value);
            errorMessage = isValid
              ? ""
              : "Verification code must be in ADM123-XYZ or USR123-XYZ format.";
            break;
        }

        if (errorId) {
          if (isValid) {
            hideError(errorId);
          } else if (errorMessage) {
            showError(errorId, errorMessage);
          }
        }
        hideError("general-error");
        hideError("success-message");
      });
    });
  }

  const loginForm = document.querySelector("#login-tab form");
  if (loginForm) {
    const inputs = loginForm.querySelectorAll("input");
    inputs.forEach((input) => {
      input.addEventListener("input", () => {
        let errorId = "";
        let isValid = false;
        let errorMessage = "";

        switch (input.name) {
          case "email":
            errorId = "login-email-error";
            isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
            errorMessage = isValid ? "" : "Please enter a valid email address.";
            break;
          case "password":
            errorId = "login-password-error";
            isValid = input.value.length >= 8;
            errorMessage = isValid ? "" : "Password must be at least 8 characters long.";
            break;
        }

        if (errorId) {
          if (isValid) {
            hideError(errorId);
          } else if (errorMessage) {
            showError(errorId, errorMessage);
          }
        }
        hideError("general-error");
        hideError("success-message");
      });
    });
  }

  // ── Submit Buttons: Register & Login via Firebase ─────────────────────────
  submitButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      const form = button.closest("form");
      if (!form) return;

      // ── Manual Register ──────────────────────────────────────────────────
      if (form.closest("#register-tab")) {
        const nameInput = form.querySelector('input[name="name"]');
        const emailInput = form.querySelector('input[name="email"]');
        const passwordInput = form.querySelector('input[name="password"]');
        const confirmPasswordInput = form.querySelector('input[name="confirmPassword"]');
        const roleValue = form.querySelector('input[name="role"]:checked')?.value || "user";
        const adminCodeInput = document.getElementById("admin-code-input");
        let isValid = true;

        if (!nameInput?.value.trim() || /\s/.test(nameInput.value)) {
          showError("username-error", "Username is required and cannot have spaces."); isValid = false;
        } else hideError("username-error");

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput?.value || "")) {
          showError("email-error", "Please enter a valid email address."); isValid = false;
        } else hideError("email-error");

        if (!passwordInput?.value || passwordInput.value.length < 8) {
          showError("password-error", "Password must be at least 8 characters."); isValid = false;
        } else hideError("password-error");

        if (passwordInput?.value !== confirmPasswordInput?.value) {
          showError("confirm-password-error", "Passwords do not match."); isValid = false;
        } else hideError("confirm-password-error");

        if (roleValue === "admin") {
          const adminCode = adminCodeInput?.value.trim();
          if (!adminCode) {
            showError("admin-code-error", "Admin Secret Code is required."); isValid = false;
          } else hideError("admin-code-error");
        }

        if (!isValid) return;

        button.disabled = true;
        button.textContent = "Creating account...";
        try {
          // Firebase creates the auth user (manages password securely)
          const userCredential = await window._firebaseAuth.createUserWithEmailAndPassword(
            emailInput.value.trim(),
            passwordInput.value
          );
          const idToken = await userCredential.user.getIdToken();
          await createFirebaseSession(
            idToken,
            roleValue,
            adminCodeInput?.value.trim() || "",
            "register",
            nameInput.value.trim()
          );
        } catch (err) {
          if (err.code === "auth/email-already-in-use") {
            showError("email-error", "This email is already registered. Please log in.");
          } else if (err.code === "auth/weak-password") {
            showError("password-error", "Password is too weak. Use at least 8 characters.");
          } else {
            showError("general-error", err.message || "Registration failed. Please try again.");
          }
        } finally {
          button.disabled = false;
          button.textContent = "Register";
        }
      }

      // ── Manual Login ─────────────────────────────────────────────────────
      if (form.closest("#login-tab")) {
        const emailInput = form.querySelector('input[name="email"]');
        const passwordInput = form.querySelector('input[name="password"]');
        let isValid = true;

        if (!emailInput?.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) {
          showError("login-email-error", "Please enter a valid email address."); isValid = false;
        } else hideError("login-email-error");

        if (!passwordInput?.value || passwordInput.value.length < 8) {
          showError("login-password-error", "Password must be at least 8 characters."); isValid = false;
        } else hideError("login-password-error");

        if (!isValid) return;

        button.disabled = true;
        button.textContent = "Signing in...";
        try {
          // Firebase verifies the password
          const userCredential = await window._firebaseAuth.signInWithEmailAndPassword(
            emailInput.value.trim(),
            passwordInput.value
          );
          const idToken = await userCredential.user.getIdToken();
          await createFirebaseSession(idToken, null, "", "login", userCredential.user.displayName);
        } catch (err) {
          if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
            showError("general-error", "Invalid email or password.");
          } else if (err.code === "auth/too-many-requests") {
            showError("general-error", "Too many failed attempts. Please try again later.");
          } else {
            showError("general-error", err.message || "Login failed. Please try again.");
          }
        } finally {
          button.disabled = false;
          button.textContent = "Login";
        }
      }
    });
  });

  function showError(id, message) {
    const errorEl = document.getElementById(id);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = "block";
      errorEl.style.color = id === "success-message" ? "var(--success)" : "#ff4d4d";
    }
  }

  function hideError(id) {
    const errorEl = document.getElementById(id);
    if (errorEl) {
      errorEl.style.display = "none";
    }
  }

  // Modern Toast Notification Utility
  function showNotification(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 24px;
      background: ${type === "success" ? "#10b981" : "#ef4444"};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    
    const icon = document.createElement("i");
    icon.className = type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle";
    toast.appendChild(icon);
    
    const text = document.createElement("span");
    text.textContent = message;
    toast.appendChild(text);

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "slideOut 0.3s ease-in forwards";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Fix Input Concatenation Bug (Clear on focus if double event triggers)
  const allInputs = document.querySelectorAll("input");
  allInputs.forEach(input => {
    input.addEventListener("focus", () => {
      // Optional: Clear or reset state if needed, but primary fix is in how we handle 'input' events
    });
  });

  const showMoreFaqsBtn = document.getElementById("show-more-faqs");
  const faqHidden = document.querySelector(".faq-hidden");

  if (showMoreFaqsBtn && faqHidden) {
    showMoreFaqsBtn.addEventListener("click", () => {
      if (faqHidden.style.display === "none") {
        faqHidden.style.display = "block";
        showMoreFaqsBtn.textContent = "Show Less FAQs";
      } else {
        faqHidden.style.display = "none";
        showMoreFaqsBtn.textContent = "Show More FAQs";
      }
    });
  }

  const policyModal = document.getElementById("policy-modal");
  const policyModalBody = document.getElementById("policy-modal-body");
  const expandBtns = document.querySelectorAll(".expand-btn");

  expandBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const policySection = btn.closest(".policy-section");
      const policyTitle = policySection.querySelector("h2").textContent;
      const policyContent =
        policySection.querySelector(".policy-content").innerHTML;

      policyModalBody.innerHTML = `<h2>${policyTitle}</h2>${policyContent}`;
      policyModal.style.display = "block";
      document.body.style.overflow = "hidden";
    });
  });

  const policyCloseBtn = policyModal.querySelector(".close");
  policyCloseBtn.addEventListener("click", () => {
    policyModal.style.display = "none";
    document.body.style.overflow = "auto";
  });

  window.addEventListener("click", (event) => {
    if (event.target === policyModal) {
      policyModal.style.display = "none";
      document.body.style.overflow = "auto";
    }
  });

  const stars = document.querySelectorAll(".rating-section .stars .fa-star");
  const ratingSubmitBtn = document.querySelector(".rating-submit-btn");
  const ratingTextarea = document.querySelector(".rating-section textarea");
  let selectedRating = 0;

  stars.forEach((star, index) => {
    star.addEventListener("click", () => {
      const newRating = index + 1;
      if (selectedRating === newRating) {
        selectedRating = 0;
      } else {
        selectedRating = newRating;
      }
      updateStars(selectedRating);
      
      const starsContainer = document.querySelector(".rating-header .stars");
      if (starsContainer) starsContainer.classList.remove("error-glow");
    });
  });

  function updateStars(rating) {
    stars.forEach((star, index) => {
      if (index < rating) {
        star.classList.add("active");
      } else {
        star.classList.remove("active");
      }
    });
  }

  if (ratingSubmitBtn) {
    ratingSubmitBtn.addEventListener("click", (event) => {
      event.preventDefault();
      if (selectedRating === 0) {
        const starsContainer = document.querySelector(".rating-header .stars");
        if (starsContainer) {
          starsContainer.classList.add("error-glow");
          setTimeout(() => starsContainer.classList.remove("error-glow"), 500);
        }
        return;
      }

      const message =
        ratingTextarea.value.trim() || `${selectedRating} star rating`;

      const userEmail = localStorage.getItem("userEmail");
      const userName = localStorage.getItem("userName") || "User";

      ratingSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      ratingSubmitBtn.disabled = true;

      fetch("/api/submissions/rating", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stars: selectedRating,
          message: message,
          user: userName,
          email: userEmail,
        }),
      })
        .then((response) => response.json())
        .then((result) => {
          if (result.error) {
            showError(
              "general-error",
              "Error submitting rating: " + result.error
            );
            ratingSubmitBtn.innerHTML = "Submit Rating";
            ratingSubmitBtn.disabled = false;
          } else {
            ratingSubmitBtn.innerHTML = '<i class="fas fa-check"></i> Sent';
            ratingSubmitBtn.style.backgroundColor = "var(--success)";
            setTimeout(() => {
              ratingSubmitBtn.innerHTML = "Submit Rating";
              ratingSubmitBtn.style.backgroundColor = "";
              ratingSubmitBtn.disabled = false;
              selectedRating = 0;
              updateStars(0);
              ratingTextarea.value = "";
            }, 2000);
          }
        })
        .catch((error) => {
          console.error("Rating submission error:", error);
          showError(
            "general-error",
            "Failed to submit rating. Please try again."
          );
          ratingSubmitBtn.innerHTML = "Submit Rating";
          ratingSubmitBtn.disabled = false;
        });
    });
  }

  const contactForm = document.querySelector(".contact-form");
  const contactSubmitBtn = contactForm.querySelector(".submit-btn");
  const nameInput = contactForm.querySelector('input[placeholder="Your Username"]');
  const emailInput = contactForm.querySelector(
    'input[placeholder="Your Email"]'
  );

  if (contactForm) {
    const inputs = contactForm.querySelectorAll("input, textarea");
    inputs.forEach((input) => {
      input.addEventListener("input", () => {
        let errorId = "";
        let isValid = false;
        let errorMessage = "";

        switch (input.placeholder) {
          case "Your Username":
            errorId = "contact-name-error";
            isValid = input.value.trim() !== "";
            errorMessage = isValid ? "" : "Name is required.";
            break;
          case "Your Email":
            errorId = "contact-email-error";
            const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
            isValid = gmailRegex.test(input.value);
            errorMessage = isValid
              ? ""
              : "Please enter a valid Gmail address (e.g., example@gmail.com).";
            break;
          case "Your Question":
            errorId = "contact-message-error";
            isValid = input.value.trim() !== "";
            errorMessage = isValid ? "" : "Message is required.";
            break;
        }

        if (errorId) {
          if (isValid) {
            hideError(errorId);
            input.style.borderColor = "";
          } else if (errorMessage) {
            showError(errorId, errorMessage);
          }
        }
        hideError("general-error");
        hideError("success-message");
      });
    });
  }

  if (nameInput) {
    ['click', 'focus'].forEach(event => {
      nameInput.addEventListener(event, () => {
        const userEmail = localStorage.getItem("userEmail");
        const userName = localStorage.getItem("userName");
        if (userEmail && userName && !nameInput.value.trim()) {
          nameInput.value = userName;
          // Trigger input event to run validation
          nameInput.dispatchEvent(new Event('input'));
        }
      });
    });
  }

  if (emailInput) {
    ['click', 'focus'].forEach(event => {
      emailInput.addEventListener(event, () => {
        const userEmail = localStorage.getItem("userEmail");
        if (userEmail && !emailInput.value.trim()) {
          emailInput.value = userEmail;
          // Trigger input event to run validation
          emailInput.dispatchEvent(new Event('input'));
        }
      });
    });
  }

  if (contactSubmitBtn) {
    contactSubmitBtn.addEventListener("click", (event) => {
      event.preventDefault();
      const messageTextarea = contactForm.querySelector(
        'textarea[placeholder="Your Question"]'
      );

      const userName = localStorage.getItem("userName");
      const userEmail = localStorage.getItem("userEmail");
      const name = userName || nameInput.value.trim();
      const email = userEmail || emailInput.value.trim();
      const message = messageTextarea.value.trim();

      if (!name) {
        showError("contact-name-error", "Please enter your name.");
        return;
      }

      const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
      if (!gmailRegex.test(email)) {
        showError(
          "contact-email-error",
          "Please enter a valid Gmail address (e.g., example@gmail.com)."
        );
        return;
      }

      if (!message) {
        messageTextarea.style.borderColor = "red";
        showError("contact-message-error", "Please enter your message.");
        return;
      }
      messageTextarea.style.borderColor = "";

      contactSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      contactSubmitBtn.disabled = true;

      fetch("/api/submissions/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: name,
          email: email,
          message: message,
        }),
      })
        .then((response) => response.json())
        .then((result) => {
          if (result.error) {
            showError(
              "general-error",
              "Error submitting contact form: " + result.error
            );
            contactSubmitBtn.innerHTML = "Send Message";
            contactSubmitBtn.disabled = false;
          } else {
            contactSubmitBtn.innerHTML = '<i class="fas fa-check"></i> Sent';
            contactSubmitBtn.style.backgroundColor = "var(--success)";
            setTimeout(() => {
              contactSubmitBtn.innerHTML = "Send Message";
              contactSubmitBtn.style.backgroundColor = "";
              contactSubmitBtn.disabled = false;
              contactForm.reset();
            }, 2000);
          }
        })
        .catch((error) => {
          console.error("Contact form submission error:", error);
          showError(
            "general-error",
            "Failed to send message. Please try again."
          );
          contactSubmitBtn.innerHTML = "Send Message";
          contactSubmitBtn.disabled = false;
        });
    });
  }

  function checkLoginStatus() {
    const userEmail = localStorage.getItem("userEmail");
    const loginBtn = document.querySelector(".login-btn");
    const signupBtn = document.querySelector(".signup-btn");
    const profileDropdown = document.querySelector(".profile-dropdown");
    const goToLibraryBtn = document.querySelector(".go-to-library-btn");
    const profilePic = document.querySelector(".profile-pic");

    if (userEmail) {
      if (loginBtn) loginBtn.style.display = "none";
      if (signupBtn) signupBtn.style.display = "none";
      if (profileDropdown) profileDropdown.style.display = "inline-block";
      if (goToLibraryBtn) goToLibraryBtn.style.display = "inline-block";

      if (profilePic) {
        const initial = userEmail.charAt(0).toUpperCase();

        const canvas = document.createElement("canvas");
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#58a6ff";
        ctx.fillRect(0, 0, 32, 32);
        ctx.fillStyle = "#ffffff";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillText(initial, 16, 24);
        profilePic.src = canvas.toDataURL();
      }
      updateHeroButton(true);
    } else {
      if (loginBtn) loginBtn.style.display = "inline-block";
      if (signupBtn) signupBtn.style.display = "inline-block";
      if (profileDropdown) profileDropdown.style.display = "none";
      if (goToLibraryBtn) goToLibraryBtn.style.display = "none";
      updateHeroButton(false);
    }
  }

  function updateHeroButton(isLoggedIn) {
    const heroBtn = document.querySelector(".explore-btn");
    const readMoreBtn = document.querySelector(".read-more-btn");
    if (heroBtn) {
      if (isLoggedIn) {
        const userRole = localStorage.getItem("userRole");
        heroBtn.textContent = "Open Library";
        heroBtn.href =
          userRole === "admin" ? "dashboard.html" : "user-dashboard.html";
        
        if (readMoreBtn && !readMoreBtn.id.includes("faq")) {
          readMoreBtn.textContent = "Go to Library";
        }
      } else {
        heroBtn.textContent = "Explore Features";
        heroBtn.href = "#features";
        
        if (readMoreBtn && !readMoreBtn.id.includes("faq")) {
          readMoreBtn.textContent = "Get Started";
        }
      }
    }
  }

  function handleLogout() {
    localStorage.removeItem("userEmail");
    checkLoginStatus();
    window.location.href = "index.html";
  }

  function handleGoToLibrary() {
    const userRole = localStorage.getItem("userRole");
    window.location.href =
      userRole === "admin" ? "dashboard.html" : "user-dashboard.html";
  }

  function handleProfile() {
    window.location.href = "profile.html";
  }

  function handleSettings() {
    window.location.href = "settings.html";
  }
});
