import * as React from 'https://esm.sh/react';
import { unstable_batchedUpdates } from 'https://esm.sh/react-dom@17.0.2';
import {
  AuthorKeypair,
  checkShareIsValid,
  EarthstarError,
  isErr,
  ReplicaCache,
} from 'https://raw.githubusercontent.com/earthstar-project/earthstar/main/mod.browser.ts';
import {
  AddShareContext,
  CurrentShareContext,
  IdentityContext,
  IsLiveContext,
  PeerContext,
  ReplicaServersContext,
} from "./contexts.ts";
import { getLocalStorage, makeStorageKey } from "./util.ts";

export function usePeer() {
  const peer = React.useContext(PeerContext);

  const [trigger, setTrigger] = React.useState(true);

  const memoPeer = React.useMemo(() => peer, [trigger]);

  React.useEffect(() => {
    const unsub = peer.replicaMap.bus.on("*", () => {
      setTrigger((prev) => !prev);
    });

    return () => {
      unsub();
    };
  }, [peer]);

  return memoPeer;
}

export function useAddShare() {
  return React.useContext(AddShareContext);
}

export function useReplicaServers(): [
  string[],
  React.Dispatch<React.SetStateAction<string[]>>,
] {
  const { replicaServers, setReplicaServers } = React.useContext(
    ReplicaServersContext,
  );

  return [replicaServers, setReplicaServers];
}

export function useIdentity(): [
  AuthorKeypair | null,
  React.Dispatch<React.SetStateAction<AuthorKeypair | null>>,
] {
  const { identity, setIdentity } = React.useContext(
    IdentityContext,
  );

  return [identity, setIdentity];
}

export function useCurrentShare(): [
  string | null,
  React.Dispatch<React.SetStateAction<string | null>>,
] {
  const peer = usePeer();

  const { currentShare, setCurrentShare } = React.useContext(
    CurrentShareContext,
  );

  React.useEffect(() => {
    if (currentShare && peer.hasShare(currentShare) === false) {
      console.warn(
        `Tried to set current workspace to ${currentShare}, which is not a known workspace.`,
      );
      setCurrentShare(null);
    }
  }, [currentShare, setCurrentShare]);

  return [currentShare, setCurrentShare];
}

export function useReplica(shareAddress?: string | undefined) {
  const [currentShare] = useCurrentShare();
  const peer = usePeer();

  const address = shareAddress || currentShare;

  const replicaCache = React.useMemo(
    () => {
      const replica = address ? peer.getReplica(address) : undefined;

      if (!replica) {
        throw new Error("Tried to use useReplica with no share specified!");
      }

      return new ReplicaCache(replica, 1000, (cb) => {
        unstable_batchedUpdates(cb);
      });
    },
    [address, peer],
  );

  const [, setTrigger] = React.useState(true);

  React.useLayoutEffect(() => {
    const unsub = replicaCache.onCacheUpdated(() => {
      setTrigger((prev) => !prev);
    });

    return () => {
      unsub();
      replicaCache.close();
    };
  }, [replicaCache]);

  return replicaCache;

  // Keeping the below around for React 18.
  /*
    const replicaCache = React.useMemo(() => {
      const replica = address ? peer.getReplica(address) : undefined;
         if (!replica) {
        throw new Error("Tried to use useReplica with no share specified!");
      }
         return new ReplicaCache(replica, 1000);
       [address, peer])
       const [currentVersion, setVersion] = React.useState(replicaCache.version);
       const memoReplica = React.useMemo(() => {
      return replicaCache;
       [currentVersion, replicaCache]);
       React.useEffect(() => {
      replicaCache.onCacheUpdated(() => {
        setVersion(replicaCache.version);

      ;
         nst subscribe = React.useCallback((onStoreChange: () => void) => {
        turn memoReplica.onCacheUpdated(() => {
          StoreChange();
        ;
       [memoReplica, replicaCache]);
         nst getSnapshot = React.useCallback(() => memoReplica, []);
         turn useSyncExternalStoreWithSelector(
        bscribe,
        tSnapshot,
        tSnapshot,
        ache) => cache,
        acheA, cacheB) => cacheA.version === cacheB.version,
      */
}

export function useInvitation(invitationCode: string) {
  const addShare = React.useContext(AddShareContext);
  const [, setPubs] = useReplicaServers();

  try {
    const url = new URL(invitationCode);

    const isEarthstarURL = url.protocol === "earthstar:";

    if (!isEarthstarURL) {
      return new EarthstarError("Invitation not a valid Earthstar URL");
    }

    const version = url.searchParams.get("v");

    if (version !== "1") {
      return new EarthstarError(
        "Unrecognised Earthstar invitation format version",
      );
    }

    const workspace = url.searchParams.get("workspace");

    if (workspace === null) {
      return new EarthstarError(
        "No workspace found in Earthstar invitation URL",
      );
    }

    const plussedWorkspace = workspace.replace(" ", "+");

    const shareIsValid = checkShareIsValid(plussedWorkspace);

    if (isErr(shareIsValid)) {
      return shareIsValid;
    }

    const pubs = url.searchParams.getAll("pub");

    try {
      pubs.forEach((pubUrl) => new URL(pubUrl));
    } catch {
      return new EarthstarError("Malformed Pub URL found");
    }

    const redeem = (excludedPubs: string[] = []) => {
      addShare(plussedWorkspace);

      const nextPubs = Array.from(
        new Set([
          ...pubs.filter((pubUrl) => !excludedPubs.includes(pubUrl)),
        ]),
      );

      setPubs((prevPubs) =>
        Array.from(
          new Set([
            ...prevPubs,
            ...nextPubs,
          ]),
        )
      );
    };

    return { redeem, workspace: plussedWorkspace, pubs };
  } catch {
    return new EarthstarError("Not a valid Earthstar URL");
  }
}

export function useMakeInvitation(
  includedPubs: string[] = [],
  shareAddress?: string,
) {
  const [pubs] = useReplicaServers();
  const [currentShare] = useCurrentShare();
  const address = shareAddress || currentShare;

  const pubsToUse = pubs.filter((pubUrl) => includedPubs.includes(pubUrl));
  const pubsString = pubsToUse.map((pubUrl) => `&pub=${pubUrl}`).join("");

  if (!address) {
    return "Couldn't create invitation code!";
  }

  return `earthstar:///?workspace=${address}${pubsString}&v=1`;
}

export function useIsLive(): [
  boolean,
  React.Dispatch<React.SetStateAction<boolean>>,
] {
  const { isLive, setIsLive } = React.useContext(IsLiveContext);

  return [isLive, setIsLive];
}

export function useLocalStorageEarthstarSettings(storageKey: string) {
  const lsIdentityKey = makeStorageKey(storageKey, "identity");
  const lsPubsKey = makeStorageKey(storageKey, "replica-servers");
  const lsSharesKey = makeStorageKey(storageKey, "shares");
  const lsCurrentShareKey = makeStorageKey(storageKey, "current-share");
  const lsIsLiveKey = makeStorageKey(storageKey, "is-live");

  const allKeys = React.useMemo(
    () => [
      lsIdentityKey,
      lsPubsKey,
      lsSharesKey,
      lsCurrentShareKey,
      lsIsLiveKey,
    ],
    [lsIdentityKey, lsPubsKey, lsSharesKey, lsCurrentShareKey, lsIsLiveKey],
  );

  // load the initial state from localStorage
  const initShares = getLocalStorage<string[]>(lsSharesKey);
  const initReplicaServers = getLocalStorage<string[]>(lsPubsKey);
  const initIdentity = getLocalStorage<AuthorKeypair>(lsIdentityKey);
  const initCurrentShare = getLocalStorage<string>(lsCurrentShareKey);
  const initIsLive = getLocalStorage<boolean>(lsIsLiveKey);

  const [, setTrigger] = React.useState(true);

  const onStorage = React.useCallback((event: StorageEvent) => {
    if (event.key && allKeys.includes(event.key)) {
      setTrigger((prev) => !prev);
    }
  }, [allKeys]);

  React.useEffect(() => {
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, [onStorage]);

  return {
    initShares: initShares || [],
    initReplicaServers: initReplicaServers || [],
    initIdentity: initIdentity || null,
    initCurrentShare: initCurrentShare || null,
    initIsLive: initIsLive || true,
  };
}
