"use client";
import { Provider } from "react-redux";
import { useEffect, useState } from "react";
import store from "./store";

export default function ReduxProvider({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <Provider store={store}>{children}</Provider>;
}
