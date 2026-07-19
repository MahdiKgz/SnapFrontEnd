// src/layouts/AuthLayout.tsx
import React from "react";

import { Outlet } from "react-router-dom";

function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground antialiased selection:bg-primary/30">
      <Outlet />
    </div>
  );
}

export default AuthLayout;
