import type { OfficeEvent } from "@/types";

type Listener = (event: OfficeEvent) => void;

class OfficeEventEmitter {
  private listeners = new Map<string, Set<Listener>>();

  subscribe(organizationId: string, listener: Listener) {
    if (!this.listeners.has(organizationId)) {
      this.listeners.set(organizationId, new Set());
    }
    this.listeners.get(organizationId)!.add(listener);
    return () => {
      this.listeners.get(organizationId)?.delete(listener);
    };
  }

  emit(event: OfficeEvent) {
    const orgListeners = this.listeners.get(event.organizationId);
    if (orgListeners) {
      for (const listener of orgListeners) {
        listener(event);
      }
    }
  }
}

export const officeEventEmitter = new OfficeEventEmitter();
