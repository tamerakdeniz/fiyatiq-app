# 🚀 FiyatIQ Production Deployment Guide

**Server**: 64.226.67.215  
**Domain**: fiyatiq.wxcodesign.com

## 📋 Prerequisites

### Server Requirements
- Ubuntu 20.04+ or CentOS 8+
- Docker & Docker Compose installed
- At least 2GB RAM
- 10GB free disk space
- Ports 80, 443, 3000, 8000 available

### Domain Configuration
- DNS A record pointing `fiyatiq.wxcodesign.com` to `64.226.67.215`
- SSL certificates (optional for initial setup)

## 🔧 Server Setup

### 1. Install Docker & Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for group changes to take effect
```

### 2. Clone the Repository

```bash
git clone https://github.com/tamerakdeniz/fiyatiq-app.git
cd fiyatiq
```

### 3. Configure Environment Variables

```bash
# Copy example environment files
cp backend/env.example backend/.env
cp frontend/env.example frontend/.env.local

# Edit backend environment file
nano backend/.env
```

**Required backend/.env content:**
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
GEMINI_TEMPERATURE=0.2
GEMINI_MAX_TOKENS=2048
APP_NAME=FiyatIQ API
APP_VERSION=5.0.0
DEBUG=False
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=["*"]
ALLOWED_METHODS=["*"]
ALLOWED_HEADERS=["*"]
```

### 4. Generate SSL Certificates (Optional)

For testing with self-signed certificates:

```bash
cd nginx/ssl
chmod +x generate-ssl.sh
./generate-ssl.sh
cd ../..
```

**For production, use real SSL certificates:**
- Obtain certificates from Let's Encrypt or your CA
- Place them in `nginx/ssl/` directory
- Update `nginx/sites-available/fiyatiq.conf` with correct paths

### 5. Deploy the Application

```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

## 🌐 Domain Configuration

### DNS Setup
Add these DNS records to your domain provider:

```
Type: A
Name: fiyatiq
Value: 64.226.67.215
TTL: 300
```

### SSL Certificate (Production)
For production SSL certificates:

1. **Using Let's Encrypt (Recommended):**
```bash
# Install Certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d fiyatiq.wxcodesign.com

# Copy certificates to nginx directory
sudo cp /etc/letsencrypt/live/fiyatiq.wxcodesign.com/fullchain.pem nginx/ssl/fiyatiq.crt
sudo cp /etc/letsencrypt/live/fiyatiq.wxcodesign.com/privkey.pem nginx/ssl/fiyatiq.key
```

2. **Update nginx configuration:**
Edit `nginx/sites-available/fiyatiq.conf` and uncomment the real SSL certificate lines.

## 🔍 Verification

### Check Service Status
```bash
# View all containers
docker-compose ps

# Check logs
docker-compose logs -f

# Health checks
curl http://localhost:8000/health
curl http://localhost:3000
curl http://localhost:80
```

### Test Application
1. **Frontend**: https://fiyatiq.wxcodesign.com
2. **API Documentation**: https://fiyatiq.wxcodesign.com/docs
3. **Health Check**: https://fiyatiq.wxcodesign.com/health

## 🛠 Maintenance

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

### Backup
```bash
# Backup environment files
cp backend/.env backend/.env.backup
cp frontend/.env.local frontend/.env.local.backup

# Backup nginx configuration
tar -czf nginx-backup.tar.gz nginx/
```

### Restart Services
```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
docker-compose restart nginx
```

## 🔒 Security Considerations

### Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### SSL Certificate Renewal
If using Let's Encrypt, set up automatic renewal:

```bash
# Add to crontab
sudo crontab -e

# Add this line for monthly renewal
0 12 1 * * /usr/bin/certbot renew --quiet && docker-compose restart nginx
```

### Environment Security
- Never commit `.env` files to version control
- Use strong, unique API keys
- Regularly rotate credentials
- Monitor application logs for suspicious activity

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
```bash
# Check what's using the port
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Stop conflicting services
sudo systemctl stop apache2  # if using Apache
sudo systemctl stop nginx    # if using system nginx
```

2. **Docker Permission Issues**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Logout and login again
```

3. **SSL Certificate Issues**
```bash
# Check certificate validity
openssl x509 -in nginx/ssl/fiyatiq.crt -text -noout

# Test nginx configuration
docker-compose exec nginx nginx -t
```

4. **API Connection Issues**
```bash
# Check backend logs
docker-compose logs backend

# Test API directly
curl -X POST http://localhost:8000/health
```

### Performance Optimization

1. **Enable Gzip Compression** (already configured in nginx)
2. **Set up CDN** for static assets
3. **Configure caching** for API responses
4. **Monitor resource usage**

```bash
# Monitor container resources
docker stats

# Check disk usage
df -h

# Check memory usage
free -h
```

## 📞 Support

For deployment issues:
1. Check the logs: `docker-compose logs -f`
2. Verify environment variables
3. Test individual services
4. Check DNS propagation
5. Verify SSL certificate validity

---

**Note**: This deployment guide assumes a clean Ubuntu server. Adjust commands for your specific server environment. 