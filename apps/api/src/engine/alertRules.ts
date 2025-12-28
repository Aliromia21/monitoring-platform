export type PrevState = {
  prevStatus: "UP" | "DOWN" | null;
  prevFailures: number;
};

export type CurrentResult = {
  status: "UP" | "DOWN";
};

export type AlertDecision =
  | { type: "DOWN"; message: string }
  | { type: "RECOVERY"; message: string }
  | null;

export function decideAlert(params: {
  threshold: number;
  prev: PrevState;
  current: CurrentResult;
}): AlertDecision {
  const { threshold, prev, current } = params;

  if (current.status === "DOWN") {
    // create DOWN only once when reaching threshold
    if (prev.prevFailures + 1 === threshold) {
      return { type: "DOWN", message: `Service unreachable for ${threshold} consecutive checks` };
    }
    return null;
  }

  // UP: create RECOVERY only if previously DOWN AND failures had reached threshold
  if (prev.prevStatus === "DOWN" && prev.prevFailures >= threshold) {
    return { type: "RECOVERY", message: "Service recovered" };
  }

  return null;
}
