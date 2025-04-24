import { Link } from "react-router-dom";

const NotFoundPage: React.FC = () => {
  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-50">
      <section className="bg-white shadow-xl rounded-lg p-10 flex flex-col items-center">
        <h1 className="text-6xl font-extrabold text-blue-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Page Not Found</h2>
        <p className="text-gray-500 mb-6 text-center max-w-xs">
          Sorry, the page you are looking for does not exist or has been moved.
        </p>
        <Link
          to="/"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-semibold"
        >
          Go back to Home
        </Link>
      </section>
    </main>
  );
};

export default NotFoundPage;
