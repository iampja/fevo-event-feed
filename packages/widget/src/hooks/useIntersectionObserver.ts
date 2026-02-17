import { useEffect, useRef } from 'preact/hooks';

type IntersectionCallback = (isIntersecting: boolean) => void;

/**
 * Custom hook to observe when an element enters or leaves the viewport.
 * Used for tracking offer_card_viewed analytics.
 *
 * @param callback - Called with `true` when element enters viewport, `false` when it leaves.
 * @param options - IntersectionObserver options (threshold, rootMargin, etc.).
 * @returns A ref to attach to the target element.
 */
export function useIntersectionObserver<T extends HTMLElement = HTMLElement>(
  callback: IntersectionCallback,
  options?: IntersectionObserverInit,
) {
  const elementRef = useRef<T | null>(null);
  const callbackRef = useRef<IntersectionCallback>(callback);

  // Keep callback ref up-to-date without re-creating observer
  callbackRef.current = callback;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Fallback if IntersectionObserver is not supported
    if (typeof IntersectionObserver === 'undefined') {
      callbackRef.current(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          callbackRef.current(entry.isIntersecting);
        }
      },
      {
        threshold: 0.5,
        ...options,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return elementRef;
}
