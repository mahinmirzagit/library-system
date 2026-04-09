# 📚 LibroHub - Library Management System

![LibroHub Logo](https://img.shields.io/badge/LibroHub-Library%20Management-blue?style=for-the-badge&logo=bookstack)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)
![SQLite](https://img.shields.io/badge/SQLite-3-blue?style=flat-square&logo=sqlite)
![Express](https://img.shields.io/badge/Express-4.18+-black?style=flat-square&logo=express)

A modern, comprehensive library management system built with Node.js, Express, and SQLite. Features a beautiful web interface for both administrators and users, complete with book cataloging, user management, activity tracking, and real-time notifications.

Deployed on Vercel🔗  
Link: https://librohub-nine.vercel.app/

## ✨ Features

### 🏢 Admin Dashboard
- **Book Management**: Add, edit, delete, and search books with advanced filtering
- **User Management**: Manage user accounts, roles, and permissions
- **Activity Monitoring**: Track all system activities with real-time updates
- **Reports & Analytics**: Generate comprehensive reports on library usage
- **Settings Management**: Configure system-wide settings and policies
- **Bulk Operations**: Import/export books in multiple formats (JSON, CSV)
- **Notification System**: Real-time notifications for all activities

### 👤 User Dashboard
- **Book Browsing**: Search and browse the complete library catalog
- **Personal Profile**: Manage account settings and preferences
- **Reading History**: Track borrowed books and reading progress
- **Ratings & Reviews**: Rate and review books in the collection

### 🌐 Public Website (Hero Section)
- **Modern Landing Page**: Attractive homepage with feature highlights
- **Contact & Support**: Integrated contact forms and rating system
- **Authentication**: Secure login/registration with role-based access
- **Responsive Design**: Mobile-friendly interface across all devices

## 🚀 Installation

### Prerequisites
- Node.js (v18 or higher)
- npm (comes with Node.js)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/mahinmirzagit/library-system.git
   cd library-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

The application will automatically initialize the SQLite database on first run.

## 📖 Usage

### First-Time Setup
1. Visit `http://localhost:3000` in your browser
2. Click "Register" and create an admin/user account using verification code format: `ADM123-XYZ` or `USR123-XYZ`
3. Login with your admin/user credentials
4. Access the admin/user dashboard at `http://localhost:3000/dashboard.html`

### Admin Features
- **Dashboard Overview**: View statistics and recent activities
- **Book Management**: Add new books, edit existing ones, manage availability
- **User Management**: Create user accounts, assign roles, monitor activity
- **Settings**: Configure library policies, maintenance mode, notifications
- **Reports**: Generate usage reports and analytics

### User Features
- **Browse Books**: Search and filter the library catalog
- **Account Management**: Update profile information and preferences
- **Reading Tracking**: View borrowing history and due dates

## 🛠️ API Documentation

### Authentication Endpoints
```
POST /api/auth/register  - User registration
POST /api/auth/login     - User login
POST /api/auth/logout    - User logout
POST /api/auth/check-user - Check if user exists
```

### Book Management
```
GET    /api/books              - Get all books (with filtering)
GET    /api/books/:id          - Get specific book
POST   /api/books              - Add new book
PUT    /api/books/:id          - Update book
DELETE /api/books/:id          - Delete book
POST   /api/books/:id/borrow   - Borrow a book
POST   /api/books/:id/return   - Return a book
POST   /api/books/import       - Bulk import books
```

### User Management
```
GET    /api/users       - Get all users
GET    /api/users/:id   - Get specific user
POST   /api/users       - Create new user
PUT    /api/users/:id   - Update user
DELETE /api/users/:id   - Delete user
```

### Activities & Notifications
```
GET    /api/activities              - Get recent activities
POST   /api/activities              - Add new activity
GET    /api/submissions/notifications - Get notifications
PUT    /api/submissions/notifications/:id/read - Mark notification as read
```

### Settings & Submissions
```
GET    /api/settings                - Get system settings
PUT    /api/settings                - Update settings
POST   /api/submissions/rating      - Submit rating
POST   /api/submissions/contact     - Submit contact form
```

## 🗄️ Database Schema

### Main Database (library.db)
- **books**: Book catalog with title, author, ISBN, status, etc.
- **users**: User accounts with roles and permissions
- **activities**: System activity log (limited to 50 recent entries)
- **borrowings**: Book loan tracking
- **settings**: System configuration

### Submissions Database (submissions.db)
- **ratings**: User ratings and reviews
- **contact_submissions**: Contact form submissions
- **notifications**: System notifications

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3000
NODE_ENV=development
SESSION_SECRET=your-secret-key-here
```

### Database Initialization
The database is automatically initialized on first run using the schema files:
- `database/schema.sql` - Main library schema
- `database/submissions_schema.sql` - Submissions schema

## 🎨 Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Authentication**: Express Sessions, bcryptjs
- **Styling**: Custom CSS with responsive design
- **Icons**: Font Awesome 6
- **Fonts**: Google Fonts (Poppins)

## 📱 Responsive Design

The application is fully responsive and works seamlessly across:
- Desktop computers (1200px+)
- Tablets (768px - 1199px)
- Mobile devices (320px - 767px)

## 🔒 Security Features

- Password hashing with bcryptjs
- Session-based authentication
- Role-based access control (Admin/User)
- Input validation and sanitization
- SQL injection protection
- CORS configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- Icons provided by [Font Awesome](https://fontawesome.com/)
- Fonts by [Google Fonts](https://fonts.google.com/)
- UI inspiration from modern library management systems

## 📞 Support

For support, email mahin12112006@gmail.com or create an issue in this repository.

---

**Made with ❤️ for book lovers everywhere**
