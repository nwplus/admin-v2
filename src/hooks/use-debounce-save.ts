import { useEffect, useRef, useState } from "react";

export const useDebouncedSave = <T>(
  value: T,
  saveFunction: (value: T) => Promise<void>,
  delay = 500,
) => {
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      if (value === "" || value) {
        setLoading(true);
        try {
          await saveFunction(value);
        } catch (error) {
          console.error("Save failed:", error);
        } finally {
          setLoading(false);
        }
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, saveFunction, delay]);

  return { loading };
};
