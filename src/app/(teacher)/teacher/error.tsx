"use client";

import { ErrorView } from "@/components/common/error-view";

export default function Error(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorView {...props} homeHref="/teacher" />;
}
