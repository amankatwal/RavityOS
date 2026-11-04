import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-50 px-6 py-12 dark:bg-black">
      <div className="text-center font-bold text-lg">
        <span className="text-muted-foreground">Ravity</span><span className="text-primary">OS</span>
        <h1 className="font-heading mt-3 text-3xl font-semibold tracking-tight">
          Create your account
        </h1>
      </div>
      <SignUp
        forceRedirectUrl="/auth-redirect"
        appearance={{
          elements: {
            button: "ravity-clerk-animated-button",
          },
          variables: {
            borderRadius: "0",
            fontFamily: "var(--font-heading)",
          },
        }}
      />
    </div>
  );
}
