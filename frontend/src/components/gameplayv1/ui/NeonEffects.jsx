import React from "react";

const NeonEffects = () => {
  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
    </div>
  );
};

export default NeonEffects;
