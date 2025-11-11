# Database Migration to PostgreSQL and MinIO Setup

This document provides instructions for migrating from MySQL to PostgreSQL and setting up MinIO for media storage.

## Prerequisites

- Docker and Docker Compose installed
- Java 17+
- Maven 3.6+

## Database Migration

### 1. Start PostgreSQL and MinIO Services

```bash
# Start the services
docker-compose up -d

# Check if services are running
docker-compose ps
```

### 2. Verify Services

- **PostgreSQL**: Available at `localhost:5432`
  - Database: `leave_approval_db`
  - Username: `postgres`
  - Password: `postgres`

- **MinIO**: Available at `localhost:9000`
  - Console: `http://localhost:9001`
  - Username: `minioadmin`
  - Password: `minioadmin`

### 3. Run the Application

```bash
# Navigate to backend directory
cd backend

# Clean and build the project
mvn clean compile

# Run the application
mvn spring-boot:run
```

## Key Changes Made

### Database Changes
1. **PostgreSQL Migration**:
   - Updated `pom.xml` to use PostgreSQL driver instead of MySQL
   - Modified `application.properties` for PostgreSQL configuration
   - Converted all migration scripts to PostgreSQL syntax
   - Changed `AUTO_INCREMENT` to `BIGSERIAL`
   - Updated data types (`LONGTEXT` → `VARCHAR(500)`, `DOUBLE` → `DOUBLE PRECISION`)

2. **Schema Updates**:
   - Replaced base64 photo storage with MinIO URLs
   - Added `check_in_photo_url` and `check_out_photo_url` columns
   - Removed old `photo` column

### MinIO Integration
1. **New Services**:
   - `MinIOConfig`: Configuration for MinIO client
   - `MinIOService`: Handles file uploads and management

2. **Updated Services**:
   - `AttendanceService`: Now uploads files to MinIO instead of storing base64
   - `AttendanceController`: Added file upload endpoints

3. **New Endpoints**:
   - `POST /api/attendance/check-in/file`: Check-in with file upload
   - `PUT /api/attendance/check-out/{id}/file`: Check-out with file upload

## API Usage

### File Upload Endpoints

#### Check-in with File
```bash
curl -X POST http://localhost:8080/api/attendance/check-in/file \
  -F "userId=1" \
  -F "date=2024-01-15" \
  -F "checkInTime=2024-01-15T09:00:00" \
  -F "status=In Progress" \
  -F "latitude=40.7128" \
  -F "longitude=-74.0060" \
  -F "checkInPhoto=@/path/to/photo.jpg"
```

#### Check-out with File
```bash
curl -X PUT http://localhost:8080/api/attendance/check-out/1/file \
  -F "checkOutTime=2024-01-15T17:00:00" \
  -F "status=Completed" \
  -F "latitude=40.7128" \
  -F "longitude=-74.0060" \
  -F "checkOutPhoto=@/path/to/photo.jpg"
```

### Legacy Base64 Support
The existing base64 endpoints still work for backward compatibility:
- `POST /api/attendance/check-in`
- `PUT /api/attendance/check-out/{id}`

## Frontend Updates Needed

The frontend will need to be updated to:
1. Use file upload inputs instead of camera capture for base64
2. Send multipart/form-data requests to the new file upload endpoints
3. Display images using the MinIO URLs returned from the API

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure ports 5432 and 9000 are not in use
2. **Permission Issues**: Make sure Docker has proper permissions
3. **Database Connection**: Verify PostgreSQL is running and accessible
4. **MinIO Access**: Check MinIO console at http://localhost:9001

### Logs
```bash
# View service logs
docker-compose logs postgres
docker-compose logs minio

# View application logs
tail -f backend/target/spring-boot-app.log
```

## Data Migration

If you have existing data in MySQL:
1. Export data from MySQL
2. Transform base64 photos to files and upload to MinIO
3. Update photo references to MinIO URLs
4. Import data to PostgreSQL

## Security Considerations

1. Change default MinIO credentials in production
2. Configure proper CORS settings for MinIO
3. Set up proper access policies for the MinIO bucket
4. Use environment variables for sensitive configuration


