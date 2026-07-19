import React from "react";

import { Outlet } from "react-router-dom";

function PublicLayout() {
  return (
    <div className="w-full h-screen">
      <Outlet />
    </div>
  );
}

export default PublicLayout;
