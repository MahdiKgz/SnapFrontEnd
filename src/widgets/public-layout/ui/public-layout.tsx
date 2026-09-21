import { Outlet } from "react-router-dom";

import { Footer } from "@widgets/footer";
import { Header } from "@widgets/header";

function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-background text-foreground">
      <Header />

      <main className="flex-1 w-full pt-16">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default PublicLayout;
