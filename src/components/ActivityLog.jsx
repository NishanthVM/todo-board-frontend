import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function ActivityLog({ token, socket }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (socket) {
      socket.on("logUpdate", (log) => {
        console.log("Socket log update:", log);
        setLogs((prev) => [log, ...prev]);
      });
      socket.on("connect_error", (err) => {
        console.error("Socket.IO connect error:", err.message);
      });
      return () => {
        socket.off("logUpdate");
        socket.off("connect_error");
      };
    }
  }, [socket]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await axios.get(`${API_URL}/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Logs fetched:", response.data);
      setLogs(response.data);
    } catch (err) {
      console.error("Error fetching logs:", err.message);
    }
  };

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h2 className="text-xl font-bold mb-4">Activity Log</h2>
      {logs.map((log) => (
        <div
          key={log._id}
          className="p-2 mb-2 bg-white rounded shadow hover:scale-105 transition-transform"
        >
          <p>
            {log.user} {log.action} at{" "}
            {new Date(log.timestamp).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}

export default ActivityLog;
