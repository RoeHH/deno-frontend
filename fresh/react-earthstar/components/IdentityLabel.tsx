import * as React from 'https://esm.sh/react';
import { getAuthorShortName } from "../util.ts";

export function IdentityLabel({
  address,
  ...props
}: { address: string } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      title={address}
    >
      {`@${getAuthorShortName(address)}`}
    </span>
  );
}
