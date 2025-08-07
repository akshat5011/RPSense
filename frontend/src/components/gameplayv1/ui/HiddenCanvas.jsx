import React from "react";

const HiddenCanvas = ({ canvasRef }) => {
  return <canvas ref={canvasRef} style={{ display: "none" }} />;
};

export default HiddenCanvas;
