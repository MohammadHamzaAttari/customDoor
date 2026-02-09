import React, { Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/sonner";
import { Route, Switch } from "wouter";

// ⚡ Lazy load pages - these won't be in the initial bundle
const DoorConfigurator = React.lazy(() => import("./pages/DoorConfigurator"));
const CheckoutPage = React.lazy(() => import("./pages/CheckoutPage"));

// Lightweight loading fallback (NOT the heavy UI components)
function PageLoader() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#f8fafc",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: "3px solid #e2e8f0",
          borderTopColor: "#3b82f6",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p style={{ color: "#64748b", fontSize: 14, fontWeight: 500 }}>
        Loading designer...
      </p>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/checkout" component={CheckoutPage} />
          <Route path="/" component={DoorConfigurator} />
          <Route component={DoorConfigurator} />
        </Switch>
      </Suspense>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

export default App;