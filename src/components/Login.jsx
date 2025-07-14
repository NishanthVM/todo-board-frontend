import { useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

const Login = ({ setToken, setIsRegistering, setError, error }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      setToken(data.token);
      localStorage.setItem("token", data.token);
      setError("");
    } catch (err) {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="p-6 bg-white rounded-lg shadow-lg w-full max-w-md transform transition-all duration-300 hover:shadow-xl"
      >
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Login</h2>
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        <div className="mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            required
          />
        </div>
        <div className="mb-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200"
        >
          Login
        </button>
        <p className="mt-4 text-center text-sm text-gray-600">
          Need an account?{" "}
          <button
            type="button"
            onClick={() => setIsRegistering(true)}
            className="text-blue-500 hover:underline focus:outline-none"
          >
            Register
          </button>
        </p>
      </form>
    </div>
  );
};

export default Login;
