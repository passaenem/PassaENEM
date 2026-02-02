"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLandingPage = pathname === "/" || pathname === "/login" || pathname === "/termos" || pathname === "/privacidade";

    if (isLandingPage) {
        return <main className="min-h-screen w-full">{children}</main>;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden w-full">
                <div className="md:hidden">
                    <MobileNav />
                </div>
                <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full max-w-7xl mx-auto custom-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    );
}
