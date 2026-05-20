---
description: Changes to the current branch are synchronized with the remote repository.
---

# /sync-git - Git Synchronization

This workflow synchronizes your local changes with the remote GitHub repository.

## Usage

```bash
/sync-git
```

## Steps

1.  **Check Status:** Check the status of current changes.
2.  **Add Changes:** Add all changes to the staging area.
3.  **Commit:** Commit changes with a message provided by the user.
4.  **Push:** Push the commit to the remote repository.

## Workflow

```bash
# 1. Check status
git status

# 2. Add all changes
// turbo
git add .

# 3. Commit changes (Wait for user input for message)
# Interactive step - User must provide message
git commit -m "Update from Antigravity Agent" 

# 4. Push to remote
// turbo
git push
```

> **Note:** If `git push` fails due to conflicts, `git pull --rebase` may be required manually.
