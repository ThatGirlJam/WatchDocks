import React from "react";

const VideoPlayer = () => {
  return (
    <div style={{ maxWidth: "800px", margin: "auto" }}>
      <video width="100%" controls autoPlay muted>
        <source src="/videos/livestream_converted.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;
