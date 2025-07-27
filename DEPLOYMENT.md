# 🚀 sosAI Hetzner Deployment Guide

This guide walks you through deploying your emergency response system on Hetzner Cloud.

## 📋 Prerequisites

- Hetzner Cloud account
- Docker installed locally
- SSH key configured for server access
- Anthropic API key

## 🖥️ Server Setup

### 1. Create Hetzner Server

```bash
# Recommended specifications:
- Type: CX21 (2 vCPU, 4GB RAM) or higher
- OS: Ubuntu 22.04 LTS
- Location: Choose closest to your users
- SSH Key: Add your public key
```

### 2. Initial Server Configuration

```bash
# Set your server IP
export SERVER_IP="your.server.ip.here"
export SERVER_USER="root"

# Run initial setup (only once)
chmod +x deploy.sh
./deploy.sh setup
```

This will:
- Install Docker & Docker Compose
- Configure firewall (ports 22, 80, 443)
- Create application directory
- Setup log rotation

## 🔧 Configuration

### 1. Environment Variables

```bash
# Copy and configure environment file
cp .env.example .env

# Edit with your values
nano .env
```

**Required variables:**
- `ANTHROPIC_API_KEY`: Your Claude API key
- `SERVER_IP`: Your Hetzner server IP

### 2. Update Frontend API URL

Update your frontend to point to the production API:

```typescript
// In your frontend API configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // Will be proxied by Nginx
  : 'http://localhost:8000';
```

## 🚀 Deployment

### Quick Deploy

```bash
# Deploy to staging
./deploy.sh staging

# Deploy to production
./deploy.sh production
```

### Manual Deployment Steps

If you prefer manual deployment:

```bash
# 1. Build images locally
docker build -f Dockerfile.backend -t sosai-backend:latest .
docker build -f Dockerfile.frontend -t sosai-frontend:latest .

# 2. Save images
docker save sosai-backend:latest | gzip > sosai-backend.tar.gz
docker save sosai-frontend:latest | gzip > sosai-frontend.tar.gz

# 3. Upload to server
scp sosai-backend.tar.gz sosai-frontend.tar.gz docker-compose.yml .env root@$SERVER_IP:/opt/sosai/

# 4. Deploy on server
ssh root@$SERVER_IP
cd /opt/sosai
docker load < sosai-backend.tar.gz
docker load < sosai-frontend.tar.gz
docker-compose up -d
```

## 🔍 Monitoring & Maintenance

### Health Checks

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Check health endpoints
curl http://your-server-ip/health
curl http://your-server-ip/api/health
```

### Database Backup

```bash
# Backup SQLite database
docker-compose exec backend cp emergency_call.db /app/backups/emergency_call_$(date +%Y%m%d_%H%M%S).db
```

### Updates

```bash
# Pull latest changes
git pull origin main

# Redeploy
./deploy.sh production
```

## 🔒 Security Considerations

### SSL/HTTPS Setup

For production, add SSL certificates:

```bash
# Install Certbot
apt install certbot

# Get SSL certificate
certbot certonly --standalone -d your-domain.com

# Update nginx configuration to use SSL
# Copy certificates to ./ssl/ directory
```

### Firewall Configuration

```bash
# Check firewall status
ufw status

# Only allow necessary ports
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
```

### API Rate Limiting

The Nginx configuration includes rate limiting:
- 10 requests/second per IP
- Burst of 20 requests
- Configurable in `nginx.conf`

## 📊 Performance Optimization

### Resource Monitoring

```bash
# Monitor resource usage
docker stats

# Check disk usage
df -h

# Monitor logs
tail -f /var/log/nginx/access.log
```

### Scaling Considerations

For high traffic:
1. **Upgrade server**: CX31 (2 vCPU, 8GB) or CX41 (4 vCPU, 16GB)
2. **Add load balancer**: Use Hetzner Load Balancer
3. **Database**: Consider PostgreSQL for better concurrency
4. **CDN**: Use Cloudflare for static assets

## 🆘 Troubleshooting

### Common Issues

**Container won't start:**
```bash
docker-compose logs backend
# Check for missing environment variables or API key issues
```

**Audio processing fails:**
```bash
# Check ffmpeg installation
docker-compose exec backend ffmpeg -version

# Check file permissions
docker-compose exec backend ls -la uploads/
```

**Frontend not loading:**
```bash
# Check nginx configuration
docker-compose exec frontend nginx -t

# Verify build output
docker-compose exec frontend ls -la /usr/share/nginx/html/
```

### Emergency Recovery

```bash
# Stop all services
docker-compose down

# Remove corrupted containers
docker system prune -a

# Redeploy from scratch
./deploy.sh production
```

## 📞 Support

- Check logs: `docker-compose logs -f`
- Monitor health: `curl http://your-server/health`
- Database issues: Backup and restore from known good state
- Performance: Monitor with `docker stats` and `htop`

## 🎯 Production Checklist

- [ ] Server provisioned with adequate resources
- [ ] SSH keys configured
- [ ] Environment variables set
- [ ] SSL certificates installed (for HTTPS)
- [ ] Firewall configured
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Domain name configured (optional)
- [ ] Rate limiting tested
- [ ] Health checks verified

Your sosAI emergency response system should now be running at `http://your-server-ip`!
