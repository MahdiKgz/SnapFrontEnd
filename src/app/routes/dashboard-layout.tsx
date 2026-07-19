import { Outlet } from "react-router-dom";

export function DashboardLayout() {
  return (
    <div className="w-screen h-screen flex items-start bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div>sidebar</div>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
