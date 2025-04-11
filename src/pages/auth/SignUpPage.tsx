import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useSession } from "../../context/SessionContext";
import supabase from "../../supabase";

const SignUpPage = () => {
  // ==============================
  // If user is already logged in, redirect to home
  const { session } = useSession();
  if (session) return <Navigate to="/" />;
  // ==============================

  const [status, setStatus] = useState("");
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("Creating account...");
    const { error } = await supabase.auth.signUp({
      email: formValues.email,
      password: formValues.password,
    });
    if (error) {
      alert(error.message);
    }
    setStatus("");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-blue-400 text-center mb-2">
          OrderFlow
        </h1>
        <p className="text-gray-400 text-center mb-6">
          Manage your orders efficiently
        </p>
        <div className="flex justify-center space-x-4 mb-6">
          <Link
            to="/auth/sign-in"
            className="px-4 py-2 text-gray-400 hover:text-blue-400 rounded-md font-semibold"
          >
            Login
          </Link>
          <button className="px-4 py-2 bg-gray-700 text-white rounded-md font-semibold">
            Register
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <p className="text-gray-400 text-center text-sm mb-4">
            Demo app, please don't use your real email or password
          </p>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 12H8m4-4v8m-7 4h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </span>
              <input
                name="email"
                onChange={handleInputChange}
                type="email"
                placeholder="admin@mail.com"
                className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 11c0-1.1.9-2 2-2s2 .9 2 2-2 4-2 4m-4-4c0-1.1.9-2 2-2s2 .9 2 2m-6 4v-1a4 4 0 014-4h0a4 4 0 014 4v1m-8 0h8"
                  />
                </svg>
              </span>
              <input
                name="password"
                onChange={handleInputChange}
                type="password"
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Account
          </button>
        </form>
        {status && <p className="text-gray-400 text-center mt-4">{status}</p>}
        <p className="text-gray-400 text-center mt-4">
          Already have an account?{" "}
          <Link to="/auth/sign-in" className="text-blue-400 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </main>
  );
};

export default SignUpPage;