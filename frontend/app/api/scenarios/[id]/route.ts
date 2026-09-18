import { NextResponse } from "next/server";

import {
  loadScenario,
} from "@/data/scenarios";

import type {
  ScenarioId,
} from "@/data/scenarios";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const scenario =
      await loadScenario(
        id as ScenarioId
      );

    return NextResponse.json(
      scenario
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Scenario not found",
      },
      {
        status: 404,
      }
    );
  }
}
