import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Welcome to StudyFlow</h1>
          <p className="text-zinc-400">Sign in to sync your study progress</p>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
