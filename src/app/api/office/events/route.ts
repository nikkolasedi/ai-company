import { auth } from "@/lib/auth";
import { officeEventEmitter } from "@/lib/events/emitter";
import type { OfficeEvent } from "@/types";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const organizationId = session.user.organizationId;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: OfficeEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      const unsubscribe = officeEventEmitter.subscribe(organizationId, send);

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 15000);

      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "CONNECTED", organizationId, timestamp: new Date().toISOString() })}\n\n`
        )
      );

      const cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
      };

      req.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
