import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function Register({ setToken, setError }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
      });
      const { token } = response.data;
      localStorage.setItem("token", token);
      setToken(token);
      navigate("/");
    } catch (err) {
      console.error("Error registering:", err.message);
      setError(err.response?.data?.error || "Error registering");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-gray-100 rounded">
      <h2 className="text-xl font-bold mb-4">Register</h2>
      <form onSubmit={handleRegister}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="border p-2 mb-2 w-full"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="border p-2 mb-2 w-full"
          required
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Register
        </button>
      </form>
    </div>
  );
}

export default Register;
