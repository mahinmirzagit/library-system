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
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");
  const payButtons = document.querySelectorAll(".pay-btn");
  const submitButtons = document.querySelectorAll(".submit-btn");
  let generatedCode = null;
  let paymentCompleted = false;
  let sendAgainTimeout = null;

  loginBtn.addEventListener("click", () => {
    modal.style.display = "block";
    switchTab("login");
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

  function switchTab(tab) {
    tabButtons.forEach((btn) => btn.classList.remove("active"));
    tabPanes.forEach((pane) => pane.classList.remove("active"));

    document.querySelector(`[data-tab="${tab}"]`).classList.add("active");
    document.getElementById(`${tab}-tab`).classList.add("active");
  }

  const registerForm = document.querySelector("#register-tab form");
  if (registerForm) {
    const inputs = registerForm.querySelectorAll("input");
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
            const password = registerForm.querySelector(
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
            errorMessage = isValid
              ? ""
              : "Password must be at least 8 characters long.";
            break;
          case "verificationCode":
            errorId = "login-code-error";
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

  // ROLE TOGGLING LOGIC
  const roleRadios = document.querySelectorAll('input[name="role"]');
  roleRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const paymentContainer = document.getElementById("payment-container");
      const adminNotice = document.getElementById("admin-notice");
      const vCodeInput = document.querySelector('input[name="verificationCode"]');

      if (e.target.value === "admin") {
        if (paymentContainer) paymentContainer.style.display = "none";
        if (adminNotice) adminNotice.style.display = "block";
        if (vCodeInput) vCodeInput.placeholder = "Enter Admin Secret Code (e.g. ADM-MASTER-777)";
      } else {
        if (paymentContainer) paymentContainer.style.display = "block";
        if (adminNotice) adminNotice.style.display = "none";
        if (vCodeInput) vCodeInput.placeholder = "Verification Code (e.g., USR123-XYZ)";
      }
    });
  });

  payButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const form = button.closest("form");
      const role = form.querySelector('input[name="role"]:checked');
      const nameInput = form.querySelector('input[name="name"]');
      const emailInput = form.querySelector('input[name="email"]');
      const passwordInput = form.querySelector('input[name="password"]');
      const confirmPasswordInput = form.querySelector('input[name="confirmPassword"]');

      if (!nameInput || !nameInput.value.trim()) {
        showError("username-error", "Please enter your username first.");
        return;
      }

      if (!emailInput || !emailInput.value.trim()) {
        showError("email-error", "Please enter your email first.");
        return;
      }

      // Check if user already exists BEFORE payment
      try {
        const checkResponse = await fetch("/api/auth/check-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailInput.value.trim() }),
        });
        const checkResult = await checkResponse.json();
        if (checkResult.exists) {
          showError("email-error", "An account with this email already exists. Please login instead.");
          return;
        }
      } catch (error) {
        console.error("Error checking account:", error);
      }

      if (!passwordInput || passwordInput.value.length < 8) {
        showError("password-error", "Password must be at least 8 characters long.");
        return;
      }

      if (passwordInput.value !== confirmPasswordInput.value) {
        showError("confirm-password-error", "Passwords do not match.");
        return;
      }

      // START OF RAZORPAY INTEGRATION
      button.disabled = true;
      const originalText = button.innerHTML;
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Initializing Gateway...';

      try {
        // 1. Create Order on Server
        const orderResponse = await fetch("/api/payments/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: 800, currency: "INR", email: emailInput.value.trim() }),
        });
        const order = await orderResponse.json();

        if (!orderResponse.ok) throw new Error(order.error || "Order creation failed.");

        // 2. Open Razorpay Checkout
        const options = {
          key: "rzp_test_SalsSeUn6okYsP", // Public Test Key
          amount: order.amount,
          currency: order.currency,
          name: "LibroHub Library",
          description: "Verification Fee for " + role.value.toUpperCase(),
          image: "https://razorpay.com/assets/razorpay-glyph.svg",
          order_id: order.id,
          handler: async function (response) {
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying Payment...';
            
            // 3. Verify Payment on Server
            try {
              const verifyResponse = await fetch("/api/payments/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  email: emailInput.value,
                  role: role.value
                }),
              });
              const verifyResult = await verifyResponse.json();

              if (verifyResult.success) {
                showNotification("Payment Successful! Verification code sent to your inbox.", "success");
                paymentCompleted = true;
                button.innerHTML = '<i class="fas fa-check-circle"></i> Paid & Verified';
                button.style.backgroundColor = "#10b981";
              } else {
                throw new Error(verifyResult.error || "Payment verification failed.");
              }
            } catch (err) {
              showNotification(err.message, "error");
              button.innerHTML = originalText;
              button.disabled = false;
            }
          },
          prefill: {
            email: emailInput.value
          },
          theme: {
            color: "#58a6ff"
          },
          modal: {
            ondismiss: function() {
              button.innerHTML = originalText;
              button.disabled = false;
            }
          }
        };

        const rzp = new Razorpay(options);
        rzp.open();

      } catch (error) {
        console.error("Payment Error:", error);
        showNotification(error.message || "Failed to initiate payment. Please try again.", "error");
        button.innerHTML = originalText;
        button.disabled = false;
      }
    });
  });

  submitButtons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      const form = button.closest("form");
      const inputs = form.querySelectorAll("input[required]");
      let isValid = true;

      inputs.forEach((input) => {
        if (!input.value.trim()) {
          isValid = false;
          input.style.borderColor = "red";
        } else {
          input.style.borderColor = "var(--border-color)";
        }
      });

      if (form.closest("#register-tab")) {
        const emailInput = form.querySelector('input[type="email"]');
        if (emailInput && emailInput.value) {
          try {
            const checkResponse = await fetch("/api/auth/check-user", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ email: emailInput.value }),
            });
            if (checkResponse.ok) {
              const checkResult = await checkResponse.json();
              if (checkResult.exists) {
                isValid = false;
                showError(
                  "email-error",
                  "User with this email already exists. Please use a different email or login."
                );
              } else {
                hideError("email-error");
              }
            } else {
              isValid = false;
              showError(
                "general-error",
                "Failed to verify user. Please try again."
              );
            }
          } catch (error) {
            console.error("Error checking user existence:", error);
            isValid = false;
            showError(
              "general-error",
              "Failed to verify user. Please try again."
            );
          }
        }

        const username = form.querySelector('input[name="name"]');
        if (username && /\s/.test(username.value)) {
          isValid = false;
          showError("username-error", "Username cannot contain spaces.");
        } else {
          hideError("username-error");
        }

        const password = form.querySelector('input[name="password"]');
        const confirmPassword = form.querySelector(
          'input[name="confirmPassword"]'
        );
        if (
          password &&
          !/(?=.*[a-zA-Z])(?=.*\d)(?=.*\W)/.test(password.value)
        ) {
          isValid = false;
          showError(
            "password-error",
            "Password must contain at least one letter, one number, and one symbol."
          );
        } else {
          hideError("password-error");
        }

        if (
          password &&
          confirmPassword &&
          password.value !== confirmPassword.value
        ) {
          isValid = false;
          showError("confirm-password-error", "Passwords do not match.");
        } else {
          hideError("confirm-password-error");
        }

        const cardNumber = form.querySelector('input[name="cardNumber"]');
        if (cardNumber && !/^\d{16}$/.test(cardNumber.value)) {
          isValid = false;
          showError(
            "card-number-error",
            "Card number must be exactly 16 digits."
          );
        } else {
          hideError("card-number-error");
        }

        const expiry = form.querySelector('input[name="expiry"]');
        if (expiry && !/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry.value)) {
          isValid = false;
          showError("expiry-error", "Expiry date must be in MM/YY format.");
        } else {
          hideError("expiry-error");
        }

        const cvv = form.querySelector('input[name="cvv"]');
        if (cvv && !/^\d{3}$/.test(cvv.value)) {
          isValid = false;
          showError("cvv-error", "CVV must be exactly 3 digits.");
        } else {
          hideError("cvv-error");
        }

        const role = form.querySelector('input[name="role"]:checked').value;
        const registerCode = form.querySelector(
          'input[name="verificationCode"]'
        );
        
        // ADMINS BYPASS PAYMENT CHECK
        if (role === "user" && !paymentCompleted) {
          isValid = false;
          showError(
            "register-code-error",
            "Please complete the $10 payment to receive your verification email."
          );
        } else if (
          registerCode &&
          !/^(ADM|USR|ADM-MASTER)\d*.*$/.test(registerCode.value)
        ) {
          // Relaxed regex to accommodate master code or standard codes
          if (role === 'user' && !/^(ADM|USR)\d{3}-[A-Z]{3}$/.test(registerCode.value)) {
            isValid = false;
            showError(
              "register-code-error",
              "Verification code must be in ADM123-XYZ or USR123-XYZ format."
            );
          }
        } else {
          hideError("register-code-error");
        }
      }

      if (form.closest("#login-tab")) {
        const loginEmail = form.querySelector('input[type="email"]');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (loginEmail && !emailRegex.test(loginEmail.value)) {
          isValid = false;
          showError("login-email-error", "Please enter a valid email address.");
        } else {
          hideError("login-email-error");
        }

        const loginPassword = form.querySelector('input[type="password"]');
        if (loginPassword && loginPassword.value.length < 8) {
          isValid = false;
          showError(
            "login-password-error",
            "Password must be at least 8 characters long."
          );
        } else {
          hideError("login-password-error");
        }

        const loginCode = form.querySelector('input[name="verificationCode"]');
        if (loginCode && !/^(ADM|USR)\d{3}-[A-Z]{3}$/.test(loginCode.value)) {
          isValid = false;
          showError(
            "login-code-error",
            "Verification code must be in ADM123-XYZ or USR123-XYZ format."
          );
        } else {
          hideError("login-code-error");
        }
      }

      if (isValid) {
        if (form.closest("#register-tab")) {
          const formData = new FormData(form);
          const role = form.querySelector('input[name="role"]:checked').value;
          const data = {
            name: formData.get("name"),
            email: formData.get("email"),
            password: formData.get("password"),
            confirmPassword: formData.get("confirmPassword"),
            role: role,
            verificationCode: formData.get("verificationCode"),
          };

          fetch("/api/auth/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          })
            .then((response) => response.json())
            .then((result) => {
              if (result.error) {
                showNotification(result.error, "error");
              } else {
                showNotification("Registration successful! Welcome to LibroHub.", "success");
                modal.style.display = "none";
                form.reset();
                generatedCode = null;

                localStorage.setItem("userEmail", data.email);
                localStorage.setItem("userName", data.name);
                localStorage.setItem("userRole", result.role);
                checkLoginStatus();
              }
            })
            .catch((error) => {
              console.error("Registration error:", error);
              showError(
                "general-error",
                "Registration failed. Please try again."
              );
            });
        } else if (form.closest("#login-tab")) {
          const formData = new FormData(form);
          const data = {
            email: formData.get("email"),
            password: formData.get("password"),
            verificationCode: formData.get("verificationCode"),
          };

          fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          })
            .then((response) => response.json())
            .then((result) => {
              if (result.error) {
                showError("general-error", result.error);
              } else {
                showError("success-message", "Login successful!");
                modal.style.display = "none";
                form.reset();

                localStorage.setItem("userEmail", data.email);
                localStorage.setItem("userName", result.user.name);
                localStorage.setItem("userRole", result.user.role);

                checkLoginStatus();
              }
            })
            .catch((error) => {
              console.error("Login error:", error);
              showError("general-error", "Login failed. Please try again.");
            });
        }

        document
          .querySelectorAll(".error-message")
          .forEach((el) => (el.style.display = "none"));
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
      selectedRating = index + 1;
      updateStars(selectedRating);
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
        ratingTextarea.style.borderColor = "red";
        return;
      }
      ratingTextarea.style.borderColor = "";

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
  const nameInput = contactForm.querySelector('input[placeholder="Your Name"]');
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
          case "Your Name":
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
          case "Your Message":
            errorId = "contact-message-error";
            isValid = input.value.trim() !== "";
            errorMessage = isValid ? "" : "Message is required.";
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

  if (nameInput) {
    nameInput.addEventListener("click", () => {
      const userEmail = localStorage.getItem("userEmail");
      const userName = localStorage.getItem("userName");
      if (userEmail && userName && !nameInput.value.trim()) {
        nameInput.value = userName;
      }
    });
  }

  if (emailInput) {
    emailInput.addEventListener("click", () => {
      const userEmail = localStorage.getItem("userEmail");
      if (userEmail && !emailInput.value.trim()) {
        emailInput.value = userEmail;
      }
    });
  }

  if (contactSubmitBtn) {
    contactSubmitBtn.addEventListener("click", (event) => {
      event.preventDefault();
      const messageTextarea = contactForm.querySelector(
        'textarea[placeholder="Your Message"]'
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
        showError("contact-message-error", "Please enter your message.");
        return;
      }

      contactSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      contactSubmitBtn.disabled = true;

      fetch("/api/submissions/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
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
    if (heroBtn) {
      if (isLoggedIn) {
        const userRole = localStorage.getItem("userRole");
        heroBtn.textContent = "Open Library";
        heroBtn.href =
          userRole === "admin" ? "dashboard.html" : "user-dashboard.html";
      } else {
        heroBtn.textContent = "Explore Features";
        heroBtn.href = "#features";
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
