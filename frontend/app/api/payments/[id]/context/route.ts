import { NextResponse } from "next/server";

import { buildPaymentContext } from "@/lib/context";

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

    const paymentContext =
      await buildPaymentContext(id);

    return NextResponse.json(
      paymentContext
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to build payment context",
      },
      {
        status: 404,
      }
    );
  }
}
