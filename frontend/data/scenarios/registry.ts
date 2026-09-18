import type { Scenario, ScenarioId } from "./types";

import {
  SCENARIO_ACCIDENTAL_TRANSFER,
} from "./accidental-transfer";

const scenarios: Record<ScenarioId, Scenario> = {
  SCENARIO_ACCIDENTAL_TRANSFER,
};

export function getScenario(
  id: ScenarioId
): Scenario {
  const scenario = scenarios[id];

  if (!scenario) {
    throw new Error(
      `Scenario "${id}" not found`
    );
  }

  return scenario;
}

export function getAvailableScenarios(): Scenario[] {
  return Object.values(scenarios);
}
