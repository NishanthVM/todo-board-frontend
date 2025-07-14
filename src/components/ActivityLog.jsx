import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

const ActivityLog = ({ token, socket }) => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await axios.get(`${API_URL}/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(data);
    };
    fetchLogs();
    socket.on("logUpdate", (newLog) =>
      setLogs((prev) => [newLog, ...prev].slice(0, 20))
    );
    return () => socket.off("logUpdate");
  }, [token, socket]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-2">Activity Log</h2>
      <ul className="space-y-2 max-h-64 overflow-y-auto">
        {logs.map((log, index) => (
          <li key={index} className="text-sm text-gray-700">
            {log.user} {log.action} at{" "}
            {new Date(log.timestamp).toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActivityLog;
