import { useEffect, useState } from "react";

export type Notice = { text: string; ok: boolean };

const DURATION = 2500;

// A short message saying how an action went. Each one is a new object, so
// a repeated message restarts its timer
export const useNotice = () => {
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(null), DURATION);
    return () => clearTimeout(timeout);
  }, [notice]);

  const notify = async (action: Promise<void>, done: string, failed: string) => {
    try {
      await action;
      setNotice({ text: done, ok: true });
    } catch (error) {
      // Closing the share sheet isn't an error
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error(error);
      setNotice({ text: failed, ok: false });
    }
  };

  return { notice, notify };
};
