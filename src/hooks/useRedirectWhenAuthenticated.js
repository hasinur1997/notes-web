"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * Sends signed-in users away from guest-only pages such as register and login.
 * UX only: the API, not this redirect, decides what a user may do.
 *
 * @param {string} [destination="/notes"] - Where to send a signed-in user.
 * @returns {void}
 */
export function useRedirectWhenAuthenticated(destination = "/notes") {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace(destination);
  }, [status, router, destination]);
}
