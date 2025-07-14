import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import io from "socket.io-client";
import Board from "./components/Board";
import ActivityLog from "./components/ActivityLog";
import Login from "./components/Login";
import Register from "./components/Register";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace("/api", "")
  : "http://localhost:5000";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [error, setError] = useState("");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketInstance = io(SOCKET_URL, { transports: ["websocket"] });
    console.log("Socket initialized in App:", socketInstance);
    setSocket(socketInstance);
    return () => socketInstance.disconnect();
  }, []);

  return (
    <Router>
      <div className="container mx-auto p-4">
        {error && <div className="text-red-500 mb-4">{error}</div>}
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
            path="/logs"
            element={
              token ? (
                <ActivityLog token={token} socket={socket} />
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
    </Router>
  );
}

export default App;
