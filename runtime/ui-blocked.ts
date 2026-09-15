import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent';

// Pi's UI lifecycle emits one outer span for blocking extension UI (including nested UI).
// Herdr's Pi integration v8 consumes herdr:blocked, but not those lifecycle events.
// Bridge through its existing counter/queue/session binding; do not duplicate its
// socket reporter, inspect prompt text, change UI decisions, or publish idle/working.
export function installUIBlockerBridge(pi: ExtensionAPI,
  enabled = process.env.HERDR_ENV === '1' && !!process.env.HERDR_PANE_ID && !!process.env.HERDR_SOCKET_PATH) {
  if (!enabled) return;
  let sessionId: string | undefined;
  let active = false;
  const matches = (ctx: ExtensionContext) => sessionId !== undefined && ctx.mode === 'tui' &&
    ctx.sessionManager.getSessionId() === sessionId;
  const release = () => {
    if (!active) return;
    active = false; // Only release the single counter contribution owned here.
    pi.events.emit('herdr:blocked', { active: false });
  };
  pi.on('session_start', (_event, ctx) => {
    release();
    sessionId = ctx.mode === 'tui' ? ctx.sessionManager.getSessionId() : undefined;
  });
  pi.on('ui_prompt_start', (event, ctx) => {
    if (!matches(ctx) || active) return;
    active = true;
    // Titles/input may be sensitive. Only the UI kind leaves this extension.
    pi.events.emit('herdr:blocked', { active: true, label: `Waiting for Pi UI (${event.kind})` });
  });
  pi.on('ui_prompt_end', (_event, ctx) => {
    if (matches(ctx)) release();
  });
  pi.on('session_shutdown', () => {
    sessionId = undefined;
    release();
  });
}
