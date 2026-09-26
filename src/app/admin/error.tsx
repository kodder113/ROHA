"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="space-y-4">
      <Alert tone="error" title="This administration page could not be loaded">
        <p>{error.message || "An unexpected error occurred."}</p>
        {error.digest ? <p className="mt-1 font-mono text-xs">Reference: {error.digest}</p> : null}
      </Alert>
      <Button variant="outline" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
