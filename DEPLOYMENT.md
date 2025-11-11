# Production Deployment Guide

This guide provides step-by-step instructions for deploying the Leave Approval System to production.

## Prerequisites

- Docker and Docker Compose installed
- Domain name and SSL certificate (for production)
- Strong passwords and secrets prepared

## Security Requirements

### 1. Generate Secure Secrets

```bash
# Generate JWT Secret (64 characters minimum)
openssl rand -base64 64

# Generate Database Password
openssl rand -base64 32

# Generate MinIO Secret Key
openssl rand -base64 32
```

### 2. Environment Configuration

1. Copy the environment template:
   ```bash
   cp env.prod.template .env.prod
   ```

2. Edit `.env.prod` with your production values:
   ```bash
   # Database Configuration
   DATABASE_PASSWORD=your_secure_database_password_here
   
   # JWT Configuration
   JWT_SECRET=your_very_long_and_secure_jwt_secret_key_here
   
   # CORS Configuration
   CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   
   # MinIO Configuration
   MINIO_SECRET_KEY=your_minio_secret_key_here
   
   # Application URLs
   API_URL=https://yourdomain.com/api
   ```

## Deployment Steps

### Option 1: Automated Deployment (Recommended)

**Windows:**
```cmd
deploy.bat
```

**Linux/Mac:**
```bash
./deploy.sh
```

### Option 2: Manual Deployment

1. **Stop existing services:**
   ```bash
   docker-compose -f docker-compose.prod.yml down
   ```

2. **Build and start services:**
   ```bash
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

3. **Verify deployment:**
   ```bash
   # Check backend health
   curl http://localhost:8080/api/health
   
   # Check frontend
   curl http://localhost/health
   ```

## Post-Deployment Configuration

### 1. SSL/TLS Setup (Production)

For production, you should set up SSL/TLS certificates. Consider using:
- Let's Encrypt with Certbot
- Cloudflare SSL
- Your hosting provider's SSL

### 2. Domain Configuration

Update your DNS to point to your server:
- `yourdomain.com` → Frontend (port 80/443)
- `api.yourdomain.com` → Backend (port 8080)

### 3. Firewall Configuration

Ensure these ports are open:
- 80 (HTTP)
- 443 (HTTPS)
- 8080 (Backend API)
- 5432 (PostgreSQL - restrict to internal network)
- 9000 (MinIO - restrict to internal network)
- 9001 (MinIO Console - restrict to internal network)

## Monitoring and Maintenance

### Health Checks

- **Backend Health:** `http://yourdomain.com:8080/api/health`
- **Frontend Health:** `http://yourdomain.com/health`
- **Database:** Check Docker logs: `docker-compose -f docker-compose.prod.yml logs postgres`

### Logs

```bash
# View all service logs
docker-compose -f docker-compose.prod.yml logs

# View specific service logs
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
docker-compose -f docker-compose.prod.yml logs postgres
```

### Backup

1. **Database Backup:**
   ```bash
   docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres leave_approval_db > backup.sql
   ```

2. **MinIO Backup:**
   ```bash
   # Backup MinIO data volume
   docker run --rm -v leave_leave-approval_minio_data:/data -v $(pwd):/backup alpine tar czf /backup/minio-backup.tar.gz /data
   ```

## Security Checklist

- [ ] Strong passwords for all services
- [ ] JWT secret is at least 64 characters
- [ ] CORS origins are restricted to your domain
- [ ] SSL/TLS certificates installed
- [ ] Firewall configured properly
- [ ] Regular security updates
- [ ] Database access restricted
- [ ] MinIO access restricted
- [ ] Security headers configured
- [ ] Regular backups scheduled

## Troubleshooting

### Common Issues

1. **Services won't start:**
   - Check environment variables in `.env.prod`
   - Verify Docker is running
   - Check port conflicts

2. **Database connection failed:**
   - Verify database credentials
   - Check if PostgreSQL container is running
   - Review database logs

3. **Frontend can't connect to backend:**
   - Check CORS configuration
   - Verify API_URL in environment
   - Check network connectivity

4. **File uploads not working:**
   - Verify MinIO configuration
   - Check MinIO container status
   - Review MinIO logs

### Getting Help

1. Check service logs: `docker-compose -f docker-compose.prod.yml logs [service]`
2. Verify environment variables: `docker-compose -f docker-compose.prod.yml config`
3. Test individual services: `docker-compose -f docker-compose.prod.yml exec [service] [command]`

## Production Recommendations

1. **Use a reverse proxy** (nginx/traefik) for SSL termination
2. **Set up monitoring** (Prometheus/Grafana)
3. **Implement log aggregation** (ELK stack)
4. **Set up automated backups**
5. **Use container orchestration** (Kubernetes) for high availability
6. **Implement CI/CD pipeline** for automated deployments
7. **Set up alerting** for system failures






