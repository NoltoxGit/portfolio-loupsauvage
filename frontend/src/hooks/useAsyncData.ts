import { useEffect, useState } from "react";

export interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

export function useAsyncData<T>(load: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let active = true;
    setState({ data: null, error: null, loading: true });

    load()
      .then((data) => {
        if (active) setState({ data, error: null, loading: false });
      })
      .catch((error: Error) => {
        if (active) setState({ data: null, error, loading: false });
      });

    return () => {
      active = false;
    };
  }, deps);

  return state;
}
