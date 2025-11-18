import { redirect } from "next/navigation";
import { Login } from "./components/Login";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  // TODO: Implement proper authentication with NextAuth.js
  // For now, just show login page
  return <Login />;
}
