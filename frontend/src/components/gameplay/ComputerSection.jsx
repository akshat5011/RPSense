import React from "react";
import ComputerDisplay from "./ui/ComputerDisplay";
import StatusIndicator from "./ui/StatusIndicator";

const ComputerSection = ({ computerChoice }) => {
  return (
    <div className="flex flex-col">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-purple-400 mb-2">
          Computer's Move
        </h2>
        <p className="text-slate-300 text-sm">AI is thinking...</p>
      </div>

      <div className="relative flex-1 rounded-lg border-2 border-purple-500/30 bg-slate-900/50 flex items-center justify-center">
        <ComputerDisplay choice={computerChoice} />

        <StatusIndicator
          isActive={true}
          label="AI Ready"
          type="ai"
          position="top-right"
        />
      </div>
    </div>
  );
};

export default ComputerSection;
