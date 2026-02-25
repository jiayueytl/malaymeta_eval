"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface NavbarProps {
  username: string;
}

export default function Navbar({ username }: NavbarProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-[#2e2e38]">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/tasks" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 bg-indigo-500 rounded-md flex items-center justify-center group-hover:bg-indigo-400 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1.5 3.5h11M1.5 7h7M1.5 10.5h9" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontFamily: "var(--font-display)" }} className="font-semibold text-sm text-white tracking-tight">
            MalayMeta
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#18181c] border border-[#2e2e38] rounded-full px-3 py-1.5">
            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
              {username.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-[#9898a8]" style={{ fontFamily: "var(--font-mono)" }}>
              {username}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-[#5c5c72] hover:text-[#f4f4f6] transition-colors px-2 py-1 rounded"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
