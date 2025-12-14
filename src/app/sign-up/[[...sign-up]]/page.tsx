import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">Join StudyFlow</h1>
          <p className="text-zinc-400">Create an account to start tracking your study progress</p>
        </div>
        <SignUp />
      </div>
    </div>
  );
}
