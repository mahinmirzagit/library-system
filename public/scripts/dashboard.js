let activities = [];

function loadActivities() {
  fetch("/api/activities")
    .then((response) => response.json())
    .then((data) => {
      activities = data;
      updateRecentActivities();
      populateAllActivitiesModal();
    })
    .catch((error) => {
      console.error("Error loading activities:", error);
      showNotification("Failed to load activities", "error");
    });
}

function loadNotifications() {
  fetch("/api/submissions/notifications")
    .then((response) => response.json())
    .then((notifications) => {
      const list = document.querySelector(".notifications-list");
      if (!list) return;
      list.innerHTML = "";
      if (notifications.length === 0) {
        list.innerHTML = "<p>No notifications yet.</p>";
      } else {
        notifications.forEach((notification) => {
          const item = document.createElement("div");
          item.className = "notification-item";
          const date = new Date(notification.timestamp);
          const formattedDate = date.toLocaleDateString("en-GB");
          item.innerHTML = `
              <p>${notification.message}</p>
              <span>${formattedDate}
              ${
                notification.is_read == 0
                  ? '<button class="btn mark-read-btn" data-id="' +
                    notification.id +
                    '"><i class="fa fa-mail-bulk" title="Mark as Read"></i></button>'
                  : ""
              }</span>
            `;
          list.appendChild(item);
        });
      }
      updateNotificationDot(notifications);
    })
    .catch((error) => {
      console.error("Error loading notifications:", error);
      showNotification("Failed to load notifications", "error");
    });
}

function updateNotificationDot(notifications) {
  const dot = document.getElementById("notification-dot");
  const hasUnread = notifications.some(n => n.is_read == 0);
  dot.style.display = hasUnread ? "block" : "none";
}

function addActivity(description, user_id = null) {
  fetch("/api/activities", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ description, user_id }),
  })
    .then((response) => response.json())
    .then((result) => {
      loadActivities();
      loadNotifications();
    })
    .catch((error) => {
      console.error("Error adding activity:", error);
      showNotification("Failed to add activity", "error");
    });
}

function updateRecentActivities() {
  const list = document.querySelector(".activity-list");
  if (!list) return;

  list.innerHTML = "";
  const recent = activities.slice(0, 5);
  recent.forEach((activity) => {
    const item = document.createElement("div");
    item.className = "activity-item";
    item.innerHTML = `<div class="activity-icon"><i class="fas fa-info-circle"></i></div><div class="activity-details"><p>${
      activity.description
    }</p><span>${new Date(activity.timestamp).toLocaleString()}</span></div>`;
    list.appendChild(item);
  });
}

function formatTime(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function populateAllActivitiesModal() {
  const list = document.querySelector(".all-activities-list");
  if (!list) return;

  list.innerHTML = "";
  activities.forEach((activity) => {
    const item = document.createElement("div");
    item.className = "activity-item";
    item.innerHTML = `<div class="activity-icon"><i class="fas fa-info-circle"></i></div><div class="activity-details"><p>${
      activity.description
    }</p><span>${new Date(activity.timestamp).toLocaleString()}</span></div>`;
    list.appendChild(item);
  });
}

function showNotification(message, type = "success") {
  let notif = document.getElementById("custom-notification");
  if (!notif) {
    notif = document.createElement("div");
    notif.id = "custom-notification";
    notif.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === "error" ? "#e74c3c" : "#27ae60"};
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 1000;
      display: none;
      font-family: Arial, sans-serif;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
    document.body.appendChild(notif);
  }
  notif.textContent = message;
  notif.style.display = "block";
  setTimeout(() => (notif.style.display = "none"), 3000);
}

function showConfirm(message, callback) {
  let modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1001;
  `;
  modal.innerHTML = `
    <div style="background: var(--sidebar-hover); padding: 20px; border-radius: 5px; max-width: 400px; text-align: center;">
      <p>${message}</p>
      <button id="confirm-yes" style="margin: 10px; padding: 5px 10px; background: #27ae60; color: white; border: none; border-radius: 3px; cursor: pointer;">Yes</button>
      <button id="confirm-no" style="margin: 10px; padding: 5px 10px; background: #e74c3c; color: white; border: none; border-radius: 3px; cursor: pointer;">No</button>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById("confirm-yes").addEventListener("click", () => {
    document.body.removeChild(modal);
    callback(true);
  });

  document.getElementById("confirm-no").addEventListener("click", () => {
    document.body.removeChild(modal);
    callback(false);
  });
}



function loadBooks() {
  fetch("/api/books")
    .then((response) => response.json())
    .then((books) => {
      const tbody = document.querySelector("#books-section tbody");
      if (!tbody) return;
      tbody.innerHTML = "";
      books.forEach((book) => {
        const row = document.createElement("tr");
        row.dataset.id = book.id;
        row.innerHTML = `
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.isbn}</td>
            <td><strong>${book.available_copies || 0} / ${book.total_copies || 0}</strong></td>
            <td>
              <button class="action-btn-small view-btn" data-id="${book.id}"><i class="fas fa-eye"></i></button>
              <button class="action-btn-small manage-copies-btn" data-id="${book.id}" title="Manage Copies"><i class="fas fa-layer-group"></i></button>
              <button class="action-btn-small delete-btn" data-id="${book.id}"><i class="fas fa-trash"></i></button>
            </td>
          `;
        tbody.appendChild(row);
      });
    })
    .catch((error) => {
      console.error("Error loading books:", error);
      showNotification("Failed to load books", "error");
    });
}

function loadUsers() {
  fetch("/api/users")
    .then((response) => response.json())
    .then((users) => {
      const tbody = document.querySelector("#users-section tbody");
      if (!tbody) return;
      tbody.innerHTML = "";
      users.forEach((user) => {
        const row = document.createElement("tr");
        row.dataset.id = user.id;
        row.innerHTML = `
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>${user.role}</td>
          <td><span class="status ${user.status}">${user.status}</span></td>
          <td>
            <button class="action-btn-small edit-btn" data-id="${user.id}"><i class="fas fa-edit"></i></button>
            <button class="action-btn-small delete-btn" data-id="${user.id}"><i class="fas fa-trash"></i></button>
          </td>
        `;
        tbody.appendChild(row);
      });
    })
    .catch((error) => {
      console.error("Error loading users:", error);
      showNotification("Failed to load users", "error");
    });
}

function loadSettings() {
  fetch("/api/settings")
    .then((response) => response.json())
    .then((settings) => {
      // General Settings
      const maintenanceMode = document.getElementById("maintenance-mode");
      if (maintenanceMode) maintenanceMode.checked = settings.maintenance_mode === "true";
      const emailNotifications = document.getElementById("email-notifications");
      if (emailNotifications) emailNotifications.checked = settings.email_notifications === "true";
      const autoBackupFrequency = document.getElementById("auto-backup-frequency");
      if (autoBackupFrequency) autoBackupFrequency.value = settings.auto_backup_frequency || "daily";
      const sessionTimeout = document.getElementById("session-timeout");
      if (sessionTimeout) sessionTimeout.value = parseInt(settings.session_timeout) || 30;

      // Library Policies
      const maxBorrowDays = document.getElementById("max-borrow-days");
      if (maxBorrowDays) maxBorrowDays.value = parseInt(settings.max_borrow_days) || 14;
      const maxBooksPerUser = document.getElementById("max-books-per-user");
      if (maxBooksPerUser) maxBooksPerUser.value = parseInt(settings.max_books_per_user) || 5;
      const overdueFineRate = document.getElementById("overdue-fine-rate");
      if (overdueFineRate) overdueFineRate.value = parseFloat(settings.overdue_fine_rate) || 0.5;
      const reservationLimit = document.getElementById("reservation-limit");
      if (reservationLimit) reservationLimit.value = parseInt(settings.reservation_limit) || 3;

      // Security Settings
      const passwordMinLength = document.getElementById("password-min-length");
      if (passwordMinLength) passwordMinLength.value = parseInt(settings.password_min_length) || 8;
      const userRegistrationApproval = document.getElementById("user-registration-approval");
      if (userRegistrationApproval) userRegistrationApproval.checked = settings.user_registration_approval === "true";

      // System Management
      const systemMaintenanceSchedule = document.getElementById("system-maintenance-schedule");
      if (systemMaintenanceSchedule) systemMaintenanceSchedule.value = settings.system_maintenance_schedule || "weekly";
      const emailTemplateOverdue = document.getElementById("email-template-overdue");
      if (emailTemplateOverdue) emailTemplateOverdue.value = settings.email_template_overdue || "default";
      const apiRateLimit = document.getElementById("api-rate-limit");
      if (apiRateLimit) apiRateLimit.value = parseInt(settings.api_rate_limit) || 100;
      const auditLoggingLevel = document.getElementById("audit-logging-level");
      if (auditLoggingLevel) auditLoggingLevel.value = settings.audit_logging_level || "info";
    })
    .catch((error) => console.error("Error loading settings:", error));
}

document.addEventListener("DOMContentLoaded", function () {
  document
    .querySelectorAll(".modal, .modal-overlay")
    .forEach((modal) => (modal.style.display = "none"));

  const sidebar = document.querySelector(".sidebar");
  const menuToggle = document.createElement("button");
  menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
  menuToggle.className = "menu-toggle";
  menuToggle.style.cssText = `
    position: fixed;
    top: 1rem;
    left: 1rem;
    z-index: 101;
    background: var(--sidebar-bg);
    border: 1px solid var(--border-color);
    color: var(--text-main);
    padding: 0.5rem;
    border-radius: 8px;
    cursor: pointer;
    display: none;
  `;

  if (window.innerWidth <= 768) {
    document.body.appendChild(menuToggle);
    menuToggle.style.display = "block";
  }

  menuToggle.addEventListener("click", function () {
    sidebar.classList.toggle("show");
  });

  document.addEventListener("click", function (e) {
    if (
      window.innerWidth <= 768 &&
      !sidebar.contains(e.target) &&
      e.target !== menuToggle
    ) {
      sidebar.classList.remove("show");
    }
  });

  const navLinks = document.querySelectorAll(".sidebar-nav a");
  const sections = document.querySelectorAll(".content-section");
  const dashboardSection = document.querySelector(".dashboard-overview");

  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const targetSection = this.getAttribute("href").substring(1);

      navLinks.forEach((l) => l.parentElement.classList.remove("active"));
      this.parentElement.classList.add("active");

      sections.forEach((section) => section.classList.add("hidden"));
      if (dashboardSection) dashboardSection.classList.add("hidden");

      if (targetSection === "dashboard") {
        if (dashboardSection) dashboardSection.classList.remove("hidden");
        document.querySelector(".recent-activity").classList.remove("hidden");
        loadActivities();
      } else {
        const targetElement = document.getElementById(
          targetSection + "-section"
        );
        if (targetElement) targetElement.classList.remove("hidden");
        if (targetSection === "manage-books") {
          loadBooks();
        } else if (targetSection === "manage-users") {
          loadUsers();
        } else if (targetSection === "settings") {
          loadSettings();
        }
        document.querySelector(".recent-activity").classList.add("hidden");
      }
    });
  });

  loadActivities();
  loadBooks();
  loadUsers();
  loadNotifications();

  function updateStats() {
    fetch("/api/books", { cache: 'no-cache' })
      .then((response) => {
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((books) => {
        const totalBooks = books.length;
        document.querySelector("#total-books-card .stat-info h3").textContent =
          totalBooks.toLocaleString();
      })
      .catch((error) => {
        console.error("Error fetching books:", error);
      });

    fetch("/api/users", { cache: 'no-cache' })
      .then((response) => {
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((users) => {
        const activeUsers = users.filter(
          (user) => user.status === "active" && user.role !== "admin"
        ).length;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const newRegistrations = users.filter(
          (user) => new Date(user.created_at) > sevenDaysAgo
        ).length;
        document.querySelector("#active-users-card .stat-info h3").textContent =
          activeUsers.toLocaleString();
        document.querySelector(
          "#new-registrations-card .stat-info h3"
        ).textContent = newRegistrations.toLocaleString();
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
      });

    fetch("/api/submissions/rating", { cache: 'no-cache' })
      .then((response) => {
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((ratings) => {
        const averageRating =
          ratings.length > 0
            ? (
                ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length
              ).toFixed(1)
            : "0.0";
        document.querySelector(
          "#average-rating-card .stat-info h3"
        ).textContent = averageRating;
      })
      .catch((error) => {
        console.error("Error fetching ratings:", error);
        document.querySelector(
          "#average-rating-card .stat-info h3"
        ).textContent = "0.0";
      });
  }

  updateStats();

  const actionButtons = document.querySelectorAll(".action-btn");
  actionButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const action = this.textContent.trim();
      if (action.includes("Add New Book")) {
        openModal("add-book-modal");
      } else if (action.includes("Add New User")) {
        openModal("add-user-modal");
      } else if (action.includes("Export Data")) {
        exportData();
      } else if (action.includes("Import Books")) {
        openModal("import-books-modal");
      } else if (action.includes("System Settings")) {
        navLinks.forEach((l) => l.parentElement.classList.remove("active"));
        document
          .querySelector('a[href="#settings"]')
          .parentElement.classList.add("active");
        sections.forEach((section) => section.classList.add("hidden"));
        document.getElementById("settings-section").classList.remove("hidden");
      }
    });
  });

  document.querySelectorAll(".add-book-btn").forEach((btn) => {
    btn.addEventListener("click", () => openModal("add-book-modal"));
  });

  document.querySelectorAll(".add-user-btn").forEach((btn) => {
    btn.addEventListener("click", () => openModal("add-user-modal"));
  });

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      if (modal.classList.contains("modal-overlay")) {
        modal.style.display = "flex";
      } else {
        modal.style.display = "block";
      }
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = "none";
    }
  }

  document.querySelectorAll(".close, .close-button").forEach((closeBtn) => {
    closeBtn.addEventListener("click", function () {
      const modal = this.closest(".modal, .modal-overlay");
      if (modal) modal.style.display = "none";
    });
  });

  window.addEventListener("click", function (e) {
    if (
      e.target.classList.contains("modal") ||
      e.target.classList.contains("modal-overlay")
    ) {
      e.target.style.display = "none";
    }
  });

  document.querySelectorAll(".modal-form").forEach((form) => {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const formData = new FormData(this);
      const data = Object.fromEntries(formData);
      const editId = data.id;

      if (this.closest("#add-book-modal")) {
        const bookData = {
          title: data.title,
          author: data.author,
          isbn: data.isbn,
          genre: data.genre,
          publication_year: parseInt(data.publicationYear) || null,
          description: data.description,
          status: data.status || "Available",
        };

        const method = editId ? "PUT" : "POST";
        const url = editId ? `/api/books/${editId}` : "/api/books";

        fetch(url, {
          method: method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bookData),
        })
          .then((response) => response.json())
          .then((result) => {
            const action = editId ? "updated" : "added";
            addActivity(`Book ${action}: ${data.title} by ${data.author}`);
            showNotification(`Book ${action} successfully!`);
            loadBooks();
            updateStats();
          })
          .catch((error) => {
            console.error("Error saving book:", error);
            showNotification("Failed to save book", "error");
          });
      } else if (this.closest("#add-user-modal")) {
        const userData = {
          name: data["Full Name"],
          email: data.Email,
          role: data.Role,
          status: "active",
        };

        const method = editId ? "PUT" : "POST";
        const url = editId ? `/api/users/${editId}` : "/api/users";

        fetch(url, {
          method: method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        })
          .then((response) => response.json())
          .then((result) => {
            const action = editId ? "updated" : "registered";
            addActivity(`User ${action}: ${data["Full Name"]} (${data.Email})`);
            showNotification(`User ${action} successfully!`);
            loadUsers();
            updateStats();
          })
          .catch((error) => {
            console.error("Error saving user:", error);
            showNotification("Failed to save user", "error");
          });
      } else if (this.closest("#import-books-modal")) {
        const fileInput = document.getElementById("books-file");
        const file = fileInput.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function (e) {
            try {
              let importedBooks = [];
              const fileContent = e.target.result;
              const fileExtension = file.name.split(".").pop().toLowerCase();

              if (fileExtension === "json") {
                importedBooks = JSON.parse(fileContent);
                if (Array.isArray(importedBooks)) {
                } else if (
                  importedBooks.books &&
                  Array.isArray(importedBooks.books)
                ) {
                  importedBooks = importedBooks.books;
                } else {
                  throw new Error(
                    "Invalid JSON format. Expected an array of books or an object with a 'books' array."
                  );
                }
              } else if (fileExtension === "csv") {
                const lines = fileContent.split("\n");
                const headers = lines[0]
                  .split(",")
                  .map((h) => h.trim().toLowerCase());
                importedBooks = lines.slice(1).map((line) => {
                  const values = line.split(",");
                  const book = {};
                  headers.forEach((header, index) => {
                    book[header] = values[index] ? values[index].trim() : "";
                  });
                  return book;
                });
              } else if (fileExtension === "txt") {
                importedBooks = fileContent
                  .split("\n")
                  .map((line) => {
                    const parts = line.split("|");
                    if (parts.length >= 2) {
                      return {
                        title: parts[0].trim(),
                        author: parts[1].trim(),
                        genre: parts[2] ? parts[2].trim() : "",
                        isbn: parts[3] ? parts[3].trim() : "",
                        publication_year: parts[4]
                          ? parseInt(parts[4].trim())
                          : null,
                        description: parts[5] ? parts[5].trim() : "",
                      };
                    }
                    return null;
                  })
                  .filter((book) => book !== null);
              } else {
                throw new Error(
                  "Unsupported file format. Please use JSON, CSV, or TXT files."
                );
              }

              // Send to API
              fetch("/api/books/import", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ books: importedBooks }),
              })
                .then((response) => {
                  if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                  }
                  return response.json();
                })
                .then((result) => {
                  if (result.errors && result.errors.length > 0) {
                    showNotification(
                      `Imported ${result.addedCount} books. Errors: ${result.errors.join(", ")}`,
                      "error"
                    );
                  } else {
                    showNotification(
                      `Successfully imported ${result.addedCount} books!`
                    );
                  }
                  loadBooks();
                  updateStats();
                  loadNotifications();
                  // Close modal after import
                  const modal = document.getElementById("import-books-modal");
                  if (modal) modal.style.display = "none";
                })
                .catch((error) => {
                  console.error("Error importing books:", error);
                  showNotification("Failed to import books", "error");
                  // Close modal on error too
                  const modal = document.getElementById("import-books-modal");
                  if (modal) modal.style.display = "none";
                });
            } catch (error) {
              showNotification(
                `Error importing books: ${error.message}`,
                "error"
              );
              // Close modal on parse error
              const modal = document.getElementById("import-books-modal");
              if (modal) modal.style.display = "none";
            }
          };
          reader.readAsText(file);
        } else {
          showNotification("Please select a file to import", "error");
          // Close modal if no file
          const modal = document.getElementById("import-books-modal");
          if (modal) modal.style.display = "none";
        }
      }

      const modal = this.closest(".modal");
      if (modal) modal.style.display = "none";

      this.reset();

      const editIdInput = this.querySelector("#edit-id");
      if (editIdInput) editIdInput.remove();
    });
  });

  const notificationBtn = document.querySelector(".notification-btn");
  notificationBtn.addEventListener("click", function () {
    loadNotifications();
    openModal("notifications-modal");
  });

  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("mark-read-btn")) {
      const id = e.target.dataset.id;
      fetch(`/api/submissions/notifications/${id}/read`, {
        method: "PUT",
      })
        .then((response) => response.json())
        .then((result) => {
          loadNotifications();
          showNotification("Notification marked as read");
        })
        .catch((error) => {
          console.error("Error marking notification as read:", error);
          showNotification("Failed to mark notification as read", "error");
        });
    }
  });

  const profileBtn = document.querySelector(".profile-btn");
  const dropdown = document.querySelector(".profile-dropdown .dropdown-menu");

  profileBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    dropdown.classList.toggle("show");
  });

  document.addEventListener("click", function (e) {
    if (!profileBtn.contains(e.target)) {
      dropdown.classList.remove("show");
    }
  });

  document
    .querySelector(".dropdown-item.logout-dropdown")
    .addEventListener("click", function (e) {
      e.preventDefault();

      fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((result) => {
          if (result.message === "Logged out successfully") {
            localStorage.clear();
            sessionStorage.clear();

            window.location.href = "index.html";
          } else {
            showNotification("Logout failed", "error");
          }
        })
        .catch((error) => {
          console.error("Error logging out:", error);
          showNotification("Logout failed", "error");
        });
    });

  document
    .querySelector("#books-section tbody")
    .addEventListener("click", function (e) {
      const btn = e.target.closest(".view-btn, .edit-btn, .delete-btn");
      if (!btn) return;

      const row = btn.closest("tr");
      const id = btn.dataset.id;
      const isBook = true;

      if (btn.classList.contains("view-btn")) {
        fetch(`/api/books/${id}`)
          .then((response) => response.json())
          .then((book) => {
            document.getElementById("book-title").textContent =
              book.title || "N/A";
            document.getElementById("book-author").textContent =
              book.author || "N/A";
            document.getElementById("book-genre").textContent =
              book.genre || "N/A";
            document.getElementById("book-isbn").textContent =
              book.isbn || "N/A";
            document.getElementById("book-issue-date").textContent =
              book.publication_year || "N/A";
            document.getElementById("book-description").textContent =
              book.description || "N/A";
            document.getElementById("book-status").textContent =
              book.status || "N/A";
            document.getElementById("book-updated-at").textContent =
              book.updated_at
                ? new Date(book.updated_at).toLocaleDateString()
                : "N/A";
            document.getElementById("book-cover-image").src =
              book.cover_image ||
              "https://via.placeholder.com/150x200/cccccc/000000?text=No+Cover";
            
            // Render Shelf Locator for the first available copy
            fetch(`/api/books/${id}/copies`)
              .then(res => res.json())
              .then(copies => {
                const avail = copies.find(c => c.status === 'available');
                renderShelfLocator("shelf-locator-container", avail ? avail.shelf_coordinate : "No Available Copies on Shelf");
              });

            openModal("view-book-modal");
          })
          .catch((error) => {
            console.error("Error fetching book details:", error);
            showNotification("Failed to load book details", "error");
          });
      } else if (btn.classList.contains("edit-btn")) {
        fetch(`/api/books/${id}`)
          .then((response) => response.json())
          .then((item) => {
            const modalId = "add-book-modal";
            const modal = document.getElementById(modalId);
            if (modal) {
              modal.querySelector('[name="title"]').value = item.title || "";
              modal.querySelector('[name="author"]').value = item.author || "";
              modal.querySelector('[name="isbn"]').value = item.isbn || "";
              modal.querySelector('[name="genre"]').value = item.genre || "";
              modal.querySelector('[name="publicationYear"]').value =
                item.publication_year || "";
              modal.querySelector('[name="description"]').value =
                item.description || "";
              modal.querySelector('[name="status"]').value = item.status || "Available";
              let editIdInput = modal.querySelector("#edit-id");
              if (!editIdInput) {
                editIdInput = document.createElement("input");
                editIdInput.type = "hidden";
                editIdInput.id = "edit-id";
                editIdInput.name = "id";
                modal.querySelector(".modal-form").appendChild(editIdInput);
              }
              editIdInput.value = id;
              modal.style.display = "block";
            }
          })
          .catch((error) => {
            console.error("Error fetching book:", error);
            showNotification("Item not found", "error");
          });
      } else if (btn.classList.contains("delete-btn")) {
        const title = row.cells[0].textContent;
        showConfirm(
          `Are you sure you want to delete "${title}"?`,
          (confirmed) => {
            if (confirmed) {
              fetch(`/api/books/${id}`, {
                method: "DELETE",
              })
                .then((response) => {
                  if (response.ok) {
                    row.remove();
                    showNotification("Item deleted successfully!");
                    loadBooks();
                    updateStats();
                  } else {
                    throw new Error("Failed to delete book");
                  }
                })
                .catch((error) => {
                  console.error("Error deleting book:", error);
                  showNotification("Failed to delete book", "error");
                });
            }
          }
        );
      }
    });

  document
    .querySelector("#users-section tbody")
    .addEventListener("click", function (e) {
      const btn = e.target.closest(".edit-btn, .delete-btn");
      if (!btn) return;

      const row = btn.closest("tr");
      const id = btn.dataset.id;
      const isBook = false;

      if (btn.classList.contains("edit-btn")) {
        fetch(`/api/users/${id}`)
          .then((response) => response.json())
          .then((item) => {
            const modalId = "add-user-modal";
            const modal = document.getElementById(modalId);
            if (modal) {
              modal.querySelector('[name="Full Name"]').value = item.name || "";
              modal.querySelector('[name="Email"]').value = item.email || "";
              modal.querySelector('[name="Password"]').value = "";
              modal.querySelector('[name="Role"]').value = item.role || "";
              let editIdInput = modal.querySelector("#edit-id");
              if (!editIdInput) {
                editIdInput = document.createElement("input");
                editIdInput.type = "hidden";
                editIdInput.id = "edit-id";
                editIdInput.name = "id";
                modal.querySelector(".modal-form").appendChild(editIdInput);
              }
              editIdInput.value = id;
              modal.style.display = "block";
            }
          })
          .catch((error) => {
            console.error("Error fetching user:", error);
            showNotification("Item not found", "error");
          });
      } else if (btn.classList.contains("delete-btn")) {
        const title = row.cells[0].textContent;
        showConfirm(
          `Are you sure you want to delete "${title}"?`,
          (confirmed) => {
            if (confirmed) {
              fetch(`/api/users/${id}`, {
                method: "DELETE",
              })
                .then((response) => {
                  if (response.ok) {
                    row.remove();
                    showNotification("Item deleted successfully!");
                    loadUsers();
                    updateStats();
                  } else {
                    throw new Error("Failed to delete user");
                  }
                })
                .catch((error) => {
                  console.error("Error deleting user:", error);
                  showNotification("Failed to delete user", "error");
                });
            }
          }
        );
      }
    });

  document.querySelectorAll(".search-input").forEach((input) => {
    input.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase();
      const table = this.closest(".content-section").querySelector("table");
      if (table) {
        const rows = table.querySelectorAll("tbody tr");
        rows.forEach((row) => {
          const text = row.textContent.toLowerCase();
          row.style.display = text.includes(searchTerm) ? "" : "none";
        });
      }
    });
  });

  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const section = btn.closest(".content-section");
      if (section.id === "books-section") {
        openModal("filter-modal");
      } else if (section.id === "users-section") {
        openModal("filter-users-modal");
      }
    });
  });

  const filterForm = document.querySelector("#filter-modal .filter-form");
  if (filterForm) {
    filterForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const filterValue = document.getElementById("filter-status").value;
      const sortValue = document.getElementById("sort-order").value;
      applyBookFilters(filterValue, sortValue);
      closeModal("filter-modal");
    });
  }

  const filterUsersForm = document.querySelector(
    "#filter-users-modal .filter-form"
  );
  if (filterUsersForm) {
    filterUsersForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const filterStatus = document.getElementById("filter-user-status").value;
      const filterRole = document.getElementById("filter-user-role").value;
      const sortValue = document.getElementById("sort-users-order").value;
      applyUserFilters(filterStatus, filterRole, sortValue);
      closeModal("filter-users-modal");
    });
  }

  function applyBookFilters(filterValue, sortValue) {
    const table = document.querySelector("#books-section table");
    if (!table) return;
    const tbody = table.querySelector("tbody");
    const rows = Array.from(tbody.querySelectorAll("tr"));

    rows.forEach((row) => {
      const statusCell = row.cells[3].textContent.toLowerCase();
      let show = true;
      if (filterValue === "Available" && !statusCell.includes("Available"))
        show = false;
      if (filterValue === "Borrowed" && !statusCell.includes("Borrowed"))
        show = false;
      row.style.display = show ? "" : "none";
    });

    const visibleRows = rows.filter((row) => row.style.display !== "none");
    visibleRows.sort((a, b) => {
      let aVal, bVal;
      if (sortValue.includes("title")) {
        aVal = a.cells[0].textContent.toLowerCase();
        bVal = b.cells[0].textContent.toLowerCase();
      } else if (sortValue.includes("author")) {
        aVal = a.cells[1].textContent.toLowerCase();
        bVal = b.cells[1].textContent.toLowerCase();
      }
      if (sortValue.includes("-desc")) {
        return bVal.localeCompare(aVal);
      } else {
        return aVal.localeCompare(bVal);
      }
    });

    visibleRows.forEach((row) => tbody.appendChild(row));
  }

  function applyUserFilters(filterStatus, filterRole, sortValue) {
    const table = document.querySelector("#users-section table");
    if (!table) return;
    const tbody = table.querySelector("tbody");
    const rows = Array.from(tbody.querySelectorAll("tr"));

    rows.forEach((row) => {
      const statusCell = row.cells[3].textContent.toLowerCase();
      const roleCell = row.cells[2].textContent.toLowerCase();
      let show = true;
      if (filterStatus === "active" && !statusCell.includes("active"))
        show = false;
      if (filterStatus === "inactive" && !statusCell.includes("inactive"))
        show = false;
      if (filterRole === "user" && !roleCell.includes("user")) show = false;
      if (filterRole === "admin" && !roleCell.includes("admin")) show = false;
      row.style.display = show ? "" : "none";
    });

    const visibleRows = rows.filter((row) => row.style.display !== "none");
    visibleRows.sort((a, b) => {
      let aVal, bVal;
      if (sortValue.includes("name")) {
        aVal = a.cells[0].textContent.toLowerCase();
        bVal = b.cells[0].textContent.toLowerCase();
      } else if (sortValue.includes("email")) {
        aVal = a.cells[1].textContent.toLowerCase();
        bVal = b.cells[1].textContent.toLowerCase();
      }
      if (sortValue.includes("-desc")) {
        return bVal.localeCompare(aVal);
      } else {
        return aVal.localeCompare(bVal);
      }
    });

    visibleRows.forEach((row) => tbody.appendChild(row));
  }

  document.querySelectorAll(".generate-report-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const reportType =
        this.closest(".report-card").querySelector("h3").textContent;
      showNotification(`Generating ${reportType} report...`, "success");
    });
  });

  const viewReviewsBtn = document.querySelector(".view-reviews-btn");
  if (viewReviewsBtn) {
    viewReviewsBtn.addEventListener("click", function () {
      fetch("/api/submissions/rating")
        .then((response) => response.json())
        .then((ratings) => {
          const list = document.querySelector(".ratings-list");
          if (!list) return;
          list.innerHTML = "";
          if (ratings.length === 0) {
            list.innerHTML = "<p>No reviews yet.</p>";
          } else {
            ratings.forEach((rating) => {
              const item = document.createElement("div");
              item.className = "rating-item";
              const date = new Date(rating.timestamp);
              const formattedDate = date.toLocaleDateString("en-GB");
              item.innerHTML = `
                <div class="rating-compact">
                  <div class="rating-header">
                    <span class="rating-user">${rating.user} (${
                rating.email
              })</span>
                    <span class="rating-date">${formattedDate}</span>
                  </div>
                  <div class="rating-stars">${"★".repeat(
                    rating.stars
                  )}${"☆".repeat(5 - rating.stars)}</div>
                  <div class="rating-message">${rating.message}</div>
                  ${
                    rating.reply
                      ? `<div class="rating-reply-display">Reply: ${rating.reply}</div>`
                      : ""
                  }
                  <div class="rating-reply">
                    <button onclick="replyToRating(${rating.id})">Reply</button>
                  </div>
                </div>
              `;
              list.appendChild(item);
            });
          }
          openModal("ratings-modal");
        })
        .catch((error) => {
          console.error("Error loading reviews:", error);
          showNotification("Failed to load reviews", "error");
        });
    });
  }

  const saveSettingsBtn = document.querySelector(".save-settings-btn");
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener("click", function () {
      const settings = {
        maintenanceMode: document.getElementById("maintenance-mode").checked,
        emailNotifications: document.getElementById("email-notifications")
          .checked,
        maxBorrowDays: document.querySelector('input[type="number"][value]')
          .value,
        maxBooksPerUser: document.querySelectorAll('input[type="number"]')[1]
          .value,
      };

      showNotification("Settings saved successfully!", "success");
    });
  }

  function exportData() {
    const books = JSON.parse(localStorage.getItem("books")) || [];
    const users = JSON.parse(localStorage.getItem("users")) || [];

    const data = {
      books: books.map((book) => ({
        title: book.title,
        author: book.author,
        status: book.status,
        genre: book.genre,
        isbn: book.isbn,
        publication_year: book.publication_year,
        description: book.description,
      })),
      users: users.map((user) => ({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "library-data-export.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification("Data exported successfully!", "success");
  }

  const viewAllActivitiesBtn = document.querySelector(
    ".view-all-activities-btn"
  );
  if (viewAllActivitiesBtn) {
    viewAllActivitiesBtn.addEventListener("click", function () {
      openModal("all-activities-modal");
      populateAllActivitiesModal();
    });
  }

  const clearRecentActivitiesBtn = document.querySelector(".clear-recent-activities-btn");
  if (clearRecentActivitiesBtn) {
    clearRecentActivitiesBtn.addEventListener("click", function () {
      showConfirm("Are you sure you want to clear all activities?", (confirmed) => {
        if (confirmed) {
          fetch("/api/activities", {
            method: "DELETE",
          })
          .then((response) => response.json())
          .then((result) => {
            loadActivities();
            showNotification("All activities cleared successfully");
          })
          .catch((error) => {
            console.error("Error clearing activities:", error);
            showNotification("Failed to clear activities", "error");
          });
        }
      });
    });
  }

  const clearActivitiesBtn = document.querySelector(".clear-activities-btn");
  if (clearActivitiesBtn) {
    clearActivitiesBtn.addEventListener("click", function () {
      showConfirm("Are you sure you want to clear all activities?", (confirmed) => {
        if (confirmed) {
          fetch("/api/activities", {
            method: "DELETE",
          })
            .then((response) => response.json())
            .then((result) => {
              loadActivities();
              showNotification("All activities cleared successfully");
            })
            .catch((error) => {
              console.error("Error clearing activities:", error);
              showNotification("Failed to clear activities", "error");
            });
        }
      });
    });
  }

  const activityItems = document.querySelectorAll(".activity-item");
  activityItems.forEach((item) => {
    item.addEventListener("click", function () {
      const details = this.querySelector(".activity-details p").textContent;
      showNotification(`Activity Details: ${details}`, "success");
    });
  });

  let currentAction = null;

  const removeAllBooksBtn = document.querySelector(".remove-all-books-btn");
  const removeAllUsersBtn = document.querySelector(".remove-all-users-btn");
  const resetWebappBtn = document.querySelector(".reset-webapp-btn");

  if (removeAllBooksBtn) {
    removeAllBooksBtn.addEventListener("click", function () {
      currentAction = "removeBooks";
      openModal("password-confirm-modal");
    });
  }

  if (removeAllUsersBtn) {
    removeAllUsersBtn.addEventListener("click", function () {
      currentAction = "removeUsers";
      openModal("password-confirm-modal");
    });
  }

  if (resetWebappBtn) {
    resetWebappBtn.addEventListener("click", function () {
      currentAction = "resetWebapp";
      openModal("password-confirm-modal");
    });
  }

  const passwordConfirmForm = document.getElementById("password-confirm-form");
  if (passwordConfirmForm) {
    passwordConfirmForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const password = document.getElementById("confirm-password").value;
      const verificationCode = document.getElementById("confirm-verification-code").value;

      fetch("/api/auth/verify-admin-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ password, verificationCode }),
      })
        .then((response) => response.json())
        .then((result) => {
          if (result.message === "Password verified successfully") {
            performAction(currentAction);
            closeModal("password-confirm-modal");
            document.getElementById("confirm-password").value = "";
            document.getElementById("confirm-verification-code").value = "";
          } else {
            showNotification("Incorrect password or verification code", "error");
          }
        })
        .catch((error) => {
          console.error("Error verifying password:", error);
          showNotification("Failed to verify password", "error");
        });
    });
  }

  function performAction(action) {
    switch (action) {
      case "removeBooks":
        fetch("/api/books", {
          method: "DELETE",
        })
          .then((response) => response.json())
          .then((result) => {
            loadBooks();
            updateStats();
            addActivity("All books removed");
            showNotification("All books removed successfully");
          })
          .catch((error) => {
            console.error("Error removing all books:", error);
            showNotification("Failed to remove all books", "error");
          });
        break;
      case "removeUsers":
        fetch("/api/users", {
          method: "DELETE",
        })
          .then((response) => response.json())
          .then((result) => {
            loadUsers();
            updateStats();
            addActivity("All users removed");
            showNotification("All users removed successfully");
          })
          .catch((error) => {
            console.error("Error removing all users:", error);
            showNotification("Failed to remove all users", "error");
          });
        break;
      case "resetWebapp":
        Promise.all([
          fetch("/api/books", { method: "DELETE" }),
          fetch("/api/users", { method: "DELETE" }),
          fetch("/api/activities", { method: "DELETE" }),
          fetch("/api/settings", { method: "DELETE" }),
          fetch("/api/submissions/ratings", { method: "DELETE" }),
          fetch("/api/submissions/contact", { method: "DELETE" }),
        ])
          .then((responses) => Promise.all(responses.map((r) => r.json())))
          .then((results) => {
            loadBooks();
            loadUsers();
            updateStats();
            loadActivities();
            addActivity("Webapp reset");
            showNotification("Webapp reset successfully");
          })
          .catch((error) => {
            console.error("Error resetting webapp:", error);
            showNotification("Failed to reset webapp", "error");
          });
        break;
    }
  }

  window.addEventListener("resize", function () {
    if (window.innerWidth <= 768) {
      menuToggle.style.display = "block";
    } else {
      menuToggle.style.display = "none";
      sidebar.classList.remove("show");
    }
  });

  window.replyToRating = function (ratingId) {
    const replyText = prompt("Enter your reply:");
    if (replyText && replyText.trim()) {
      fetch(`/api/submissions/rating/${ratingId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reply: replyText.trim() }),
      })
        .then((response) => response.json())
        .then((result) => {
          showNotification("Reply added successfully!");

          fetch("/api/submissions/rating")
            .then((response) => response.json())
            .then((ratings) => {
              const list = document.querySelector(".ratings-list");
              if (!list) return;
              list.innerHTML = "";
              if (ratings.length === 0) {
                list.innerHTML = "<p>No ratings yet.</p>";
              } else {
                ratings.forEach((rating) => {
                  const item = document.createElement("div");
                  item.className = "rating-item";
                  const date = new Date(rating.timestamp);
                  const formattedDate = date.toLocaleDateString("en-GB");
                  const currentUserName =
                    localStorage.getItem("userName") || "Anonymous";
                  const currentUserEmail =
                    localStorage.getItem("userEmail") || "N/A";
                  item.innerHTML = `
                    <div class="rating-compact">
                      <div class="rating-header">
                        <span class="rating-user">${currentUserName} (${currentUserEmail})</span>
                        <span class="rating-date">${formattedDate}</span>
                      </div>
                      <div class="rating-stars">${"★".repeat(
                        rating.stars
                      )}${"☆".repeat(5 - rating.stars)}</div>
                      <div class="rating-message">${rating.message}</div>
                      ${
                        rating.reply
                          ? `<div class="rating-reply-display">Reply: ${rating.reply}</div>`
                          : ""
                      }
                      <div class="rating-reply">
                        <button onclick="replyToRating(${
                          rating.id
                        })">Reply</button>
                      </div>
                    </div>
                  `;
                  list.appendChild(item);
                });
              }
            })
            .catch((error) => {
              console.error("Error reloading ratings:", error);
              showNotification("Failed to reload ratings", "error");
            });
        })
        .catch((error) => {
          console.error("Error adding reply:", error);
          showNotification("Failed to add reply", "error");
        });
    }
  // --- Physical Inventory Management Logic ---
  const lookupBtn = document.getElementById("lookup-isbn-btn");
  if (lookupBtn) {
    lookupBtn.addEventListener("click", function() {
      const isbn = document.getElementById("isbn-input").value.trim();
      if (!isbn) return showNotification("Please enter an ISBN first", "error");
      lookupBtn.disabled = true;
      lookupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      fetch(`/api/books/details/${isbn}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          document.getElementById("title-input").value = data.title;
          document.getElementById("author-input").value = data.author;
          document.querySelector('input[name="genre"]').value = data.genre;
          document.querySelector('input[name="publicationYear"]').value = data.publication_year;
          document.querySelector('textarea[name="description"]').value = data.description;
          showNotification("Metadata fetched from Google Books!");
        })
        .catch(err => showNotification(err.message, "error"))
        .finally(() => {
          lookupBtn.disabled = false;
          lookupBtn.innerHTML = '<i class="fas fa-search"></i> Lookup';
        });
    });
  }

  window.openManageCopies = function(bookId) {
    const addCopyBtn = document.getElementById("add-copy-btn");
    addCopyBtn.dataset.bookId = bookId;
    fetch(`/api/books/${bookId}`)
      .then(res => res.json())
      .then(book => {
        document.getElementById("manage-copies-title").textContent = `Copies: ${book.title}`;
        loadCopies(bookId);
        openModal("manage-copies-modal");
      });
  };

  window.loadCopies = function(bookId) {
    const tbody = document.getElementById("copies-tbody");
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;"><i class="fas fa-spinner fa-spin"></i></td></tr>';
    fetch(`/api/books/${bookId}/copies`)
      .then(res => res.json())
      .then(copies => {
        tbody.innerHTML = "";
        copies.forEach(copy => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td style="font-family: monospace; font-size: 11px;">${copy.copy_uuid}</td>
            <td>${copy.shelf_coordinate}</td>
            <td><span class="status ${copy.status}">${copy.status}</span></td>
            <td><button class="btn-small" onclick="viewQR('${copy.copy_uuid}', '${copy.qr_code_data}')"><i class="fas fa-qrcode"></i> View</button></td>
            <td><button class="btn-small" onclick="showNotification('Audit logging in progress')"><i class="fas fa-history"></i></button></td>
          `;
          tbody.appendChild(row);
        });
      });
  };

  window.viewQR = function(uuid, data) {
    document.getElementById("qr-container").innerHTML = `<img src="${data}" style="width: 100%;" />`;
    document.getElementById("qr-uuid-text").textContent = `ID: ${uuid}`;
    openModal("qr-display-modal");
  };

  // Manage Copies Delegation
  document.querySelector("#books-section tbody").addEventListener("click", function(e) {
    const btn = e.target.closest(".manage-copies-btn");
    if (btn) openManageCopies(btn.dataset.id);
  });

  const addCopyBtn = document.getElementById("add-copy-btn");
  if (addCopyBtn) {
    addCopyBtn.addEventListener("click", function() {
      const bookId = this.dataset.bookId;
      const shelf = document.getElementById("new-copy-shelf").value.trim();
      if (!shelf) return showNotification("Shelf coordinate is required", "error");
      fetch(`/api/books/${bookId}/copies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shelf_coordinate: shelf })
      })
      .then(res => res.json())
      .then(data => {
        showNotification("Physical copy added successfully!");
        document.getElementById("new-copy-shelf").value = "";
        loadCopies(bookId);
        loadBooks();
      });
    });
  }
});
