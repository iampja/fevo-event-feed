import { useState, useCallback, useRef } from 'react';
import { launchOffer } from '@/services/fevoApi';

export type LaunchStatus =
  | 'idle'
  | 'searching'
  | 'creating'
  | 'polling'
  | 'building_inventory'
  | 'linking'
  | 'done'
  | 'error';

interface LaunchResult {
  outingId: string;
  accessCode: string;
  manageUrl: string;
}

export function useFevoLaunch() {
  const [status, setStatus] = useState<LaunchStatus>('idle');
  const [result, setResult] = useState<LaunchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<(() => void) | null>(null);

  const launch = useCallback(
    (params: {
      orgId: string;
      eventId: string;
      title: string;
      description: string;
      accessCode: string;
      hasGroups: boolean;
    }) => {
      setStatus('searching');
      setError(null);
      setResult(null);

      abortRef.current = launchOffer(
        params,
        (step, _detail) => {
          setStatus(step as LaunchStatus);
        },
        (res) => {
          setStatus('done');
          setResult(res);
        },
        (err) => {
          setStatus('error');
          setError(err);
        },
      );
    },
    [],
  );

  const abort = useCallback(() => {
    abortRef.current?.();
    setStatus('idle');
  }, []);

  return { status, result, error, launch, abort };
}
