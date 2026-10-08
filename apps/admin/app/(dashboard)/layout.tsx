import { AppSidebar } from "@/components/layout/app-sidebar"
import { AdminDashboardGuard } from "@/components/admin-dashboard-guard"
import {Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@repo/ui/breadcrumb"
import { Separator } from "@repo/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@repo/ui/sidebar"

export default function DashboardLayout({children}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminDashboardGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 border-gray-300">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4"/>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Build Your Application</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </AdminDashboardGuard>
  );
}
