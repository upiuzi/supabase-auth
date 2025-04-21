import { createBrowserRouter } from "react-router-dom";
import HomePage from "../pages/HomePage.tsx";
import SignInPage from "../pages/auth/SignInPage.tsx";
import SignUpPage from "../pages/auth/SignUpPage.tsx";
import ProtectedPage from "../pages/ProtectedPage.tsx";
import NotFoundPage from "../pages/404Page.tsx";
import AuthProtectedRoute from "./AuthProtectedRoute.tsx";
import Providers from "../Providers.tsx";
import CustomerPage from "../pages/CustomerPage.tsx";
import ProductsPage from "../pages/ProductPage.tsx";
import BatchPage from "../pages/BatchPage.tsx";
import OrderPage from "../pages/OrderPage.tsx";
import OrderBatchPage from "../pages/OrderBatchPage.tsx";
import DashboardPage from "../pages/DashboardPage.tsx";
import ShipmentPage from "../pages/ShipmentPage.tsx";
import ReportProduction from "../pages/ReportProduction.tsx";
import ReportSales from "../pages/ReportSales.tsx";
import ReportTopCustomer from "../pages/ReportTopCustomer.tsx";
import RequestSamplePage from "../pages/RequestSamplePage.tsx";
import PipelinePage from "../pages/PipelinePage.tsx";
import ExhibitionPage from "../pages/ExhibitionPage.tsx";
import AIAssistantPage from "../pages/AIAssistantPage.tsx";
import CompanyPage from "../pages/CompanyPage.tsx";
import BankAccountPage from "../pages/BankAccountPage.tsx";
import PaymentLogPage from "../pages/PaymentLogPage.tsx";
import BroadcastPage from "../pages/BroadcastPage.tsx";
import WhatsappSettingPage from "../pages/WhatsappSettingPage.tsx";
import HistoryCustomerPage from "../pages/HistoryCustomerPage";

const router = createBrowserRouter([
  // I recommend you reflect the routes here in the pages folder
  {
    path: "/",
    element: <Providers />,
    children: [
      // Public routes
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/auth/sign-in",
        element: <SignInPage />,
      },
      {
        path: "/auth/sign-up",
        element: <SignUpPage />,
      },
      // Auth Protected routes
      {
        path: "/",
        element: <AuthProtectedRoute />,
        children: [
          {
            path: "/dashboard",
            element: <DashboardPage />,
          },
          {
            path: "/broadcast",
            element: <BroadcastPage />,
          },
          {
            path: "/payments",
            element: <PaymentLogPage />,
          },
          {
            path: "/company",
            element: <CompanyPage />,
          },
          {
            path: "/bank",
            element: <BankAccountPage />,
          },
          {
            path: "/protected",
            element: <ProtectedPage />,
          },
          {
            path: "/customer",
            element: <CustomerPage />,
          },
          {
            path: "/product",
            element: <ProductsPage />,
          },
          {
            path: "/batches",
            element: <BatchPage />,
          },
          {
            path: "/order",
            element: <OrderPage />,
          },
          {
            path: "/orderbatch",
            element: <OrderBatchPage />,
          },
          {
            path: "/shipment",
            element: <ShipmentPage />,
          },
          {
            path: "/report-production",
            element: <ReportProduction />,
          },
          {
            path: "/report-sales",
            element: <ReportSales />,
          },
          {
            path: "/report-top-customer",
            element: <ReportTopCustomer />,
          },
          {
            path: "/sample",
            element: <RequestSamplePage />,
          },
          {
            path: "/prospect",
            element: <PipelinePage />,
          },
          {
            path: "/exhibition",
            element: <ExhibitionPage />,
          },
          {
            path: "/ai-assistant",
            element: <AIAssistantPage />,
          },
          {
            path: "/whatsapp-setting",
            element: <WhatsappSettingPage />,
          },
          {
            path: "/history-customer",
            element: <HistoryCustomerPage />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
