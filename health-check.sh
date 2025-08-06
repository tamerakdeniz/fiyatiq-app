#!/bin/bash

# FiyatIQ Health Check Script
# Checks the status of all services

set -e

echo "🏥 FiyatIQ Health Check"
echo "========================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check service
check_service() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Checking $name... "
    
    if curl -f -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        return 1
    fi
}

# Check Docker containers
echo "📦 Docker Containers:"
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ All containers are running${NC}"
else
    echo -e "${RED}❌ Some containers are not running${NC}"
    docker-compose ps
fi

echo ""
echo "🌐 Service Health Checks:"

# Check backend health
check_service "Backend Health" "http://localhost:8000/health" "200"

# Check frontend
check_service "Frontend" "http://localhost:3000" "200"

# Check nginx
check_service "Nginx" "http://localhost:80" "200"

# Check domain (if DNS is configured)
if nslookup fiyatiq.wxcodesign.com > /dev/null 2>&1; then
    echo -n "Checking Domain DNS... "
    if nslookup fiyatiq.wxcodesign.com | grep -q "64.226.67.215"; then
        echo -e "${GREEN}✅ DNS configured correctly${NC}"
    else
        echo -e "${YELLOW}⚠️  DNS may not be pointing to correct IP${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Cannot resolve domain fiyatiq.wxcodesign.com${NC}"
fi

echo ""
echo "📊 System Resources:"

# Check disk usage
echo -n "Disk Usage: "
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    echo -e "${GREEN}✅ ${DISK_USAGE}%${NC}"
else
    echo -e "${RED}❌ ${DISK_USAGE}% (High usage)${NC}"
fi

# Check memory usage
echo -n "Memory Usage: "
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$MEMORY_USAGE" -lt 80 ]; then
    echo -e "${GREEN}✅ ${MEMORY_USAGE}%${NC}"
else
    echo -e "${RED}❌ ${MEMORY_USAGE}% (High usage)${NC}"
fi

# Check Docker disk usage
echo -n "Docker Disk Usage: "
DOCKER_USAGE=$(docker system df --format "table {{.Type}}\t{{.TotalCount}}\t{{.Size}}" | grep "Images" | awk '{print $3}' | sed 's/[^0-9]//g')
if [ "$DOCKER_USAGE" -lt 5000 ]; then
    echo -e "${GREEN}✅ ${DOCKER_USAGE}MB${NC}"
else
    echo -e "${YELLOW}⚠️  ${DOCKER_USAGE}MB (Consider cleanup)${NC}"
fi

echo ""
echo "🔧 Useful Commands:"
echo "  View logs: docker-compose logs -f"
echo "  Restart services: docker-compose restart"
echo "  Update application: git pull && docker-compose up -d --build"
echo "  Clean Docker: docker system prune -f"

echo ""
echo "✅ Health check completed!" 