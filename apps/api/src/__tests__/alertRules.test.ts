import { decideAlert } from "../engine/alertRules";

describe("Alert rules (hardening)", () => {
  const threshold = 3;

  it("creates DOWN only once when reaching threshold", () => {
    // prevFailures: 0 -> 1 (no alert)
    expect(
      decideAlert({ threshold, prev: { prevFailures: 0, prevStatus: "UP" }, current: { status: "DOWN" } })
    ).toBeNull();

    // 1 -> 2 (no alert)
    expect(
      decideAlert({ threshold, prev: { prevFailures: 1, prevStatus: "DOWN" }, current: { status: "DOWN" } })
    ).toBeNull();

    // 2 -> 3 (create DOWN)
    const down = decideAlert({
      threshold,
      prev: { prevFailures: 2, prevStatus: "DOWN" },
      current: { status: "DOWN" }
    });
    expect(down?.type).toBe("DOWN");

    // 3 -> 4 (should NOT create another DOWN)
    expect(
      decideAlert({ threshold, prev: { prevFailures: 3, prevStatus: "DOWN" }, current: { status: "DOWN" } })
    ).toBeNull();
  });

  it("does not create RECOVERY if threshold was not reached", () => {
    // was DOWN but only 1 failure -> now UP => no recovery
    expect(
      decideAlert({ threshold, prev: { prevFailures: 1, prevStatus: "DOWN" }, current: { status: "UP" } })
    ).toBeNull();
  });

  it("creates RECOVERY only after DOWN when threshold reached", () => {
    const rec = decideAlert({
      threshold,
      prev: { prevFailures: 3, prevStatus: "DOWN" },
      current: { status: "UP" }
    });
    expect(rec?.type).toBe("RECOVERY");
  });

  it("does not create RECOVERY if previously UP", () => {
    expect(
      decideAlert({ threshold, prev: { prevFailures: 0, prevStatus: "UP" }, current: { status: "UP" } })
    ).toBeNull();
  });
});
