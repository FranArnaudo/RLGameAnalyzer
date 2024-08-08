import * as React from "react";
import { createRoot } from "react-dom/client";
const child_process = window.require("child_process");
const id = "F8ABB564474FB0D6485B6A870D4D37EB";
const filePath = `D:/Documents/My Games/Rocket League/TAGame/Demos/${id}.replay`;

const command = `rattletrap.exe --input "${filePath}" --output ${id}.json && move ${id}.json outputs/ `;
const execute = true;
if (execute) {
  child_process.exec(
    command,
    (error: Error, stdout: string, stderr: string) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
        return;
      }
      console.log(`Stdout: ${stdout}`);
    }
  );
}
const root = createRoot(document.body);
root.render(<h2>Hello from React!</h2>);
