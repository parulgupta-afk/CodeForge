import { useState } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import Intro from "./pages/Intro";
import NotFound from "./pages/NotFound";

const SEEN_KEY = "codeforge-intro-seen";

function hasSeenIntro() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

/** "/" shows the intro once per browser session, then the normal home screen. */
function Entry() {
  const [seen, setSeen] = useState(hasSeenIntro);
  if (seen) return <Home />;
  return (
    <Intro
      onEnter={() => {
        try {
          sessionStorage.setItem(SEEN_KEY, "1");
        } catch {
          /* private mode: just continue */
        }
        setSeen(true);
      }}
    />
  );
}

/** "/intro" always shows the intro (handy for demos), then goes to "/". */
function IntroRoute() {
  const [, navigate] = useLocation();
  return <Intro onEnter={() => navigate("/")} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/404" component={NotFound} />
      <Route path="/intro" component={IntroRoute} />
      <Route path="/" component={Entry} />
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
