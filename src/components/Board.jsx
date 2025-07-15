import { useState, useEffect } from "react";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function Board({ token, socket, setError }) {
  const [tasks, setTasks] = useState({ Todo: [], "In Progress": [], Done: [] });
  const [logs, setLogs] = useState([]);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "Medium",
  });
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    console.log("Socket in Board:", socket ? socket.id : "Not connected");
    if (socket) {
      socket.on("taskUpdate", (updatedTasks) => {
        console.log("Received taskUpdate:", updatedTasks);
        setTasks(updatedTasks);
      });
      socket.on("logUpdate", (log) => {
        console.log("Received logUpdate:", log);
        setLogs((prev) => [log, ...prev.slice(0, 49)]);
      });
      socket.on("connect_error", (err) => {
        console.error("Socket.IO connect error in Board:", err.message);
        setError("Failed to connect to real-time updates");
      });
      socket.on("reconnect", (attempt) => {
        console.log("Socket.IO reconnected after attempt:", attempt);
        fetchTasks();
        fetchLogs();
      });
      return () => {
        socket.off("taskUpdate");
        socket.off("logUpdate");
        socket.off("connect_error");
        socket.off("reconnect");
      };
    }
  }, [socket, setError]);

  useEffect(() => {
    console.log("Fetching tasks with token:", token);
    fetchTasks();
    fetchLogs();
  }, [token]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API_URL}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Tasks fetched successfully:", response.data);
      setTasks(response.data);
    } catch (err) {
      console.error("Fetch tasks error:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        headers: err.response?.headers,
      });
      setError(err.response?.data?.error || "Error fetching tasks");
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await axios.get(`${API_URL}/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Logs fetched successfully:", response.data);
      setLogs(response.data);
    } catch (err) {
      console.error("Fetch logs error:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setError(err.response?.data?.error || "Error fetching logs");
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/tasks`, newTask, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewTask({ title: "", description: "", priority: "Medium" });
      socket?.emit("clientTaskUpdate", {
        action: "add",
        timestamp: Date.now(),
      });
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
      socket?.emit("clientTaskUpdate", {
        action: "edit",
        taskId: id,
        timestamp: Date.now(),
      });
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
      socket?.emit("clientTaskUpdate", {
        action: "delete",
        taskId: id,
        timestamp: Date.now(),
      });
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
      socket?.emit("clientTaskUpdate", {
        action: "smartAssign",
        taskId: id,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error("Error smart assigning task:", err.message);
      setError(err.response?.data?.error || "Error smart assigning task");
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const sourceStatus = source.droppableId;
    const destStatus = destination.droppableId;
    const task = tasks[sourceStatus][source.index];

    try {
      await axios.put(
        `${API_URL}/tasks/${task._id}`,
        { status: destStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      socket?.emit("clientTaskUpdate", {
        action: "drag",
        taskId: task._id,
        from: sourceStatus,
        to: destStatus,
        timestamp: Date.now(),
      });
      console.log(
        `Task ${task._id} moved from ${sourceStatus} to ${destStatus}`
      );
    } catch (err) {
      console.error("Error updating task status:", err.message);
      setError(err.response?.data?.error || "Error updating task status");
    }
  };

  return (
    <div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid">
          {Object.keys(tasks).map((status) => (
            <Droppable droppableId={status} key={status}>
              {(provided) => (
                <div
                  className="card"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  <h2 className="title">{status}</h2>
                  {tasks[status].map((task, index) => (
                    <Draggable
                      key={task._id}
                      draggableId={task._id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`card-white ${
                            snapshot.isDragging ? "card-dragging" : ""
                          }`}
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
                                  setEditingTask({
                                    ...editingTask,
                                    title: e.target.value,
                                  })
                                }
                                className="input"
                                placeholder="Task title"
                                required
                              />
                              <textarea
                                value={editingTask.description}
                                onChange={(e) =>
                                  setEditingTask({
                                    ...editingTask,
                                    description: e.target.value,
                                  })
                                }
                                className="input"
                                placeholder="Description"
                              />
                              <button type="submit" className="btn btn-blue">
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingTask(null)}
                                className="btn btn-gray"
                              >
                                Cancel
                              </button>
                            </form>
                          ) : (
                            <>
                              <h3 className="subtitle">{task.title}</h3>
                              <p>{task.description || "No description"}</p>
                              <p>Priority: {task.priority}</p>
                              <p>
                                Assigned:{" "}
                                {task.assignedUser?.email || "Unassigned"}
                              </p>
                              <button
                                onClick={() =>
                                  setEditingTask({
                                    _id: task._id,
                                    title: task.title,
                                    description: task.description || "",
                                  })
                                }
                                className="btn btn-blue"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteTask(task._id)}
                                className="btn btn-red"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => smartAssign(task._id)}
                                className="btn btn-green"
                              >
                                Smart Assign
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
          <form onSubmit={addTask} className="form">
            <input
              type="text"
              value={newTask.title}
              onChange={(e) =>
                setNewTask({ ...newTask, title: e.target.value })
              }
              placeholder="Task title"
              className="input"
              required
            />
            <input
              type="text"
              value={newTask.description}
              onChange={(e) =>
                setNewTask({ ...newTask, description: e.target.value })
              }
              placeholder="Description"
              className="input"
            />
            <select
              value={newTask.priority}
              onChange={(e) =>
                setNewTask({ ...newTask, priority: e.target.value })
              }
              className="input"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <button type="submit" className="btn btn-blue">
              Add Task
            </button>
          </form>
        </div>
      </DragDropContext>
      <div className="card">
        <h2 className="title">Activity Log</h2>
        {logs.length === 0 ? (
          <p>No activity logs available.</p>
        ) : (
          logs.map((log) => (
            <div key={log._id} className="card-white">
              <p>
                {log.user} {log.action} at{" "}
                {new Date(log.timestamp).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Board;
