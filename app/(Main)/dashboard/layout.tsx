
import { ClerkProvider, UserButton } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "../../globals.css";
import SideBar from "./__Componenets/SideBar";
import PlanOnlyDashboard from "./PlanOnlyDashboard";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ALL_PLAN_SLUGS, PLAN_SLUGS } from "@/app/data/plan-slugs";
import { Badge } from "@/components/ui/badge";
import ToggleTheme from "@/components/ui/ToggleTheme";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/toast"
const figtree = Figtree({
  
  subsets: ["latin"],

});

export const metadata: Metadata = {
	title: "Dashboard | RavityOS",
	description: "Your RavityOS Dashboard.",
};

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
	const {userId, has} = await auth()
	const hasDashboardPlan = ALL_PLAN_SLUGS.some((plan) => has({ plan }))
	const isPremium = has({ plan: PLAN_SLUGS.scale }) || has({ plan: PLAN_SLUGS.enterprise })
	if(!userId){
		redirect("/sign-in")
	}

	return (
		<html
			lang="en"
			className={`${figtree.className} h-full antialiased`}
		>
			<body className="min-h-full bg-background text-foreground">
				 <ThemeProvider
							attribute="class"
							defaultTheme="system"
							enableSystem
							disableTransitionOnChange
						  >
				<ClerkProvider
					appearance={{
						theme: shadcn,
						variables: {
							borderRadius: "0",
							fontFamily: "var(--font-fira-sans)",
						},
					}}
				>
					<div className="min-h-screen lg:grid lg:h-screen lg:grid-cols-[15rem_minmax(0,1fr)] lg:overflow-hidden">
						<SideBar isPremium={isPremium} hasPlan={hasDashboardPlan} />
						<div className="min-w-0 lg:flex lg:h-screen lg:min-h-0 lg:flex-col">
							<header className="flex h-16 items-center justify-around border-b border-border bg-background px-5 sm:px-8">
								<p className="text-sm text-muted-foreground">Workspace / Dashboard</p>
								<div className="flex gap-3 items-center">
									<ToggleTheme />
								<div className="flex flex-col items-center">
								<div className={`${isPremium ? 'ring-4 ring-chart-5 rounded-full flex' : ''}`}><UserButton /></div>{isPremium && <Badge className="bg-gradient-to-r from-chart-5 via-chart-2 to-chart-5 text-white rounded-full text-xs">PRO</Badge>}</div>
								</div>
							</header>
							<main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:min-h-0 lg:flex-1 lg:overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
								<Toaster />
								{hasDashboardPlan ? children : <PlanOnlyDashboard />}
							</main>
						</div>
					</div>
				</ClerkProvider></ThemeProvider>
			</body>
		</html>
	);
}
