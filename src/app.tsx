/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-constant-condition */
/* eslint-disable no-case-declarations */
import * as React from "react";
import { createRoot } from "react-dom/client";
const carball = window.require("carball");

carball.decompile_replay(
  "8075AEC640E0BB9073014B9F1C23563A.replay",
  "8075AEC640E0BB9073014B9F1C23563A.json",
  true
);
// const { readReplayMf } = require("./util/boxcarparser");

// readReplayMf();
const root = createRoot(document.body);

root.render(<h2>Hello from React!</h2>);
