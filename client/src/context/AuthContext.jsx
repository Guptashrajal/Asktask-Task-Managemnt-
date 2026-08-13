import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token =
      localStorage.getItem("smarttask_token");

    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/auth/me")
      .then((response) => {
        setUser(response.data.user);
      })
      .catch((error) => {
        console.error(
          "AUTH ME ERROR:",
          error
        );

        localStorage.removeItem(
          "smarttask_token"
        );

        localStorage.removeItem("user");

        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (
    email,
    password
  ) => {
    const response = await api.post(
      "/auth/login",
      {
        email,
        password,
      }
    );

    const {
      token,
      user,
    } = response.data;

    localStorage.setItem(
      "smarttask_token",
      token
    );

    localStorage.setItem(
      "user",
      JSON.stringify(user)
    );

    setUser(user);

    return response.data;
  };

  const register = async (
    name,
    email,
    password
  ) => {
    const response = await api.post(
      "/auth/register",
      {
        name,
        email,
        password,
      }
    );

    const {
      token,
      user,
    } = response.data;

    localStorage.setItem(
      "smarttask_token",
      token
    );

    localStorage.setItem(
      "user",
      JSON.stringify(user)
    );

    setUser(user);

    return response.data;
  };

  const logout = () => {
    localStorage.removeItem(
      "smarttask_token"
    );

    localStorage.removeItem("user");

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}