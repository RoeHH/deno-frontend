import * as React from 'https://esm.sh/react';
import { useIsLive, usePeer } from "../hooks.tsx";

export function ReplicaSyncer({ pubUrl }: { pubUrl: string }) {
  const [isLive] = useIsLive();
  const peer = usePeer();

  React.useEffect(() => {
    if (isLive) {
      const unsub = peer.sync(pubUrl);
      return () => {
        unsub();
      };
    }

    return () => {
    };
  }, [peer, isLive, pubUrl]);

  return null;
}
