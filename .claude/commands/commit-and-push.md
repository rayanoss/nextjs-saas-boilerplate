You will analyze the code changes, update README.md accordingly, generate a clean human-style commit message, and then perform a Git commit and push.

When I invoke this command using:

/commit-and-push

You MUST do the following exactly:

---

### 1. Analyze the diff

Compute the complete diff of all staged and unstaged changes:

   git diff --cached; git diff

From this diff, you must determine:

- What new functionality was added
- What logic was modified
- What subsystems or modules were affected
- The purpose of the change
- Any new files, functions, or architectural pieces added

Your analysis MUST be strictly based on the diff.

---

### 2. Generate a human commit message

Rules:

- MUST be a short, clean, professional commit message
- MUST NOT mention Claude, AI, automation, or agents
- MUST summarize what was done based ONLY on the diff
- Use the conventional commit style when appropriate (feat:, fix:, refactor:, chore:, docs:, etc.)

Example style:
- "feat(cache): add caching layer for user queries"
- "fix(auth): correct token validation logic"

---

### 3. Update README.md

You MUST update README.md based on the actual code changes.

Rules:

- If there is an existing section for the affected subsystem (e.g., “## Caching”, “## Authentication”), append to it.
- Otherwise, create a NEW section at the bottom of the file.

Section format:

## <Inferred subsystem or feature name>

### What was done
Clear explanation of the change.

### Details
A bullet list describing:
- new files added  
- new functions  
- important logic updates  
- architectural modifications  
- config changes  
- side effects or behaviors  

This section MUST be generated strictly from the diff, not assumptions.

Do NOT rewrite or modify unrelated parts of README.md.

---

### 4. Stage all modified files

   git add -A

---

### 5. Commit the changes

Use ONLY the commit message **you generated in step 2**:

   git commit -m "<generated-message>"

---

### 6. Push the commit

   git push

If push fails:
   git push --set-upstream origin $(git symbolic-ref --short HEAD)
   then push again.

---

### 7. Print exactly:
   "✔ Commit and push completed."

You must NOT add any explanation, disclaimers, or extra comments outside the README update.
