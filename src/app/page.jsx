"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * `/`: sends signed-in users to their notes and everyone else to sign in.
 *
 * @returns {null}
 */
export default function HomePage() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/notes");
    if (status === "anonymous") router.replace("/login");
  }, [status, router]);

  return null;
}
