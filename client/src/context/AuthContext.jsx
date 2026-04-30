import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../services/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { createUserProfile } from "../services/api";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  async function signup(email, password, name) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const idToken = await cred.user.getIdToken();
    const profile = await createUserProfile(cred.user.uid, name, email);
    setToken(idToken);
    setUserProfile(profile.user);
    return cred;
  }

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await cred.user.getIdToken();
    setToken(idToken);
    return cred;
  }

  function logout() {
    setUserProfile(null);
    setToken(null);
    return signOut(auth);
  }

  async function refreshToken() {
    if (auth.currentUser) {
      const idToken = await auth.currentUser.getIdToken(true);
      setToken(idToken);
      return idToken;
    }
    return null;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const idToken = await user.getIdToken();
          setToken(idToken);
          // Fetch user profile from our backend
          const res = await fetch("http://localhost:5000/api/users", {
            headers: { Authorization: `Bearer ${idToken}` },
          });
          if (res.ok) {
            const users = await res.json();
            const profile = users.find((u) => u.uid === user.uid);
            setUserProfile(profile || null);
          }
        } catch (err) {
          console.error("Failed to load profile:", err);
        }
      } else {
        setUserProfile(null);
        setToken(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    token,
    loading,
    signup,
    login,
    logout,
    refreshToken,
    isAdmin: userProfile?.role === "ADMIN",
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
