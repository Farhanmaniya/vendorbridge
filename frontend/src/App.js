import logo from "./logo.svg";
import "./App.css";

function App() {
  return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center">
      <div className="card max-w-sm w-full text-center">
        <h1 className="text-xl font-semibold text-text-primary mb-1">
          VendorBridge
        </h1>
        <p className="text-text-muted text-sm mb-4">
          Theme is working correctly.
        </p>
        <div className="flex gap-2 justify-center flex-wrap">
          <button className="btn-primary">Primary</button>
          <button className="btn-outline">Outline</button>
          <button className="btn-ghost">Ghost</button>
        </div>
        <div className="flex gap-2 mt-3 justify-center flex-wrap">
          <span className="badge-open">Open</span>
          <span className="badge-approved">Approved</span>
          <span className="badge-pending">Pending</span>
          <span className="badge-rejected">Rejected</span>
        </div>
      </div>
    </div>
  );
}

export default App;
