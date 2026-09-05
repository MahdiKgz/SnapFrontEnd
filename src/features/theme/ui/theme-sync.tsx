import { useEffect } from "react";

import { subscribeTheme } from "../model/theme-store";

export function ThemeSync() {
  // Keep receiving theme changes on routes without a visible toggle, such as login.
  useEffect(() => subscribeTheme(() => {}), []);
  return null;
}
