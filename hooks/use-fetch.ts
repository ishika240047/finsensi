import { useState } from "react";
import { toast } from "sonner";

// Custom hook to run server actions with loading and error states
const useFetch = <T, P extends any[]>(cb: (...args: P) => Promise<T>) => {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Executes the callback function and manages loading / errors
  const fn = async (...args: P) => {
    setLoading(true);
    setError(null);

    try {
      const response = await cb(...args);
      setData(response);
      setError(null);
      return response;
    } catch (err: any) {
      setError(err);
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fn, setData };
};

export default useFetch;

