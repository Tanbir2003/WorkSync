# Known Errors Log

## 1. Project Detail Page - 500 Internal Server Error (Missing Firestore Index)
**Date:** April 30, 2026
**Status:** Resolved

### Description
When an Admin clicks on a project card to view its details (and the tasks within it), the server returns a 500 error and the UI displays "Project not found".

### Root Cause
In `server/routes/projects.js`, the query to fetch tasks for a specific project uses both a `where` filter and an `orderBy` sort on different fields:
```javascript
const tasksSnapshot = await db
  .collection("tasks")
  .where("projectId", "==", req.params.id)
  .orderBy("createdAt", "desc")
  .get();
```
Firestore requires a **composite index** to be manually created in the Firebase Console for this specific combination. Without the index, the query fails and throws an error.

### Solution
To fix this without requiring manual index creation in the Firebase Console, we remove the `.orderBy()` from the database query and instead sort the results in memory using JavaScript:
```javascript
const tasksSnapshot = await db
  .collection("tasks")
  .where("projectId", "==", req.params.id)
  .get();

const tasks = tasksSnapshot.docs
  .map((doc) => ({ id: doc.id, ...doc.data() }))
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort in memory
```
A similar fix is applied to `server/routes/tasks.js` where the same pattern is used.
