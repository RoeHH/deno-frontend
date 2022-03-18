/** @jsx h */
import { h } from "../client_deps.ts";
import Counter from "../islands/Counter.tsx";
import Button from 'https://esm.sh/react-bootstrap/Button';

export default function Home() {
  return (
          <div>
            Hello Boy
            <Button variant="primary">Button #1</Button>
          </div>
  );
}
