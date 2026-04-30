# WorkSync (Team Task Manager) 🚀

A full-stack Team Task Manager application built to streamline project management and collaboration. It allows teams to create projects, assign tasks, and monitor progress effectively with a dynamic and responsive user interface.

## 🌍 Live Links

- **Frontend (Vercel):** [https://work-sync-tau.vercel.app/](https://work-sync-tau.vercel.app/)
- **Backend (Railway):** [https://worksyncserver-production.up.railway.app](https://worksyncserver-production.up.railway.app)

---

## 🔐 Demo Credentials

To test the application, you can log in with the following demo accounts:

### Admin Account (Project Manager)
- **Email:** `test1@gmail.com` 
- **Password:** `123456` *

### Member Account (Team Member)
- **Email:** `member1@gmail.com` 
- **Password:** `123456` 

> **Note:** The above credentials are for demonstration purposes. Users can also sign up to create their own workspaces.

---

## 🛠️ Technology Stack

**Frontend:**
- React 19
- Vite
- TailwindCSS (if configured) / Vanilla CSS
- Firebase Authentication

**Backend:**
- Node.js & Express
- Firebase Admin SDK (Firestore Database)

---

## 💻 Getting Started (Local Development)

Follow these instructions to set up the project locally.

### Prerequisites
- Node.js (v18 or higher)
- A Firebase Project (with Firestore and Authentication enabled)

### 1. Clone the repository
```bash
git clone https://github.com/Tanbir2003/WorkSync.git
cd newProject
```

### 2. Setup the Backend
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Add your Firebase `serviceAccountKey.json` inside the `server` directory.
4. Start the server:
   ```bash
   npm run dev
   ```
   *The server will run on http://localhost:5000*

### 3. Setup the Frontend
1. Open a new terminal and navigate to the client folder:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `client` directory and add your Firebase config and backend URL:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   # Add any other required Firebase env vars here
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

## 🚀 Deployment Guides

### Frontend (Vercel)
1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Set the Framework Preset to **Vite** and the Root Directory to `client/`.
4. Add all environment variables (`VITE_API_BASE_URL` pointing to your deployed backend, and Firebase variables).
5. Deploy.

### Backend (Railway)
1. Connect your backend GitHub repository to Railway.
2. Ensure the Root Directory is set to `/server` if deploying from a monorepo, or leave as default if it's an isolated backend repo.
3. Add `FIREBASE_SERVICE_ACCOUNT` to your environment variables and paste the entire JSON string from your `serviceAccountKey.json`.
4. Deploy and grab the public URL.

---

## 📄 License
This project is licensed under the MIT License.
