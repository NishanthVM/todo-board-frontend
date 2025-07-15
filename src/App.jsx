import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
} from "react-router-dom";
import io from "socket.io-client";
import Board from "./components/Board";
import Login from "./components/Login";
import Register from "./components/Register";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace("/api", "")
  : "http://localhost:5000";

function AppContent() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [error, setError] = useState("");
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Initial token:", token);
    if (!token) {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        console.log("Restoring token from localStorage:", storedToken);
        setToken(storedToken);
      }
    }
  }, []);

  useEffect(() => {
    console.log("Attempting to connect to Socket.IO at:", SOCKET_URL);
    const socketInstance = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketInstance.on("connect", () => {
      console.log("Socket.IO connected:", socketInstance.id);
    });
    socketInstance.on("connect_error", (err) => {
      console.error("Socket.IO connect error:", err.message, err);
      setError(
        "Failed to connect to real-time updates. Please try again later."
      );
    });
    socketInstance.on("disconnect", (reason) => {
      console.log("Socket.IO disconnected:", reason);
    });
    setSocket(socketInstance);
    return () => {
      socketInstance.disconnect();
      console.log("Socket.IO disconnected on cleanup");
    };
  }, []);

  const handleLogout = () => {
    console.log("Logging out, clearing token");
    localStorage.removeItem("token");
    setToken(null);
    socket?.disconnect();
    navigate("/login");
  };

  return (
    <div className="container">
      {error && <div className="error">{error}</div>}
      {token ? (
        <nav className="nav">
          <Link to="/" className="nav-link">
            Task Board
          </Link>
          <button onClick={handleLogout} className="btn btn-red">
            Logout
          </button>
        </nav>
      ) : (
        <div className="error">No token found, please log in.</div>
      )}
      <Routes>
        <Route
          path="/"
          element={
            token ? (
              <Board token={token} socket={socket} setError={setError} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/login"
          element={<Login setToken={setToken} setError={setError} />}
        />
        <Route
          path="/register"
          element={<Register setToken={setToken} setError={setError} />}
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
