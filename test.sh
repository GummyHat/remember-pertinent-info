#!/bin/bash

# Test Script for Remember Pertinent Info Website
# This script starts both backend and frontend servers for testing

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}=========================================="
echo "Remember Pertinent Info - Test Launcher"
echo -e "==========================================${NC}\n"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down servers...${NC}"

    # Kill background processes
    if [ ! -z "$BACKEND_PID" ]; then
        echo -e "${YELLOW}Stopping backend server (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID 2>/dev/null || true
    fi

    if [ ! -z "$FRONTEND_PID" ]; then
        echo -e "${YELLOW}Stopping frontend server (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID 2>/dev/null || true
    fi

    echo -e "${GREEN}✓ Servers stopped${NC}"
    exit 0
}

# Set trap to cleanup on Ctrl+C or script exit
trap cleanup SIGINT SIGTERM EXIT

# Check if PostgreSQL is running
echo -e "${BLUE}Checking PostgreSQL...${NC}"
if ! systemctl is-active --quiet postgresql; then
    echo -e "${RED}✗ PostgreSQL is not running${NC}"
    echo -e "${YELLOW}Starting PostgreSQL...${NC}"
    sudo systemctl start postgresql
    sleep 2
fi
echo -e "${GREEN}✓ PostgreSQL is running${NC}\n"

# Check if database exists
echo -e "${BLUE}Checking database...${NC}"
PGPASSWORD=postgres psql -U postgres -h localhost -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw remember_pertinent_info
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Database doesn't exist. Creating it...${NC}"
    PGPASSWORD=postgres psql -U postgres -h localhost -c "CREATE DATABASE remember_pertinent_info;" 2>/dev/null || true

    # Apply schema
    if [ -f "$SCRIPT_DIR/server/resources_schema.sql" ]; then
        echo -e "${YELLOW}Applying database schema...${NC}"
        PGPASSWORD=postgres psql -U postgres -h localhost -d remember_pertinent_info -f "$SCRIPT_DIR/server/resources_schema.sql" 2>&1 | grep -v "already exists" || true
    fi
fi
echo -e "${GREEN}✓ Database ready${NC}\n"

# Check if node_modules exists
echo -e "${BLUE}Checking backend dependencies...${NC}"
if [ ! -d "$SCRIPT_DIR/server/node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd "$SCRIPT_DIR/server"
    npm install
    cd "$SCRIPT_DIR"
fi
echo -e "${GREEN}✓ Dependencies installed${NC}\n"

# Start backend server
echo -e "${BLUE}Starting backend server...${NC}"
cd "$SCRIPT_DIR/server"
npm run dev > /tmp/rpi-backend.log 2>&1 &
BACKEND_PID=$!
cd "$SCRIPT_DIR"

# Wait for backend to start
echo -e "${YELLOW}Waiting for backend to initialize...${NC}"
sleep 3

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}✗ Backend failed to start. Check logs:${NC}"
    tail -20 /tmp/rpi-backend.log
    exit 1
fi

# Test backend health
HEALTH_CHECK=$(curl -s http://localhost:3001/api/health 2>/dev/null || echo "failed")
if [[ $HEALTH_CHECK == *"ok"* ]]; then
    echo -e "${GREEN}✓ Backend server running on http://localhost:3001${NC}\n"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
    tail -20 /tmp/rpi-backend.log
    exit 1
fi

# Start frontend server
echo -e "${BLUE}Starting frontend server...${NC}"
cd "$SCRIPT_DIR/client/public"
python3 -m http.server 8000 > /tmp/rpi-frontend.log 2>&1 &
FRONTEND_PID=$!
cd "$SCRIPT_DIR"

# Wait for frontend to start
sleep 2

# Check if frontend is running
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${RED}✗ Frontend failed to start${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Frontend server running on http://localhost:8000${NC}\n"

# Success message
echo -e "${GREEN}=========================================="
echo "✓ All Systems Running!"
echo -e "==========================================${NC}\n"

echo -e "${BLUE}Access the application:${NC}"
echo -e "  ${GREEN}➜${NC} Frontend: ${YELLOW}http://localhost:8000${NC}"
echo -e "  ${GREEN}➜${NC} Backend API: ${YELLOW}http://localhost:3001/api/health${NC}\n"

echo -e "${BLUE}Test Checklist:${NC}"
echo -e "  ${GREEN}1.${NC} Open http://localhost:8000 in your browser"
echo -e "  ${GREEN}2.${NC} Press F12 to open Developer Tools (Console tab)"
echo -e "  ${GREEN}3.${NC} Search for a course (e.g., 'CSCI-1200')"
echo -e "  ${GREEN}4.${NC} Click on a course to open details modal"
echo -e "  ${GREEN}5.${NC} Scroll down to 'Course Resources' section"
echo -e "  ${GREEN}6.${NC} Click 'Upload New Resource'"
echo -e "  ${GREEN}7.${NC} Fill form and upload a file"
echo -e "  ${GREEN}8.${NC} Test download and delete buttons\n"

echo -e "${BLUE}Logs:${NC}"
echo -e "  Backend:  tail -f /tmp/rpi-backend.log"
echo -e "  Frontend: tail -f /tmp/rpi-frontend.log\n"

echo -e "${YELLOW}Press Ctrl+C to stop both servers and exit${NC}\n"

# Keep script running and show backend logs
tail -f /tmp/rpi-backend.log
