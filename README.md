# Leave Approval Management System

A comprehensive web application for managing employee leave requests with advanced attendance tracking, photo verification, and location-based check-in/check-out functionality.

## 🌟 Features

### Core Functionality
- **User Authentication & Authorization** - Secure login with JWT tokens and role-based access control
- **Leave Request Management** - Submit, approve, and track leave requests with multiple leave types
- **Advanced Attendance System** - Photo and location-verified check-in/check-out with real-time camera streaming
- **Admin Dashboard** - Comprehensive management interface for administrators
- **Real-time Notifications** - Toast notifications for user feedback and system updates

### Technical Features
- **Modern UI/UX** - Glass-morphism design with responsive layout
- **Camera Integration** - Real-time photo capture for attendance verification
- **Geolocation Services** - Location-based attendance tracking
- **Database Management** - MySQL with Flyway migrations
- **RESTful API** - Spring Boot backend with comprehensive endpoints
- **Security** - JWT authentication, password encryption, and CORS protection

## 🏗️ Architecture

### Backend (Spring Boot)
```
backend/
├── src/main/java/com/company/leaveapproval/
│   ├── controller/          # REST API endpoints
│   ├── entity/             # JPA entities
│   ├── repository/         # Data access layer
│   ├── service/            # Business logic
│   ├── security/           # Authentication & authorization
│   ├── dto/                # Data transfer objects
│   └── config/             # Configuration classes
├── src/main/resources/
│   ├── application.properties
│   └── db/migration/       # Flyway database migrations
└── pom.xml
```

### Frontend (Angular)
```
frontend/
├── src/app/
│   ├── components/         # Angular components
│   │   ├── admin-panel/    # Admin management interface
│   │   ├── dashboard/      # Main dashboard
│   │   ├── leave-form/     # Leave request form
│   │   ├── login/          # Authentication
│   │   ├── simple-attendance/ # Attendance tracking
│   │   └── toast/          # Notification system
│   ├── services/           # API services
│   ├── models/             # TypeScript interfaces
│   ├── guards/             # Route guards
│   └── interceptors/       # HTTP interceptors
├── src/assets/             # Static assets
└── src/environments/       # Environment configurations
```

## 🚀 Quick Start

### Prerequisites
- **Java 17+** - For Spring Boot backend
- **Node.js 18+** - For Angular frontend
- **MySQL 8.0+** - Database server
- **Maven 3.6+** - Build tool for backend

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Leave_Approval_Request
   ```

2. **Database Setup**
   ```sql
   CREATE DATABASE leave_approval_db;
   CREATE USER 'leave_user'@'localhost' IDENTIFIED BY 'leave_password';
   GRANT ALL PRIVILEGES ON leave_approval_db.* TO 'leave_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. **Backend Setup**
   ```bash
   cd backend
   # Update database credentials in src/main/resources/application.properties
   mvn clean install
   mvn spring-boot:run
   ```
   Backend will be available at `http://localhost:8080`

4. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```
   Frontend will be available at `http://localhost:4200`

## 📱 Usage

### For Employees
1. **Login** - Use your credentials to access the system
2. **Submit Leave Request** - Fill out the leave form with dates and reason
3. **Track Attendance** - Use the camera to check-in/check-out with location verification
4. **View History** - Monitor your leave requests and attendance records

### For Administrators
1. **Employee Management** - Add, edit, or remove employees
2. **Leave Approval** - Review and approve/reject leave requests
3. **Attendance Monitoring** - View all employee attendance records
4. **System Overview** - Access comprehensive analytics and reports

## 🔧 Configuration

### Backend Configuration
Update `backend/src/main/resources/application.properties`:
```properties
# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/leave_approval_db
spring.datasource.username=leave_user
spring.datasource.password=leave_password

# JWT Configuration
jwt.secret=your-secret-key
jwt.expiration=86400000

# Server Configuration
server.port=8080
```

### Frontend Configuration
Update `frontend/src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

## 🗄️ Database Schema

### Core Tables
- **users** - Employee and admin user accounts
- **leave_requests** - Leave request submissions and approvals
- **attendance** - Check-in/check-out records with photos and location
- **flyway_schema_history** - Database migration tracking

### Key Relationships
- Users can have multiple leave requests
- Users can have multiple attendance records
- Leave requests can be approved by admin users
- Attendance records include photo and location data

## 🔐 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Encryption** - BCrypt password hashing
- **Role-based Access Control** - Admin and Employee roles
- **CORS Protection** - Cross-origin request security
- **Input Validation** - Server-side validation for all inputs

## 📸 Camera & Location Features

### Camera Integration
- Real-time video streaming for attendance verification
- Photo capture for both check-in and check-out
- Automatic camera initialization and error handling
- Mobile-responsive camera interface

### Location Services
- GPS-based location tracking
- Location verification for attendance
- Privacy-conscious location handling
- Fallback mechanisms for location services

## 🎨 UI/UX Features

### Design System
- **Glass-morphism Design** - Modern translucent interface elements
- **Responsive Layout** - Mobile-first responsive design
- **Material Icons** - Consistent iconography throughout
- **Smooth Animations** - CSS transitions and hover effects

### Color Palette
- Primary: Blue gradient (#0ea5e9 to #0284c7)
- Success: Green (#22c55e)
- Warning: Amber (#f59e0b)
- Danger: Red (#ef4444)
- Neutral: Gray scale for text and backgrounds

## 🚀 Deployment

### Backend Deployment
1. Build the JAR file: `mvn clean package`
2. Deploy to your server with Java 17+
3. Configure database connection
4. Set environment variables for production

### Frontend Deployment
1. Build for production: `ng build --prod`
2. Deploy the `dist/` folder to your web server
3. Configure API endpoints for production
4. Set up HTTPS for secure communication

## 🧪 Testing

### Backend Testing
```bash
cd backend
mvn test
```

### Frontend Testing
```bash
cd frontend
ng test
```

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/signin` - User login
- `GET /api/auth/test-db` - Database connection test

### User Management
- `GET /api/users` - Get all users (Admin only)
- `POST /api/users` - Create new user (Admin only)
- `DELETE /api/users/{id}` - Delete user (Admin only)

### Leave Management
- `GET /api/leave-requests` - Get user's leave requests
- `POST /api/leave-requests` - Submit leave request
- `PUT /api/leave-requests/{id}/approve` - Approve/reject leave request

### Attendance Management
- `POST /api/attendance/checkin` - Check-in with photo and location
- `POST /api/attendance/checkout` - Check-out with photo
- `GET /api/attendance` - Get attendance records

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify MySQL is running
   - Check database credentials
   - Ensure database exists

2. **Camera Not Working**
   - Check browser permissions
   - Ensure HTTPS in production
   - Verify camera hardware

3. **Location Services Not Available**
   - Check browser permissions
   - Ensure HTTPS in production
   - Verify GPS is enabled

4. **Build Failures**
   - Check Java and Node.js versions
   - Clear Maven and npm caches
   - Verify all dependencies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Added camera and location features
- **v1.2.0** - Enhanced UI/UX and admin panel
- **v1.3.0** - Optimized codebase and improved performance

---

**Built with ❤️ using Spring Boot, Angular, and MySQL**

#   E m p l o y e e _ M a n a g e m e n t _ S y s t e m  
 #   E M S _ L a t r o b e  
 