import { redirect } from "next/navigation";

export default function Home() {
  // Root page redirects to login (or dashboard if authenticated — handled by middleware)
  redirect("/login");
}
