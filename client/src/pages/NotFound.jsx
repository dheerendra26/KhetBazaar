import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh]">
      <h1 className="text-5xl font-bold">404</h1>
      <p className="mt-2 text-gray-600">Page not found.</p>

      <Link
        to="/"
        className="mt-6 bg-green-600 text-white px-4 py-2 rounded"
      >
        Go Home
      </Link>
    </div>
  );
};

export default NotFound;