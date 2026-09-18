export * from "./types";

import { getScenario } from "./registry";

export {
  getScenario,
  getAvailableScenarios,
} from "./registry";

export async function loadScenario(
  id: import("./types").ScenarioId
) {
  return getScenario(id);
}
