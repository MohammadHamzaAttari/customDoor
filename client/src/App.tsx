// client/src/App.tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/sonner";
import { Route, Switch } from "wouter";
import DoorConfigurator from "./pages/DoorConfigurator";
import CheckoutPage from "./pages/CheckoutPage";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/checkout" component={CheckoutPage} />
        <Route path="/" component={DoorConfigurator} />
        {/* Fallback */}
        <Route component={DoorConfigurator} />
      </Switch>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}

export default App;