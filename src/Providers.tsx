import { Outlet } from "react-router-dom";
import { SessionProvider } from "./context/SessionContext";
import AIChatWidget from "./components/AIChatWidget";

const Providers = () => {
  return (
    <SessionProvider>
      <Outlet />
      <AIChatWidget />
    </SessionProvider>
  );
};

export default Providers;
