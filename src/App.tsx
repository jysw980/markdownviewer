import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import Editor from "./Editor";
import Preview from "./Preview";
import "./App.css";

function App() {
  const [text, setText] = useState("# Hello, Markdown!\n\nStart typing here...\n");
  const [filePath, setFilePath] = useState<string | null>(null);

  async function handleOpen() {
    try {
      const path = await open({
        filters: [{ name: "Markdown", extensions: ["md", "txt", "markdown"] }],
      });
      if (!path) return;
      const content = await invoke<string>("read_file", { path });
      setText(content);
      setFilePath(path);
    } catch (e) {
      alert("Failed to open file: " + e);
    }
  }

  async function handleSave() {
    try {
      const target = filePath ?? await save({
        filters: [{ name: "Markdown", extensions: ["md"] }],
      });
      if (!target) return;
      await invoke("save_file", { path: target, content: text });
      setFilePath(target);
    } catch (e) {
      alert("Failed to save file: " + e);
    }
  }

  return (
    <div className="app">
      <div className="toolbar">
        <button className="toolbar-btn" onClick={handleOpen}>Open</button>
        <button className="toolbar-btn" onClick={handleSave}>Save</button>
        {filePath && <span className="file-path">{filePath}</span>}
      </div>
      <div className="split-pane">
        <div className="pane pane-editor">
          <div className="pane-header">Editor</div>
          <Editor value={text} onChange={setText} />
        </div>
        <div className="pane pane-preview">
          <div className="pane-header">Preview</div>
          <Preview markdown={text} />
        </div>
      </div>
    </div>
  );
}

export default App;
