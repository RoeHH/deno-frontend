/** @jsx h */
import { h } from "../client_deps.ts";
import {
    FormatValidatorEs4,
    Replica,
    ReplicaDriverIndexedDB,
} from '../server_deps.ts'
import { Peer } from "../react-earthstar/index.ts";

export default function Home() {
  return (
    <Peer
      onCreateShare={(address: string) => {
        // Here we're teaching Peer how to persist data for shares.
        const driver = new ReplicaDriverIndexedDB(address);
        return new Replica(address, FormatValidatorEs4, driver);
      }}
    >
      <h1>{"The beginnings of my app!"}</h1>
    </Peer>
  );
}
