#!/bin/bash

# 🥐 Mystery Bake Bite - Unified Monorepo Start Scripts

# Colors for a premium terminal look
GOLD='\033[0;33m'
CHOCOLATE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${CHOCOLATE}----------------------------------------${NC}"
echo -e "${GOLD}   🥯 START MYSTERY BAKE BITE   ${NC}"
echo -e "${CHOCOLATE}----------------------------------------${NC}"

echo -e "Which app would you like to start?"
echo -e "${GOLD}1)${NC} Management System (Admin Dashboard)"
echo -e "${GOLD}2)${NC} Website App (Customer Facing)"
echo -e "${GOLD}3)${NC} Both"
echo -e "${CHOCOLATE}----------------------------------------${NC}"
read -p "Select option (1-3): " choice

case $choice in
  1)
    echo -e "\n${GOLD}🚀 Starting Management System...${NC}"
    npm run dev:admin
    ;;
  2)
    echo -e "\n${GOLD}🚀 Starting Website App...${NC}"
    npm run dev:web
    ;;
  3)
    echo -e "\n${GOLD}🚀 Starting BOTH applications...${NC}"
    npm run dev:admin & npm run dev:web & wait
    ;;
  *)
    echo -e "\n${CHOCOLATE}Invalid selection. Exiting.${NC}"
    exit 1
    ;;
esac
