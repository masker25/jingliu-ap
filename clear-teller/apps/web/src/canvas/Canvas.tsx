// The infinite canvas substrate (tldraw). It is the "work object" — the product
// lives here, not in a chat log. P0 renders the empty canvas; later phases add
// custom shapes: the focal checklist, faded divergent nodes, the conflict zone,
// and React Flow embedded for flowchart/mindmap views.

import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

export function Canvas() {
  return (
    <div className="absolute inset-0">
      <Tldraw persistenceKey="clear-teller-canvas" />
    </div>
  );
}
