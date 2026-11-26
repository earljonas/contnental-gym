import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  console.error("gym.request.failed", {
    route: context.routePath,
    type: context.routeType,
    method: request.method,
    digest: typeof error === "object" && error !== null && "digest" in error && typeof error.digest === "string"
      ? error.digest
      : undefined,
  });
};
