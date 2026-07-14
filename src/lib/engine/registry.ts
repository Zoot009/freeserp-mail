import type { ActionHandler } from "./types";

// A simple type→handler registry. Adding a channel (SMS, Slack, webhook, push)
// later means writing one ActionHandler and calling register() — the engine loop
// and the enqueue/logging machinery never change.
const handlers = new Map<string, ActionHandler>();

export function register(handler: ActionHandler): void {
  handlers.set(handler.type, handler);
}

export function getHandler(type: string): ActionHandler | undefined {
  return handlers.get(type);
}

export function registeredTypes(): string[] {
  return [...handlers.keys()];
}
