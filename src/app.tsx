import * as React from "react";
import { createRoot } from "react-dom/client";
const fs = window.require("fs");
const root = createRoot(document.body);
fs.readFile(
  "D:\\Documents\\My Games\\Rocket League\\TAGame\\Demos\\F8ABB564474FB0D6485B6A870D4D37EB.replay",
  (err, data) => {
    if (err) {
      console.error(err);
    }
    console.log("data", data);
  }
);
root.render(<h2>Hello from React!</h2>);
