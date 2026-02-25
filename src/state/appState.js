// src/state/appState.js
import React, { createContext, useContext, useMemo, useState } from "react";

const Ctx = createContext(null);

export function AppStateProvider({ children }) {
  const [profileCompleteTick, setProfileCompleteTick] = useState(0);

  const value = useMemo(
    () => ({
      profileCompleteTick,
      notifyProfileComplete: () => setProfileCompleteTick((x) => x + 1),
    }),
    [profileCompleteTick]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppState must be used inside AppStateProvider");
  return v;
}
