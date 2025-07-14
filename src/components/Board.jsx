import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Board = ({ token, socket, setError }) => {
  const [tasks, setTasks] = useState({ Todo: [], "In Progress": [], Done: [] });
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "Medium",
  });
  const [editingTask, setEditingTask] = useState(null); // Track task being edited
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
  });

  // Emit task update to backend
  const emitTaskUpdate = () => {
    if (socket) {
      console.log("Emitting clientTaskUpdate"); // Debug
      socket.emit("clientTaskUpdate");
    } else {
      console.warn("Socket is undefined, cannot emit task update");
      setError("Cannot update tasks: Socket connection not established");
    }
  };

  useEffect(() => {
    console.log("Socket in Board:", socket); // Debug
    const fetchTasks = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Tasks fetched:", data); // Debug
        const formattedTasks = {
          Todo: data.Todo || [],
          "In Progress": data["In Progress"] || [],
          Done: data.Done || [],
        };
        setTasks(formattedTasks);
      } catch (err) {
        console.error("Fetch tasks error:", err);
        setError("Error fetching tasks");
      }
    };
    fetchTasks();

    if (socket) {
      socket.on("taskUpdate", (updatedTasks) => {
        console.log("Socket task update:", updatedTasks); // Debug
        const formattedTasks = {
          Todo: updatedTasks.Todo || [],
          "In Progress": updatedTasks["In Progress"] || [],
          Done: updatedTasks.Done || [],
        };
        setTasks(formattedTasks);
        setEditingTask(null); // Reset edit mode after update
      });
      return () => socket.off("taskUpdate");
    } else {
      console.warn("Socket is undefined, skipping taskUpdate listener");
    }
  }, [token, socket, setError]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_URL}/tasks`,
        { ...newTask, status: "Todo" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewTask({ title: "", description: "", priority: "Medium" });
      emitTaskUpdate();
    } catch (err) {
      setError(err.response?.data?.error || "Error adding task");
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task._id);
    setEditForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
    });
  };

  const handleUpdateTask = async (taskId, status) => {
    try {
      await axios.put(
        `${API_URL}/tasks/${taskId}`,
        { ...editForm, status, lastFetched: new Date().toISOString() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingTask(null);
      setEditForm({ title: "", description: "", priority: "Medium" });
      emitTaskUpdate();
    } catch (err) {
      if (err.response?.status === 409) {
        setError(
          "Conflict detected! Another user modified this task. Please refresh and try again."
        );
      } else {
        setError(err.response?.data?.error || "Error updating task");
      }
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`${API_URL}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      emitTaskUpdate();
    } catch (err) {
      setError(err.response?.data?.error || "Error deleting task");
    }
  };

  const handleSmartAssign = async (taskId) => {
    try {
      await axios.post(
        `${API_URL}/tasks/${taskId}/smart-assign`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      emitTaskUpdate();
    } catch (err) {
      setError("Error assigning task");
    }
  };

  return (
    <div className="mb-8">
      <form
        onSubmit={handleAddTask}
        className="flex flex-col md:flex-row gap-4 mb-4"
      >
        <input
          type="text"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          placeholder="Task Title"
          className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          value={newTask.description}
          onChange={(e) =>
            setNewTask({ ...newTask, description: e.target.value })
          }
          placeholder="Description"
          className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={newTask.priority}
          onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
          className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
        <button
          type="submit"
          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200"
        >
          Add Task
        </button>
      </form>
      {Object.keys(tasks).length === 0 ? (
        <p className="text-center text-gray-500">No tasks available</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(tasks).map(([columnId, taskList]) => (
            <div key={columnId} className="bg-white p-4 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-2">{columnId}</h2>
              {taskList.length > 0 ? (
                taskList.map((task) => (
                  <div
                    key={task._id}
                    className="p-2 mb-2 bg-gray-50 rounded shadow hover:shadow-md transition-transform duration-200 hover:scale-105"
                  >
                    {editingTask === task._id ? (
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) =>
                            setEditForm({ ...editForm, title: e.target.value })
                          }
                          placeholder="Task Title"
                          className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              description: e.target.value,
                            })
                          }
                          placeholder="Description"
                          className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                          value={editForm.priority}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              priority: e.target.value,
                            })
                          }
                          className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option>Low</option>
                          <option>Medium</option>
                          <option>High</option>
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleUpdateTask(task._id, task.status)
                            }
                            className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors duration-200"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingTask(null)}
                            className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors duration-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-medium">{task.title}</h3>
                        <p className="text-sm text-gray-600">
                          {task.description}
                        </p>
                        <p className="text-sm">Priority: {task.priority}</p>
                        <p className="text-sm">
                          Assigned: {task.assignedUser?.email || "Unassigned"}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleEditTask(task)}
                            className="text-blue-500 text-sm hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="text-red-500 text-sm hover:underline"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => handleSmartAssign(task._id)}
                            className="text-blue-500 text-sm hover:underline"
                          >
                            Smart Assign
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No tasks</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Board;
