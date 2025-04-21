// import { Link } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import Navbar2 from "../components/Navbar2";

const ProtectedPage = () => {
  const { session } = useSession();
  return (
    <main className="min-h-screen bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900">
      <Navbar2/>
     
      <section className="main-container">
        <h1 className="header-text">This is a Protected Page</h1>
        <p>Current User : {session?.user.email || "None"}</p>
      </section>
    </main>
  );
};

export default ProtectedPage;
