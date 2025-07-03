#!/bin/bash

# Git Collaborative Workflow Script
# Optimized for multiple developers working on the same branch
# Handles automatic rebasing, conflict resolution, and safe pushes

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BRANCH="dev"
REMOTE="origin"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository!"
        exit 1
    fi
}

# Function to check if we're on the correct branch
check_branch() {
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "$BRANCH" ]; then
        print_warning "Currently on branch '$current_branch', switching to '$BRANCH'"
        git checkout "$BRANCH"
    fi
}

# Function to safely stash uncommitted changes
safe_stash() {
    if ! git diff-index --quiet HEAD --; then
        print_status "Stashing uncommitted changes..."
        git stash push -u -m "Auto-stash before sync $(date +%Y%m%d_%H%M%S)"
        echo "stashed"
    else
        echo "clean"
    fi
}

# Function to restore stashed changes
restore_stash() {
    if [ "$1" = "stashed" ]; then
        print_status "Restoring stashed changes..."
        if git stash list | grep -q "Auto-stash before sync"; then
            git stash pop
            print_success "Stashed changes restored"
        fi
    fi
}

# Function to fetch latest changes
fetch_changes() {
    print_status "Fetching latest changes from $REMOTE/$BRANCH..."
    git fetch "$REMOTE" "$BRANCH"
}

# Function to check if we're ahead of remote
check_ahead_behind() {
    local ahead=$(git rev-list --count HEAD ^"$REMOTE"/"$BRANCH" 2>/dev/null || echo "0")
    local behind=$(git rev-list --count "$REMOTE"/"$BRANCH" ^HEAD 2>/dev/null || echo "0")
    echo "$ahead $behind"
}

# Function to perform rebase
perform_rebase() {
    print_status "Rebasing onto $REMOTE/$BRANCH..."
    if git rebase "$REMOTE"/"$BRANCH"; then
        print_success "Rebase completed successfully"
        return 0
    else
        print_error "Rebase conflicts detected!"
        print_status "Resolve conflicts manually, then run:"
        print_status "  git add <resolved-files>"
        print_status "  git rebase --continue"
        print_status "Or run: git rebase --abort to cancel"
        return 1
    fi
}

# Function to push changes safely
safe_push() {
    local ahead_behind=$(check_ahead_behind)
    local ahead=$(echo $ahead_behind | cut -d' ' -f1)
    local behind=$(echo $ahead_behind | cut -d' ' -f2)
    
    if [ "$behind" -gt 0 ]; then
        print_warning "Still behind remote by $behind commits. Run sync again."
        return 1
    fi
    
    if [ "$ahead" -gt 0 ]; then
        print_status "Pushing $ahead commits to $REMOTE/$BRANCH..."
        if git push "$REMOTE" "$BRANCH"; then
            print_success "Push completed successfully"
            return 0
        else
            print_error "Push failed! Remote may have new commits."
            print_status "Running fetch and trying again..."
            fetch_changes
            return 1
        fi
    else
        print_status "Already up to date with remote"
        return 0
    fi
}

# Function to commit staged changes
quick_commit() {
    if git diff --cached --quiet; then
        print_status "No staged changes to commit"
        return 0
    fi
    
    local message="$1"
    if [ -z "$message" ]; then
        message="WIP: auto-commit $(date +%Y-%m-%d_%H:%M:%S)"
    fi
    
    print_status "Committing staged changes..."
    git commit -m "$message"
    print_success "Changes committed: $message"
}

# Function to display help
show_help() {
    echo "Git Collaborative Workflow Script"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  sync              - Fetch, rebase, and push (full sync)"
    echo "  fetch             - Fetch latest changes only"
    echo "  rebase            - Rebase current branch onto remote"
    echo "  push              - Push local commits to remote"
    echo "  commit [message]  - Commit staged changes with optional message"
    echo "  quick-save        - Stage all, commit, and sync"
    echo "  status            - Show detailed git status"
    echo "  help              - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 sync                           # Full synchronization"
    echo "  $0 commit \"feat: add new feature\" # Commit with custom message"
    echo "  $0 quick-save                     # Stage all, commit, and sync"
}

# Function to show detailed status
show_status() {
    print_status "Git Status Report:"
    echo ""
    
    local current_branch=$(git branch --show-current)
    echo "Current branch: $current_branch"
    
    local ahead_behind=$(check_ahead_behind)
    local ahead=$(echo $ahead_behind | cut -d' ' -f1)
    local behind=$(echo $ahead_behind | cut -d' ' -f2)
    
    echo "Ahead of remote: $ahead commits"
    echo "Behind remote: $behind commits"
    
    echo ""
    git status --short
    
    echo ""
    if [ "$ahead" -gt 0 ]; then
        print_status "Unpushed commits:"
        git log --oneline "$REMOTE"/"$BRANCH"..HEAD 2>/dev/null || echo "No unpushed commits"
    fi
}

# Function for quick save workflow
quick_save() {
    print_status "Quick save workflow starting..."
    
    # Stage all changes
    git add -A
    
    # Commit with timestamp message
    local message="$1"
    if [ -z "$message" ]; then
        message="feat: quick save $(date +%Y-%m-%d_%H:%M:%S)"
    fi
    
    quick_commit "$message"
    
    # Full sync
    main_sync
}

# Main synchronization function
main_sync() {
    print_status "Starting collaborative sync workflow..."
    
    check_git_repo
    check_branch
    
    # Stash uncommitted changes
    local stash_status=$(safe_stash)
    
    # Fetch latest changes
    fetch_changes
    
    # Check if we need to rebase
    local ahead_behind=$(check_ahead_behind)
    local behind=$(echo $ahead_behind | cut -d' ' -f2)
    
    if [ "$behind" -gt 0 ]; then
        if ! perform_rebase; then
            # Rebase failed, restore stash and exit
            restore_stash "$stash_status"
            exit 1
        fi
    fi
    
    # Restore stashed changes
    restore_stash "$stash_status"
    
    # Try to push
    local max_retries=3
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        if safe_push; then
            break
        fi
        
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $max_retries ]; then
            print_status "Retrying push (attempt $((retry_count + 1))/$max_retries)..."
            
            # Stash again if needed
            stash_status=$(safe_stash)
            
            # Fetch and rebase again
            fetch_changes
            if ! perform_rebase; then
                restore_stash "$stash_status"
                exit 1
            fi
            
            # Restore stash
            restore_stash "$stash_status"
        else
            print_error "Failed to push after $max_retries attempts"
            exit 1
        fi
    done
    
    print_success "Collaborative sync completed successfully!"
}

# Main script logic
case "${1:-sync}" in
    "sync")
        main_sync
        ;;
    "fetch")
        check_git_repo
        check_branch
        fetch_changes
        ;;
    "rebase")
        check_git_repo
        check_branch
        fetch_changes
        perform_rebase
        ;;
    "push")
        check_git_repo
        check_branch
        safe_push
        ;;
    "commit")
        check_git_repo
        check_branch
        quick_commit "$2"
        ;;
    "quick-save")
        check_git_repo
        check_branch
        quick_save "$2"
        ;;
    "status")
        check_git_repo
        show_status
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac 