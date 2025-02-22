// src/components/storage-banner.tsx
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";

export const StorageBanner = () => {
  const { isSignedIn } = useAuth();
  
  if (isSignedIn) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
      <div className="container max-w-2xl mx-auto flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Your notes are stored locally. Sign in to access them from any device.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/sign-in">Sign In</Link>
        </Button>
      </div>
    </div>
  );
};