# /task-summary — Generate a minimal, structured summary of recent changes

Claude, execute the following steps **without modifying any project file**:

---

## 1. List changed files
Run:
```
git diff --name-only HEAD
```

---

## 2. Extract the full patch diff
Run:
```
git diff --minimal --patch HEAD
```

---

## 3. Produce a structured summary with:

### 🗂 Changed Files
- List of all modified files

### 🧩 Functions Added or Modified
- Extract from the diff the functions, components, hooks, services, or logic that were added or changed
- Ignore formatting-only changes

### 🧠 Summary of the Changes
- What was implemented
- How the updated code behaves
- What parts of the system it impacts (API, UI, DB, etc.)

### 📤 Handover Notes
- What the next agent or developer needs to know to continue

---

## 4. Save the summary to:
```
.claude/last_task_summary.md
```

---

## 5. Print confirmation:
```
Summary generated → .claude/last_task_summary.md
```

Do not modify any project file.
