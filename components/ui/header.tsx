import Link from "next/link";
import Image from "next/image";
import { SignInButton, Show, SignUpButton, UserButton } from "@clerk/nextjs";
import { checkUser } from "@/lib/checkUser";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Plus } from "lucide-react";

// Header navigation bar shown at the top of every page
const Header = async () => {
  // Sync the logged-in Clerk user with our database
  await checkUser();

  return (
    <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* App logo linking back to home */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="FinSensi Logo"
            width={200}
            height={60}
            className="h-10 w-auto object-contain"
            priority
          />
        </Link>

        {/* Navigation links & user controls */}
        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <SignInButton />
            <SignUpButton>
              <button className="bg-purple-700 hover:bg-purple-800 text-white rounded-full font-medium text-sm px-5 py-2 cursor-pointer transition">
                Sign Up
              </button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Button>
            </Link>

            <Link href="/transaction/create">
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Transaction</span>
              </Button>
            </Link>

            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9",
                },
              }}
            />
          </Show>
        </div>
      </nav>
    </header>
  );
};

export default Header;
