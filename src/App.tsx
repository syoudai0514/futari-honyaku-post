import { useState } from "react";
import { useAppStore } from "./store";
import Onboarding from "./screens/Onboarding";
import Home from "./screens/Home";
import Compose from "./screens/Compose";
import MessageDetail from "./screens/MessageDetail";
import SettingsScreen from "./screens/Settings";

export type View =
  | { name: "home" }
  | { name: "compose" }
  | { name: "detail"; id: string }
  | { name: "settings" };

export default function App() {
  const onboarded = useAppStore((s) => s.settings.onboarded);
  const [view, setView] = useState<View>({ name: "home" });

  if (!onboarded) return <Onboarding />;

  return (
    <div className="mx-auto min-h-dvh max-w-md">
      {view.name === "home" && <Home navigate={setView} />}
      {view.name === "compose" && <Compose navigate={setView} />}
      {view.name === "detail" && <MessageDetail id={view.id} navigate={setView} />}
      {view.name === "settings" && <SettingsScreen navigate={setView} />}
    </div>
  );
}
