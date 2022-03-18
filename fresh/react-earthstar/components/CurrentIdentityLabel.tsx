import * as React from 'https://esm.sh/react';

import { IdentityLabel } from "./IdentityLabel.tsx";
import { useIdentity } from "../hooks.tsx";

export function CurrentIdentityLabel(
  props: React.HTMLAttributes<HTMLSpanElement>,
) {
  const [currentAuthor] = useIdentity();

  return currentAuthor
    ? <IdentityLabel {...props} address={currentAuthor.address} />
    : <>{"Not signed in"}</>;
}
