import { useState, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";
import Board from "./components/Board";
import ActivityLog from "./components/ActivityLog";
import Login from "./components/Login";
import Register from "./components/Register";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const App = () => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize Socket.IO
    const socketInstance = io(import.meta.env.VITE_API_URL, {
      transports: ["websocket"],
    });
    console.log("Socket initialized in App:", socketInstance); // Debug
    setSocket(socketInstance);

    // Clean up socket on unmount
    return () => {
      socketInstance.disconnect();
      console.log("Socket disconnected");
    };
  }, []);

  useEffect(() => {
    console.log("Token:", token); // Debug
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  if (!token) {
    return isRegistering ? (
      <Register setToken={setToken} setIsRegistering={setIsRegistering} />
    ) : (
      <Login
        setToken={setToken}
        setIsRegistering={setIsRegistering}
        setError={setError}
        error={error}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Collaborative To-Do Board</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors duration-200"
        >
          Logout
        </button>
      </div>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      {socket ? (
        <>
          <Board token={token} socket={socket} setError={setError} />
          <ActivityLog token={token} socket={socket} />
        </>
      ) : (
        <p className="text-center text-gray-500">Connecting to server...</p>
      )}
    </div>
  );
};

export default App;
