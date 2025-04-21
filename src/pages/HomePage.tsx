import { Link } from "react-router-dom";
// import supabase from "../supabase";
import { useSession } from "../context/SessionContext";
// import Navbar2 from "../components/Navbar2";
import DashboardPage from "./DashboardPage";

const HomePage = () => {
  const { session } = useSession();

  return (
    <main className="min-h-screen bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900">
      {session ? (
        <DashboardPage />
      ) : (
        <section className="flex items-center justify-center min-h-screen">
          <div className="bg-gray-800 dark:bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
            <h1 className="text-4xl font-bold text-blue-400 mb-4">Sat Coconut App</h1>
            <p className="text-gray-400 dark:text-gray-700 mb-6">
              Manage your orders efficiently with Sat Coconut
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                to="/auth/sign-in"
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/auth/sign-up"
                className="px-6 py-3 bg-gray-700 dark:bg-gray-200 text-white dark:text-gray-900 rounded-md hover:bg-gray-600 dark:hover:bg-gray-300 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

export default HomePage;