import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "../globals.css";
import { cn } from "@/lib/utils";
import Navbar from "./__Components/Navbar";
import { ThemeProvider } from "@/components/ui/theme-provider";

const figtree = Figtree({
  
  subsets: ["latin"],

});

export const metadata: Metadata = {
  title: "RavityOS",
  description: "Your Autonomous AI assistant for the Job Application Helper",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        figtree.className
      )}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
        <ClerkProvider
          appearance={{
            theme: shadcn,
            elements: {
              button: "ravity-clerk-animated-button",
            },
            variables: {
              borderRadius: "0",
              fontFamily: "var(--font-fira-sans)",
            },
          }}
        >
          <Navbar />
          <div>
          {children}</div>
        </ClerkProvider></ThemeProvider>
      </body>
    </html>
  );
}