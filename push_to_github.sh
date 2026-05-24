#!/bin/bash

# 🥐 Mystery Bake Bite - GitHub Push Utility

# Colors for a premium terminal look
GOLD='\033[0;33m'
CHOCOLATE='\033[0;34m'
NC='\033[0m' # No Colors

echo -e "${CHOCOLATE}----------------------------------------${NC}"
echo -e "${GOLD}   🥯 PUSHING MONOREPO TO GITHUB   ${NC}"
echo -e "${CHOCOLATE}----------------------------------------${NC}"

# Ask for the description (commit message)
echo -e "${GOLD}Enter your description (leave blank for default):${NC}"
read -p "> " description

# Set default if empty
if [ -z "$description" ]; then
  description="Chore: Update Mystery Bake Bite monorepo and synchronize workspaces"
  echo -e "${CHOCOLATE}Using default: $description${NC}"
fi


echo -e "\n${CHOCOLATE}Step 1: Staging all changes...${NC}"
git add .

echo -e "${CHOCOLATE}Step 2: Committing with description...${NC}"
git commit -m "$description"

echo -e "${CHOCOLATE}Step 3: Finding current branch...${NC}"
current_branch=$(git rev-parse --abbrev-ref HEAD)
echo -e "${GOLD}Current branch is: $current_branch${NC}"

echo -e "${CHOCOLATE}Step 4: Pushing to GitHub...${NC}"
git push origin "$current_branch"

# Step 5: Handle Pull Requests
if command -v gh &> /dev/null; then
  echo -e "\n${GOLD}Step 5: Checking for Pull Request...${NC}"
  pr_url=$(gh pr list --head "$current_branch" --json url --template '{{range .}}{{.url}}{{end}}')
  
  if [ -z "$pr_url" ]; then
    echo -e "${CHOCOLATE}No PR found. Creating one for you...${NC}"
    gh pr create --title "$description" --body "Refactored monorepo updates and synchronization." --base mystery-bake-bite-production --head "$current_branch"
  else
    echo -e "${GOLD}Existing PR found: $pr_url${NC}"
  fi
fi

echo -e "\n${GOLD}✨ Success! Your code is now live on GitHub.${NC}"
echo -e "${CHOCOLATE}🚀 Vercel will automatically pick this up and deploy the respective workspaces.${NC}"
echo -e "${CHOCOLATE}----------------------------------------${NC}"
