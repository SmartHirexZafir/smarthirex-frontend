// app/test/hooks/useNoBackAfterSubmit.ts
import { useEffect } from "react";

/**
 * Prevents navigating "back" after a test is submitted.
 *
 * How it works:
 * - Seeds the history stack with a dummy state.
 * - When the user hits Back (popstate), we immediately push forward again.
 * - Optionally shows a toast/message via a callback when a back attempt occurs.
 *
 * Limits:
 * - We cannot send users "back to email" (browsers don't expose that).
 * - Users can still close the tab/window (which is what we want).
 */
type Options = {
  /**
   * If true, the hook activates. Pass false to disable.
   * Default: true
   */
  enabled?: boolean;

  /**
   * Called when a back attempt is intercepted (for UX messaging).
   * Example: showToast("This page cannot be navigated back to. Please close this tab.")
   */
  onIntercept?: () => void;

  /**
   * Also intercept Backspace (outside of inputs/textareas).
   * Default: true
   */
  trapBackspace?: boolean;
};

export default function useNoBackAfterSubmit(options: Options = {}) {
  const { enabled = true, onIntercept, trapBackspace = true } = options;

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || typeof history === "undefined") {
      return;
    }

    // 1) Seed current state so that "Back" would try to leave — we’ll catch it.
    // Use a unique marker to avoid clobbering real app state.
    const STATE_MARK = "__NO_BACK_AFTER_SUBMIT__";
    try {
      const current = (history.state || {}) as Record<string, unknown>;
      if (current[STATE_MARK] !== true) {
        history.replaceState({ ...(current || {}), [STATE_MARK]: true }, "");
      }
      // Push a new state so Back pops to the marker instead of previous page.
      history.pushState({ [STATE_MARK]: true }, "");
    } catch {
      // If history API fails (very rare/locked down), we silently ignore.
    }

    // 2) Intercept back navigation attempts.
    const onPopState = (e: PopStateEvent) => {
      try {
        // Immediately move forward again, keeping the user on this page.
        history.go(1);
      } catch {
        // Fallback: re-push our state
        try {
          history.pushState({ [STATE_MARK]: true }, "");
        } catch {}
      }
      if (typeof onIntercept === "function") onIntercept();
    };

    window.addEventListener("popstate", onPopState);

    // 3) (Optional) Intercept Backspace-to-go-back (outside editable fields).
    const onKeyDown = (e: KeyboardEvent) => {
      if (!trapBackspace) return;
      const isBackspace = e.key === "Backspace" || e.keyCode === 8;
      if (!isBackspace) return;

      const target = e.target as HTMLElement | null;
      const isEditable =
        !!target &&
        (
          target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          (target as HTMLInputElement)?.type === "text" ||
          (target as HTMLInputElement)?.type === "search" ||
          (target as HTMLInputElement)?.type === "email" ||
          (target as HTMLInputElement)?.type === "url" ||
          (target as HTMLInputElement)?.type === "number" ||
          (target as HTMLInputElement)?.type === "password"
        );

      if (!isEditable) {
        e.preventDefault();
        if (typeof onIntercept === "function") onIntercept();
      }
    };

    if (trapBackspace) {
      window.addEventListener("keydown", onKeyDown, { capture: true });
    }

    // 4) Cleanup on unmount (restores default behavior for other pages).
    return () => {
      window.removeEventListener("popstate", onPopState);
      if (trapBackspace) {
        window.removeEventListener("keydown", onKeyDown, { capture: true } as any);
      }
    };
  }, [enabled, onIntercept, trapBackspace]);
}

/*
Usage example (in TestResult page/component):

import useNoBackAfterSubmit from "@/app/test/hooks/useNoBackAfterSubmit";

export default function TestResult() {
  useNoBackAfterSubmit({
    onIntercept: () => {
      // show a toast/snackbar:
      // toast.info("This page can't be navigated back to. Please close this tab.");
    }
  });

  return (
    <div>
      <h1>Thanks! Your responses were submitted.</h1>
      <p>You can now safely close this tab and return to your email.</p>
    </div>
  );
}
*/
