export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Implement proper authentication with NextAuth.js
  // For now, allow all access to test Azure PostgreSQL integration
  
  return (
    <div className="flex w-full flex-col px-4 lg:px-40 py-6">
      {children}
    </div>
  );
}
