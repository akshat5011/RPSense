"use client";
import React, { useRef, useEffect } from "react";
import {
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
} from "motion/react";
import { Meteors } from "./meteors";

const Background = () => {
  const containerRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const controls = useAnimation();

  // Parallax effect based on mouse movement
  const parallaxX = useTransform(mouseX, [0, 1000], [-50, 50]);
  const parallaxY = useTransform(mouseY, [0, 1000], [-50, 50]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // Generate dynamic particles with physics
  const generateParticles = () => {
    return [...Array(60)].map((_, i) => {
      const size = Math.random() * 4 + 1;
      const duration = Math.random() * 20 + 15;
      const delay = Math.random() * 5;

      return (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: size,
            height: size,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `radial-gradient(circle, rgba(0,255,255,${
              Math.random() * 0.8 + 0.2
            }) 0%, transparent 70%)`,
            filter: "blur(0.5px)",
          }}
          animate={{
            x: [0, Math.random() * 200 - 100, Math.random() * 200 - 100, 0],
            y: [0, Math.random() * 200 - 100, Math.random() * 200 - 100, 0],
            scale: [1, Math.random() * 1.5 + 0.5, 1],
            opacity: [0.3, 1, 0.3],
            rotate: [0, 360],
          }}
          transition={{
            duration,
            delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      );
    });
  };

  // Neural network connection lines
  const generateConnections = () => {
    return [...Array(8)].map((_, i) => (
      <motion.svg
        key={i}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      >
        <motion.path
          d={`M${Math.random() * 100}% ${Math.random() * 100}% Q${
            Math.random() * 100
          }% ${Math.random() * 100}% ${Math.random() * 100}% ${
            Math.random() * 100
          }%`}
          stroke="url(#gradient)"
          strokeWidth="1"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: [0, 1, 0],
            opacity: [0, 0.4, 0],
          }}
          transition={{
            duration: Math.random() * 8 + 6,
            delay: Math.random() * 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="cyan" stopOpacity="0" />
            <stop offset="50%" stopColor="cyan" stopOpacity="0.6" />
            <stop offset="100%" stopColor="purple" stopOpacity="0" />
          </linearGradient>
        </defs>
      </motion.svg>
    ));
  };

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      {/* Animated Gradient Base */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            "radial-gradient(circle at 20% 50%, #0f0c29 0%, #302b63 50%, #24243e 100%)",
            "radial-gradient(circle at 80% 20%, #0f0c29 0%, #24243e 50%, #302b63 100%)",
            "radial-gradient(circle at 40% 80%, #302b63 0%, #0f0c29 50%, #24243e 100%)",
            "radial-gradient(circle at 20% 50%, #0f0c29 0%, #302b63 50%, #24243e 100%)",
          ],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Meteors Layer - Added for space/tech aesthetic */}
      <div className="absolute inset-0 z-10 w-full h-full">
        <Meteors
          number={20}
          className="bg-cyan-400/60 shadow-[0_0_0_1px_rgba(0,255,255,0.3)] before:bg-gradient-to-r before:from-cyan-400 before:to-transparent"
        />
      </div>

      {/* Dynamic Overlay with Parallax */}
      <motion.div
        className="absolute inset-0 bg-black/30"
        style={{ x: parallaxX, y: parallaxY }}
        animate={{
          background: [
            "radial-gradient(circle at 30% 40%, rgba(0,255,255,0.08) 0%, transparent 50%)",
            "radial-gradient(circle at 70% 60%, rgba(160,0,255,0.08) 0%, transparent 50%)",
            "radial-gradient(circle at 30% 40%, rgba(0,255,255,0.08) 0%, transparent 50%)",
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Physics-based Particles */}
      <div className="absolute inset-0 z-5">{generateParticles()}</div>

      {/* Neural Network Connections */}
      <div className="absolute inset-0 z-5">{generateConnections()}</div>

      {/* Floating Geometric Shapes */}
      <div className="absolute inset-0 ">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute border border-cyan-400/15 backdrop-blur-sm"
            style={{
              width: Math.random() * 80 + 40,
              height: Math.random() * 80 + 40,
              left: `${Math.random() * 80 + 10}%`,
              top: `${Math.random() * 80 + 10}%`,
              borderRadius: Math.random() > 0.5 ? "50%" : "0%",
            }}
            animate={{
              rotate: [0, 360],
              scale: [1, 1.15, 1],
              borderColor: [
                "rgba(0,255,255,0.15)",
                "rgba(160,0,255,0.15)",
                "rgba(0,255,255,0.15)",
              ],
            }}
            transition={{
              duration: Math.random() * 15 + 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Enhanced Hand Gesture Recognition Visual */}
      <motion.div
        className="absolute left-1/2 top-1/2 pointer-events-none z-5"
        style={{
          transform: "translate(-50%, -50%)",
          x: useTransform(parallaxX, [0, 100], [0, 15]),
          y: useTransform(parallaxY, [0, 100], [0, 15]),
        }}
      >
        <svg width="350" height="350" viewBox="0 0 350 350" fill="none">
          {/* Animated Hand Outline */}
          <motion.path
            d="M100 240 Q120 200 140 240 Q160 280 180 240 Q200 200 220 240 Q240 280 260 240 Q280 200 300 240"
            stroke="cyan"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{
              pathLength: [0, 1, 0.7, 1, 0],
              stroke: ["#0ff", "#a0f", "#0ff"],
              filter: [
                "drop-shadow(0 0 15px #0ff)",
                "drop-shadow(0 0 25px #a0f)",
                "drop-shadow(0 0 15px #0ff)",
              ],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Scanning Lines */}
          {[...Array(4)].map((_, i) => (
            <motion.line
              key={i}
              x1="80"
              y1={140 + i * 25}
              x2="270"
              y2={140 + i * 25}
              stroke="rgba(0,255,255,0.25)"
              strokeWidth="0.8"
              animate={{
                opacity: [0, 0.8, 0],
                x1: [60, 80],
                x2: [290, 270],
              }}
              transition={{
                duration: 2.5,
                delay: i * 0.15,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Recognition Points */}
          {[...Array(6)].map((_, i) => (
            <motion.circle
              key={i}
              cx={120 + i * 18}
              cy={180 + Math.sin(i) * 25}
              r="1.5"
              fill="cyan"
              animate={{
                r: [1.5, 4, 1.5],
                opacity: [0.4, 1, 0.4],
                fill: ["#0ff", "#a0f", "#0ff"],
              }}
              transition={{
                duration: 1.8,
                delay: i * 0.12,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </svg>
      </motion.div>

      {/* Reactive Border Glow */}
      <motion.div
        className="absolute inset-0 border border-transparent z-5"
        animate={{
          borderImage: [
            "linear-gradient(45deg, transparent, rgba(0,255,255,0.2), transparent) 1",
            "linear-gradient(45deg, transparent, rgba(160,0,255,0.2), transparent) 1",
            "linear-gradient(45deg, transparent, rgba(0,255,255,0.2), transparent) 1",
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};

export default Background;
