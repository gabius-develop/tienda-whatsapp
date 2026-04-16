// Passthrough layout — auth is handled by middleware
// The (protected) route group applies the sidebar layout to protected pages
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
