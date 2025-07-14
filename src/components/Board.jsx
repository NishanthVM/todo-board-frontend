import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function Board({ token, socket, setError }) {
  const [tasks, setTasks] = useState({ Todo: [], "In Progress": [], Done: [] });
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "Medium",
  });
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    console.log("Socket in Board:", socket);
    if (socket) {
      socket.on("taskUpdate", (updatedTasks) => {
        console.log("Socket task update:", updatedTasks);
        setTasks(updatedTasks);
      });
      socket.on("connect_error", (err) => {
        console.error("Socket.IO connect error:", err.message);
        setError("Failed to connect to real-time updates");
      });
      return () => {
        socket.off("taskUpdate");
        socket.off("connect_error");
      };
    }
  }, [socket, setError]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API_URL}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Tasks fetched:", response.data);
      setTasks(response.data);
    } catch (err) {
      console.error("Error fetching tasks:", err.message);
      setError(err.response?.data?.error || "Error fetching tasks");
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/tasks`, newTask, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewTask({ title: "", description: "", priority: "Medium" });
      socket?.emit("clientTaskUpdate");
    } catch (err) {
      console.error("Error adding task:", err.message);
      setError(err.response?.data?.error || "Error adding task");
    }
  };

  const editTask = async (id, updates) => {
    try {
      await axios.put(`${API_URL}/tasks/${id}`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      socket?.emit("clientTaskUpdate");
      setEditingTask(null);
    } catch (err) {
      console.error("Error updating task:", err.message);
      setError(err.response?.data?.error || "Error updating task");
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`${API_URL}/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      socket?.emit("clientTaskUpdate");
    } catch (err) {
      console.error("Error deleting task:", err.message);
      setError(err.response?.data?.error || "Error deleting task");
    }
  };

  const smartAssign = async (id) => {
    try {
      await axios.post(
        `${API_URL}/tasks/${id}/smart-assign`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      socket?.emit("clientTaskUpdate");
    } catch (err) {
      console.error("Error smart assigning task:", err.message);
      setError(err.response?.data?.error || "Error smart assigning task");
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {Object.keys(tasks).map((status) => (
        <div key={status} className="p-4 bg-gray-100 rounded">
          <h2 className="text-xl font-bold mb-4">{status}</h2>
          {tasks[status].map((task) => (
            <div
              key={task._id}
              className="p-4 mb-2 bg-white rounded shadow hover:scale-105 transition-transform"
            >
              {editingTask?._id === task._id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    editTask(task._id, editingTask);
                  }}
                >
                  <input
                    type="text"
                    value={editingTask.title}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, title: e.target.value })
                    }
                    className="border p-2 mb-2 w-full"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTask(null)}
                    className="bg-gray-500 text-white p-2 rounded ml-2 hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <h3 className="font-bold">{task.title}</h3>
                  <p>{task.description}</p>
                  <p>Priority: {task.priority}</p>
                  <p>Assigned: {task.assignedUser?.email || "Unassigned"}</p>
                  <button
                    onClick={() => setEditingTask(task)}
                    className="bg-blue-500 text-white p-2 rounded mr-2 hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteTask(task._id)}
                    className="bg-red-500 text-white p-2 rounded mr-2 hover:bg-red-600"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => smartAssign(task._id)}
                    className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
                  >
                    Smart Assign
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      ))}
      <form onSubmit={addTask} className="col-span-3 p-4 bg-gray-100 rounded">
        <input
          type="text"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          placeholder="Task title"
          className="border p-2 mr-2"
          required
        />
        <input
          type="text"
          value={newTask.description}
          onChange={(e) =>
            setNewTask({ ...newTask, description: e.target.value })
          }
          placeholder="Description"
          className="border p-2 mr-2"
        />
        <select
          value={newTask.priority}
          onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
          className="border p-2 mr-2"
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Add Task
        </button>
      </form>
    </div>
  );
}

export default Board;
