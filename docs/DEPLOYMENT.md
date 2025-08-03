# PDFTrackr Deployment Guide

This guide covers deployment options for PDFTrackr on DigitalOcean and other platforms.

## Prerequisites

- Docker and Docker Compose installed
- DigitalOcean account (for recommended deployment)
- Domain name (optional but recommended)
- Clerk account for authentication
- DigitalOcean Spaces bucket for file storage

## Environment Setup

### 1. Create Environment Files

Copy the example environment files and configure them:

```bash
# Backend environment
cp .env.example .env

# Frontend environment  
cp frontend/.env.example frontend/.env.local
```

### 2. Configure Environment Variables

#### Backend (.env)
```bash
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://yourdomain.com

# Database (DigitalOcean Managed PostgreSQL)
DB_HOST=your-postgres-host
DB_PORT=25060
DB_NAME=pdftrackr
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_SSL=true

# Redis (DigitalOcean Managed Redis or local)
REDIS_HOST=your-redis-host
REDIS_PORT=25061
REDIS_PASSWORD=your-redis-password

# Clerk Authentication
CLERK_SECRET_KEY=sk_live_your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=pk_live_your_clerk_publishable_key

# DigitalOcean Spaces
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_REGION=nyc3
DO_SPACES_BUCKET=your-bucket-name
DO_SPACES_KEY=your-spaces-access-key
DO_SPACES_SECRET=your-spaces-secret-key
DO_SPACES_CDN_URL=https://your-bucket.nyc3.cdn.digitaloceanspaces.com

# Security
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_live_your_clerk_secret_key
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## DigitalOcean Deployment

### Option 1: DigitalOcean Droplet

1. **Create a Droplet**
   - Ubuntu 22.04 LTS
   - 2 vCPU, 2GB RAM (Basic plan: $12/month)
   - Add your SSH key

2. **Setup Droplet**
   ```bash
   # Connect to your droplet
   ssh root@your-droplet-ip
   
   # Update system
   apt update && apt upgrade -y
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Install Docker Compose
   apt install docker-compose -y
   
   # Install Git
   apt install git -y
   ```

3. **Deploy Application**
   ```bash
   # Clone repository
   git clone https://github.com/yourusername/pdftrackr.git
   cd pdftrackr
   
   # Configure environment
   cp .env.example .env
   cp frontend/.env.example frontend/.env.local
   # Edit the files with your configuration
   
   # Deploy
   make deploy
   ```

4. **Setup Domain (Optional)**
   ```bash
   # Install Nginx
   apt install nginx -y
   
   # Configure Nginx (see nginx config below)
   nano /etc/nginx/sites-available/pdftrackr
   
   # Enable site
   ln -s /etc/nginx/sites-available/pdftrackr /etc/nginx/sites-enabled/
   systemctl reload nginx
   
   # Setup SSL with Let's Encrypt
   apt install certbot python3-certbot-nginx -y
   certbot --nginx -d yourdomain.com -d api.yourdomain.com
   ```

### Option 2: DigitalOcean App Platform

1. **Create App**
   - Connect your GitHub repository
   - Choose "Docker Compose" as the source type

2. **Configure Services**
   - **Frontend**: Port 3000, HTTP routes
   - **Backend**: Port 3001, HTTP routes for API
   - **Database**: Use DigitalOcean Managed PostgreSQL
   - **Redis**: Use DigitalOcean Managed Redis

3. **Environment Variables**
   - Add all production environment variables
   - Use DigitalOcean's managed services for database and Redis

## Database Setup

### 1. DigitalOcean Managed PostgreSQL

1. Create a PostgreSQL cluster in DigitalOcean
2. Create a database named `pdftrackr`
3. Configure connection details in your environment

### 2. Run Migrations

```bash
# Connect to your deployment environment
ssh root@your-droplet-ip
cd pdftrackr

# Run database migrations
make migrate

# Optionally seed with test data
make seed
```

## Monitoring Setup

The deployment includes Prometheus and Grafana for monitoring:

- **Prometheus**: http://your-domain:9090
- **Grafana**: http://your-domain:3001 (port 3001)
  - Default login: admin/admin

### Grafana Configuration

1. Access Grafana at your domain:3001
2. Login with admin/admin (change on first login)
3. The PDFTrackr dashboard should be automatically provisioned
4. Configure alerting (optional):
   - Add notification channels (email, Slack, etc.)
   - Set up alerts for high error rates, storage issues, etc.

## Nginx Configuration

Create `/etc/nginx/sites-available/pdftrackr`:

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Monitoring (optional)
server {
    listen 80;
    server_name monitoring.yourdomain.com;
    
    location /grafana/ {
        proxy_pass http://localhost:3001/;
        proxy_set_header Host $host;
    }
    
    location /prometheus/ {
        proxy_pass http://localhost:9090/;
        proxy_set_header Host $host;
    }
}
```

## Security Considerations

1. **Firewall Configuration**
   ```bash
   ufw enable
   ufw allow ssh
   ufw allow 80
   ufw allow 443
   # Close other ports, use internal networking for services
   ```

2. **SSL/TLS**
   - Use Let's Encrypt for free SSL certificates
   - Configure HSTS headers
   - Set up automatic certificate renewal

3. **Database Security**
   - Use DigitalOcean's managed PostgreSQL with SSL
   - Restrict database access to your application only
   - Regular backups (automatic with managed services)

4. **API Security**
   - Rate limiting is configured in the application
   - Use strong JWT secrets
   - Regular security updates

## Backup Strategy

1. **Database Backups**
   - DigitalOcean Managed PostgreSQL includes automatic backups
   - Configure additional backup retention as needed

2. **File Storage**
   - DigitalOcean Spaces has built-in redundancy
   - Consider cross-region replication for critical data

3. **Application Data**
   ```bash
   # Backup volumes
   docker-compose exec postgres pg_dump -U postgres pdftrackr > backup.sql
   
   # Backup uploaded files (if storing locally)
   tar -czf files-backup.tar.gz /path/to/files
   ```

## Scaling

### Horizontal Scaling

1. **Load Balancer**
   - Use DigitalOcean Load Balancer
   - Scale frontend and backend separately

2. **Database**
   - DigitalOcean Managed PostgreSQL supports read replicas
   - Consider connection pooling (PgBouncer)

3. **File Storage**
   - DigitalOcean Spaces scales automatically
   - Consider CDN for global distribution

### Monitoring and Alerts

1. **Set up alerts for**:
   - High CPU/memory usage
   - Storage quota approaching limits
   - API error rates
   - Database connection issues

2. **Performance monitoring**:
   - Response times
   - Database query performance
   - File upload/download speeds

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check database connectivity
   docker-compose exec backend npm run db:migrate
   ```

2. **File Upload Issues**
   ```bash
   # Verify DigitalOcean Spaces configuration
   # Check CORS settings on your bucket
   ```

3. **Authentication Issues**
   ```bash
   # Verify Clerk configuration
   # Check webhook endpoints are accessible
   ```

### Logs

```bash
# View application logs
make logs

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Production logs
docker-compose -f docker-compose.production.yml logs -f
```

### Health Checks

```bash
# Check service health
make health

# Manual health checks
curl http://localhost:3001/health
curl http://localhost:3000
curl http://localhost:9090/-/healthy
```

## Cost Optimization

### Estimated Monthly Costs (DigitalOcean)

- **Droplet (2vCPU/2GB)**: $12/month
- **Managed PostgreSQL**: $15/month  
- **Managed Redis**: $15/month
- **Spaces Storage (250GB)**: $5/month
- **Load Balancer** (optional): $10/month

**Total**: ~$47/month for full managed setup

### Cost Reduction Options

1. **Use local Redis**: Save $15/month
2. **Smaller droplet for development**: $6/month option available
3. **Self-managed PostgreSQL**: Use container (not recommended for production)

## Maintenance

### Regular Tasks

1. **Security Updates**
   ```bash
   # Update system packages
   apt update && apt upgrade -y
   
   # Update Docker images
   docker-compose pull
   docker-compose up -d
   ```

2. **Monitor Metrics**
   - Check Grafana dashboards weekly
   - Review error logs
   - Monitor storage usage

3. **Database Maintenance**
   - Managed PostgreSQL handles most maintenance automatically
   - Monitor query performance
   - Review and optimize slow queries

### Automated Tasks

Set up cron jobs for:
- Log rotation
- Database cleanup (old analytics data)
- Health checks
- Backup verification