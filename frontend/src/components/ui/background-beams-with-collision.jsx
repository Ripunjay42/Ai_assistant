"use client";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import React, { useRef, useState, useEffect } from "react";

export const BackgroundBeamsWithCollision = ({ children, className }) => {
  const containerRef = useRef(null);
  const parentRef = useRef(null);

  const beams = [
    { initialX: "5%", translateX: "5%", duration: 7, repeatDelay: 3, delay: 2 },
    { initialX: "15%", translateX: "15%", duration: 3, repeatDelay: 3, delay: 4 },
    { initialX: "25%", translateX: "25%", duration: 7, repeatDelay: 7, className: "h-6" },
    { initialX: "35%", translateX: "35%", duration: 5, repeatDelay: 14, delay: 4 },
    { initialX: "45%", translateX: "45%", duration: 11, repeatDelay: 2, className: "h-20" },
    { initialX: "55%", translateX: "55%", duration: 4, repeatDelay: 2, className: "h-12" },
    { initialX: "65%", translateX: "65%", duration: 6, repeatDelay: 4, delay: 2, className: "h-6" },
    { initialX: "75%", translateX: "75%", duration: 8, repeatDelay: 5, delay: 1 },
    { initialX: "85%", translateX: "85%", duration: 9, repeatDelay: 3, delay: 3, className: "h-16" },
    { initialX: "10%", translateX: "10%", duration: 5, repeatDelay: 6, delay: 2 },
    { initialX: "95%", translateX: "95%", duration: 7, repeatDelay: 4, className: "h-8" },
    { initialX: "50%", translateX: "50%", duration: 6, repeatDelay: 8, delay: 5 },
    { initialX: "20%", translateX: "20%", duration: 8, repeatDelay: 4, delay: 3 },
    { initialX: "40%", translateX: "40%", duration: 9, repeatDelay: 5, delay: 2, className: "h-10" },
    { initialX: "60%", translateX: "60%", duration: 7, repeatDelay: 3, delay: 4 },
    { initialX: "80%", translateX: "80%", duration: 6, repeatDelay: 6, delay: 1, className: "h-14" },
  ];

  return (
    <div
      ref={parentRef}
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none",
        className
      )}
    >
      {beams.map((beam, index) => (
        <CollisionMechanism
          key={`beam-${index}`}
          beamOptions={beam}
          containerRef={containerRef}
          parentRef={parentRef}
        />
      ))}

      {children}

      <div
        ref={containerRef}
        className="absolute bottom-0 left-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"
        style={{
          boxShadow:
            "0 0 24px rgba(6, 182, 212, 0.4), 0 0 48px rgba(6, 182, 212, 0.2), 0 0 72px rgba(6, 182, 212, 0.1)",
        }}
      />
    </div>
  );
};

const CollisionMechanism = React.forwardRef(
  ({ beamOptions, containerRef, parentRef }, ref) => {
    const beamRef = useRef(null);
    const [collision, setCollision] = useState({
      detected: false,
      coordinates: null,
    });
    const [beamKey, setBeamKey] = useState(0);
    const [cycleCollisionDetected, setCycleCollisionDetected] = useState(false);

    useEffect(() => {
      const checkCollision = () => {
        if (
          beamRef.current &&
          containerRef.current &&
          parentRef.current &&
          !cycleCollisionDetected
        ) {
          const beamRect = beamRef.current.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();
          const parentRect = parentRef.current.getBoundingClientRect();

          if (beamRect.bottom >= containerRect.top) {
            const relativeX =
              beamRect.left - parentRect.left + beamRect.width / 2;
            const relativeY = beamRect.bottom - parentRect.top;

            setCollision({
              detected: true,
              coordinates: { x: relativeX, y: relativeY },
            });
            setCycleCollisionDetected(true);
          }
        }
      };

      const animationInterval = setInterval(checkCollision, 50);
      return () => clearInterval(animationInterval);
    }, [cycleCollisionDetected, containerRef, parentRef]);

    useEffect(() => {
      if (collision.detected && collision.coordinates) {
        setTimeout(() => {
          setCollision({ detected: false, coordinates: null });
          setCycleCollisionDetected(false);
        }, 2000);

        setTimeout(() => {
          setBeamKey((prev) => prev + 1);
        }, 2000);
      }
    }, [collision]);

    return (
      <>
        <motion.div
          key={beamKey}
          ref={beamRef}
          animate="animate"
          initial={{
            translateY: beamOptions.initialY || "-200px",
            rotate: beamOptions.rotate || 0,
          }}
          variants={{
            animate: {
              translateY: "1800px",
              rotate: beamOptions.rotate || 0,
            },
          }}
          transition={{
            duration: beamOptions.duration || 8,
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear",
            delay: beamOptions.delay || 0,
            repeatDelay: beamOptions.repeatDelay || 0,
          }}
          style={{
            left: beamOptions.initialX || "0%",
          }}
          className={cn(
            "absolute top-20 m-auto h-6 w-[0.5px] rounded-full bg-linear-to-t from-cyan-500 via-cyan-300 to-transparent",
            beamOptions.className
          )}
        />
        <AnimatePresence>
          {collision.detected && collision.coordinates && (
            <Explosion
              key={`explosion-${beamKey}`}
              className=""
              style={{
                left: `${collision.coordinates.x}px`,
                top: `${collision.coordinates.y}px`,
                transform: "translate(-50%, -50%)",
              }}
            />
          )}
        </AnimatePresence>
      </>
    );
  }
);

CollisionMechanism.displayName = "CollisionMechanism";

const Explosion = ({ ...props }) => {
  const spans = Array.from({ length: 20 }, (_, index) => ({
    id: index,
    initialX: 0,
    initialY: 0,
    directionX: Math.floor(Math.random() * 80 - 40),
    directionY: Math.floor(Math.random() * -50 - 10),
  }));

  return (
    <div {...props} className={cn("absolute z-50 h-2 w-2", props.className)}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute -inset-x-10 top-0 m-auto h-2 w-10 rounded-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent blur-sm"
      />
      {spans.map((span) => (
        <motion.span
          key={span.id}
          initial={{ x: span.initialX, y: span.initialY, opacity: 1 }}
          animate={{
            x: span.directionX,
            y: span.directionY,
            opacity: 0,
          }}
          transition={{ duration: Math.random() * 1.5 + 0.5, ease: "easeOut" }}
          className="absolute h-1 w-1 rounded-full bg-gradient-to-b from-cyan-500 to-cyan-300"
        />
      ))}
    </div>
  );
};
