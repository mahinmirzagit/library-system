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
    <div style="background: white; padding: 20px; border-radius: 5px; max-width: 400px; text-align: center;">
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
            <td><span class="status ${book.available_copies > 0 ? 'available' : 'borrowed'}">${book.available_copies || 0} Available</span></td>
            <td>
              <button class="action-btn-small view-btn" data-id="${book.id}"><i class="fas fa-eye"></i> View</button>
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

function loadUserProfile() {
  fetch("/api/auth/me")
    .then((response) => response.json())
    .then((user) => {
      document.getElementById("user-name").textContent = user.name;
      document.getElementById("user-email").textContent = user.email;
      document.getElementById("profile-name").value = user.name;
      document.getElementById("profile-email").value = user.email;

      // Identity Badge QR Generation
      if (user.user_qr_code) {
        document.getElementById("user-qr-uuid").textContent = user.user_qr_code;
        const qr = qrcode(0, 'M');
        qr.addData(user.user_qr_code);
        qr.make();
        document.getElementById("user-qr-container").innerHTML = qr.createImgTag(4);
      }
    })
    .catch((error) => {
      console.error("Error loading user profile:", error);
      showNotification("Failed to load profile", "error");
    });
}

function loadBorrowedBooks() {
  fetch("/api/books/borrowed")
    .then((response) => response.json())
    .then((books) => {
      const list = document.querySelector(".borrowed-books-list");
      if (!list) return;
      list.innerHTML = "";
      if (books.length === 0) {
        list.innerHTML = "<p>You haven't borrowed any books yet.</p>";
      } else {
        books.forEach((book) => {
          const item = document.createElement("div");
          item.className = "borrowed-book-item";
          item.style.borderLeft = book.fine_amount > 0 ? "4px solid #f85149" : "4px solid #238636";
          item.innerHTML = `
            <div class="book-info">
              <h3>${book.title}</h3>
              <p>by ${book.author}</p>
              <p>Shelf: <strong style="color: #58a6ff;">${book.shelf_coordinate}</strong></p>
              <p>Due: ${new Date(book.due_date).toLocaleDateString()}</p>
              <p>Fine: <strong style="color: ${book.fine_amount > 0 ? '#f85149' : '#c9d1d9'}">Rs. ${book.fine_amount}</strong></p>
            </div>
            <div class="badge-status ${book.status}">${book.status}</div>
          `;
          list.appendChild(item);
        });
      }
    })
    .catch((error) => {
      console.error("Error loading borrowed books:", error);
      showNotification("Failed to load borrowed books", "error");
    });
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
        if (targetSection === "books") {
          loadBooks();
        } else if (targetSection === "borrowed") {
          loadBorrowedBooks();
        } else if (targetSection === "profile") {
          loadUserProfile();
        }
        document.querySelector(".recent-activity").classList.add("hidden");
      }
    });
  });

  loadActivities();
  loadBooks();

  function updateStats() {
    fetch("/api/books")
      .then((response) => {
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((books) => {
        const totalBooks = books.length;
        const availableBooks = books.filter(
          (book) => book.status === "available"
        ).length;
        document.querySelector("#total-books-card .stat-info h3").textContent =
          totalBooks.toLocaleString();
        document.querySelector(
          "#available-books-card .stat-info h3"
        ).textContent = availableBooks.toLocaleString();
      })
      .catch((error) => {
        console.error("Error fetching books:", error);
      });

    fetch("/api/books/borrowed")
      .then((response) => response.json())
      .then((books) => {
        const borrowedCount = books.length;
        document.querySelector(
          "#borrowed-books-card .stat-info h3"
        ).textContent = borrowedCount.toLocaleString();
      })
      .catch((error) => {
        console.error("Error fetching borrowed books:", error);
        document.querySelector(
          "#borrowed-books-card .stat-info h3"
        ).textContent = "0";
      });

    document.querySelector("#wishlist-card .stat-info h3").textContent = "0";
  }

  updateStats();

  const notificationBtn = document.querySelector(".notification-btn");
  notificationBtn.addEventListener("click", function () {
    loadNotifications();
    openModal("notifications-modal");
  });

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
              <span>${formattedDate}</span>
              ${
                notification.is_read == 0
                  ? '<button class="mark-read-btn" data-id="' +
                    notification.id +
                    '">Mark as Read</button>'
                  : ""
              }
            `;
            list.appendChild(item);
          });
        }
      })
      .catch((error) => {
        console.error("Error loading notifications:", error);
        showNotification("Failed to load notifications", "error");
      });
  }

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
      const btn = e.target.closest(".view-btn, .borrow-btn, .wishlist-btn");
      if (!btn) return;

      const row = btn.closest("tr");
      const id = btn.dataset.id;

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
            
            // Render Shelf Locator for User
            fetch(`/api/books/${id}/copies`)
              .then(res => res.json())
              .then(copies => {
                const avail = copies.find(c => c.status === 'available');
                renderShelfLocator("shelf-locator-container", avail ? avail.shelf_coordinate : "Out of Stock (Physical Only)");
              });

            openModal("view-book-modal");
          })
          .catch((error) => {
            console.error("Error fetching book details:", error);
            showNotification("Failed to load book details", "error");
          });
      } else if (btn.classList.contains("borrow-btn")) {
        const title = row.cells[0].textContent;
        document.getElementById("borrow-book-title").textContent = title;
        document.querySelector(".confirm-borrow-btn").dataset.id = id;
        openModal("borrow-confirm-modal");
      } else if (btn.classList.contains("wishlist-btn")) {
        showNotification("Added to wishlist", "success");
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
      openModal("filter-modal");
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

  function applyBookFilters(filterValue, sortValue) {
    const table = document.querySelector("#books-section table");
    if (!table) return;
    const tbody = table.querySelector("tbody");
    const rows = Array.from(tbody.querySelectorAll("tr"));

    rows.forEach((row) => {
      const statusCell = row.cells[3].textContent.toLowerCase();
      let show = true;
      if (filterValue === "available" && !statusCell.includes("available"))
        show = false;
      if (filterValue === "borrowed" && !statusCell.includes("borrowed"))
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

  document.querySelectorAll(".generate-report-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const reportType =
        this.closest(".report-card").querySelector("h3").textContent;
      showNotification(`Generating ${reportType} report...`, "success");
    });
  });

  const viewAllActivitiesBtn = document.querySelector(
    ".view-all-activities-btn"
  );
  if (viewAllActivitiesBtn) {
    viewAllActivitiesBtn.addEventListener("click", function () {
      openModal("all-activities-modal");
      populateAllActivitiesModal();
    });
  }

  const activityItems = document.querySelectorAll(".activity-item");
  activityItems.forEach((item) => {
    item.addEventListener("click", function () {
      const details = this.querySelector(".activity-details p").textContent;
      showNotification(`Activity Details: ${details}`, "success");
    });
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

  document
    .querySelector(".confirm-borrow-btn")
    .addEventListener("click", function () {
      const bookId = this.dataset.id;
      fetch(`/api/books/${bookId}/borrow`, {
        method: "POST",
      })
        .then((response) => response.json())
        .then((result) => {
          showNotification("Book borrowed successfully!", "success");
          loadBooks();
          updateStats();
          closeModal("borrow-confirm-modal");
          closeModal("view-book-modal");
        })
        .catch((error) => {
          console.error("Error borrowing book:", error);
          showNotification("Failed to borrow book", "error");
        });
    });

  document
    .querySelector(".cancel-borrow-btn")
    .addEventListener("click", function () {
      closeModal("borrow-confirm-modal");
    });

  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("return-book-btn")) {
      const bookId = e.target.dataset.id;
      showConfirm("Are you sure you want to return this book?", (confirmed) => {
        if (confirmed) {
          fetch(`/api/books/${bookId}/return`, {
            method: "POST",
          })
            .then((response) => response.json())
            .then((result) => {
              showNotification("Book returned successfully!", "success");
              loadBorrowedBooks();
              updateStats();
            })
            .catch((error) => {
              console.error("Error returning book:", error);
              showNotification("Failed to return book", "error");
            });
        }
      });
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth <= 768) {
      menuToggle.style.display = "block";
    } else {
      menuToggle.style.display = "none";
      sidebar.classList.remove("show");
    }
  });
});
