import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <h1>Unhook API</h1>
      <div className="content">
        <p>Welcome to the Unhook VS Code extension!</p>
        <div className="card">
          <button type="button" onClick={() => setCount((count) => count + 1)}>
            Count is {count}
          </button>
          <p>
            Edit <code>src/webview/App.tsx</code> and save to test HMR
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
