import * as React from "react";
import { createContext, useCallback, useContext } from "react";
import { Platform } from "react-native";
import { ExtensionStorage } from "@bacons/apple-targets";

// Only instantiate on iOS — ExtensionStorage is a native-only API
const storage =
  Platform.OS === "ios"
    ? new ExtensionStorage("group.com.<user_name>.<app_name>")
    : null;

type WidgetContextType = {
  refreshWidget: () => void;
};

const WidgetContext = createContext<WidgetContextType | null>(null);

export function WidgetProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    if (Platform.OS !== "ios") return;
    console.log("[WidgetContext] reloadWidget on mount");
    // set widget_state to null if we want to reset the widget
    // storage?.set("widget_state", null);
    ExtensionStorage.reloadWidget();
  }, []);

  const refreshWidget = useCallback(() => {
    if (Platform.OS !== "ios") {
      console.log("[WidgetContext] refreshWidget skipped (non-iOS)");
      return;
    }
    console.log("[WidgetContext] refreshWidget called");
    ExtensionStorage.reloadWidget();
  }, []);

  return (
    <WidgetContext.Provider value={{ refreshWidget }}>
      {children}
    </WidgetContext.Provider>
  );
}

export const useWidget = () => {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error("useWidget must be used within a WidgetProvider");
  }
  return context;
};
