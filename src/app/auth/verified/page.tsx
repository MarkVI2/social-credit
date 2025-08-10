"use client";

import Link from "next/link";

export default function VerifiedPage() {
  return (
    <div className="min-h-screen bg-[#F5F5DC] text-[#28282B] flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="border-4 border-[#28282B] bg-[#F5F5DC] p-6 sm:p-8 shadow-[8px_8px_0_0_#28282B] text-center">
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold uppercase text-[#C62828] tracking-wider">
            Email Verified, Komrade!
          </h1>
          <p className="font-mono text-sm sm:text-base mt-3">
            Your identity has been confirmed by the People&rsquo;s Committee.
          </p>
          <p className="font-mono text-sm sm:text-base mt-1 opacity-80">
            You may now proceed to the control panel of the credit collective.
          </p>

          <div className="mt-6">
            <Link
              href="/auth/login"
              className="inline-block bg-[#C62828] text-white py-3 px-5 rounded-none font-bold border-4 border-[#28282B] hover:opacity-90 btn-3d"
            >
              Proceed to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
