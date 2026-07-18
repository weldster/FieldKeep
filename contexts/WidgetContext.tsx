import * as React from "react";
import { createContext, useCallback, useContext } from "react";
import { reloadWidget } from "./widgetHelper";

type WidgetContextType = {
  refreshWidget: () => void;
};

const WidgetContext = createContext<WidgetContextType | null>(null);

export function WidgetProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    console.log("[WidgetContext] reloadWidget on mount");
    reloadWidget();
  }, []);

  const refreshWidget = useCallback(() => {
    console.log("[WidgetContext] refreshWidget called");
    reloadWidget();
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
