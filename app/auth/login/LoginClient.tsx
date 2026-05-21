"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAuthSession } from "@/lib/auth";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get("redirect") || "/";

  const [step, setStep] = useState<"credentials" | "otp">(
    "credentials"
  );

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [deliveryInfo, setDeliveryInfo] =
    useState("");

  const [emailForOtp, setEmailForOtp] =
    useState("");

  const [devOtp, setDevOtp] = useState("");

  const handleCredentialsSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");
    setDeliveryInfo("");

    const formData = new FormData(
      event.currentTarget
    );

    const email = String(
      formData.get("email") ?? ""
    );

    const password = String(
      formData.get("password") ?? ""
    );

    try {
      const response = await fetch(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const body = (await response.json()) as {
        message?: string;
        email?: string;
        devOtp?: string;
        emailSent?: boolean;
        emailReason?: string;
      };

      if (!response.ok) {
        throw new Error(
          body.message ||
            "Unable to sign in."
        );
      }

      setEmailForOtp(body.email || email);

      setDevOtp(body.devOtp || "");

      setSuccessMessage(
        body.message ||
          "OTP sent to your email."
      );

      if (
        !body.emailSent &&
        body.emailReason
      ) {
        setDeliveryInfo(body.emailReason);
      }

      setStep("otp");
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to sign in.";

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setIsSubmitting(true);
    setError("");

    const formData = new FormData(
      event.currentTarget
    );

    const otp = String(
      formData.get("otp") ?? ""
    );

    try {
      const response = await fetch(
        "/api/auth/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email: emailForOtp,
            otp,
          }),
        }
      );

      const body = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(
          body.message || "Invalid OTP."
        );
      }

      setAuthSession(emailForOtp);

      router.push(redirectTo);
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Invalid OTP.";

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Welcome back
        </p>

        <h1 className="mt-2 text-2xl font-bold">
          Sign in
        </h1>

        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {step === "credentials"
            ? "Use your email and password to continue."
            : "Enter the OTP sent to your email to complete login."}
        </p>
      </div>

      <form
        className="space-y-4"
        onSubmit={
          step === "credentials"
            ? handleCredentialsSubmit
            : handleOtpSubmit
        }
      >
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {successMessage && (
          <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {successMessage}
          </p>
        )}

        {step === "otp" && devOtp && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Dev OTP: {devOtp}
          </p>
        )}

        {step === "otp" &&
          deliveryInfo && (
            <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
              Email status: {deliveryInfo}
            </p>
          )}

        {step === "credentials" ? (
          <>
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium"
              >
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
                required
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium"
                >
                  Password
                </label>

                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                  Forgot password?
                </Link>
              </div>

              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
                required
              />
            </div>
          </>
        ) : (
          <div>
            <label
              htmlFor="otp"
              className="mb-1 block text-sm font-medium"
            >
              OTP
            </label>

            <input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              placeholder="Enter 6-digit OTP"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
              required
            />

            <p className="mt-2 text-xs text-zinc-500">
              OTP sent to: {emailForOtp}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isSubmitting
            ? step === "credentials"
              ? "Sending OTP..."
              : "Verifying OTP..."
            : step === "credentials"
              ? "Send OTP"
              : "Verify OTP"}
        </button>
      </form>

      {step === "credentials" ? (
        <p className="mt-5 text-center text-sm text-zinc-600 dark:text-zinc-400">
          New here?{" "}
          <Link
            href={`/auth/signup?redirect=${encodeURIComponent(
              redirectTo
            )}`}
            className="font-semibold hover:underline"
          >
            Create an account
          </Link>
        </p>
      ) : (
        <button
          type="button"
          onClick={() => {
            setStep("credentials");
            setError("");
            setSuccessMessage("");
            setDeliveryInfo("");
            setDevOtp("");
          }}
          className="mt-5 w-full text-sm font-semibold text-zinc-700 hover:underline dark:text-zinc-300"
        >
          Back to credentials
        </button>
      )}
    </main>
  );
}