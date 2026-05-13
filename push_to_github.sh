#!/bin/bash

# 🥐 Mystery Bake Bite - GitHub Push Utility

# Colors for a premium terminal look
GOLD='\033[0;33m'
CHOCOLATE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${CHOCOLATE}----------------------------------------${NC}"
echo -e "${GOLD}   🥯 PUSHING TO MYSTERY BAKE BITE   ${NC}"
echo -e "${CHOCOLATE}----------------------------------------${NC}"

# Ask for the description (commit message)
echo -e "${GOLD}Enter your description (leave blank for default):${NC}"
read -p "> " description

# Set default if empty
if [ -z "$description" ]; then
  description="Chore: Update Mystery Bake Bite and synchronize codebase"
  echo -e "${CHOCOLATE}Using default: $description${NC}"
fi


echo -e "\n${CHOCOLATE}Step 1: Staging changes...${NC}"
git add .

echo -e "${CHOCOLATE}Step 2: Committing with description...${NC}"
git commit -m "$description"

echo -e "${CHOCOLATE}Step 3: Pushing to GitHub...${NC}"
git push origin main

echo -e "\n${GOLD}✨ Success! Your code is now live on GitHub.${NC}"
echo -e "${CHOCOLATE}----------------------------------------${NC}"
