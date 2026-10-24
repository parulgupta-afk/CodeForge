import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/404" component={NotFound} />
      <Route path="/" component={Home} />
      <Route path="/studio" component={Home} />
      <Route path="/arena" component={Home} />
      <Route path="/lab" component={Home} />
      <Route path="/replay" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router />
    </ErrorBoundary>
  );
}
