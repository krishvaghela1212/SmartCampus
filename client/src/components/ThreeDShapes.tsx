import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export const ThreeDShapes: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const yMove = useTransform(scrollYProgress, [0, 1], [0, -200]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-bgPrimary">
      {/* 3D Perspective Grid */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          perspective: '1000px',
          perspectiveOrigin: '50% 50%',
        }}
      >
        <motion.div 
          style={{ y: yMove }}
          className="absolute inset-0 origin-center will-change-transform"
        >
          {/* Grid Lines - Simplified to single div with repeating linear gradient */}
          <div 
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `
                linear-gradient(to bottom, rgba(46, 204, 113, 0.1) 1px, transparent 1px),
                linear-gradient(to right, rgba(46, 204, 113, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '80px 80px',
              transform: 'rotateX(65deg) scale(3) translateY(-10%)',
              transformStyle: 'preserve-3d'
            }}
          />
        </motion.div>
      </div>

      {/* Floating 3D Cube */}
      <motion.div
        animate={{
          rotateX: [0, 360],
          rotateY: [0, 360],
          y: [0, -40, 0]
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-[20%] left-[8%] w-32 h-32 border border-accent/20 rounded-2xl bg-accent/5 backdrop-blur-[2px] will-change-transform"
      >
        <div className="absolute inset-0 border border-accent/10 rounded-2xl shadow-[inset_0_0_20px_rgba(46,204,113,0.1)]" />
      </motion.div>

      {/* Floating Tetrahedron-like shape */}
      <motion.div
        animate={{
          rotateZ: [0, 360],
          scale: [0.9, 1.05, 0.9],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute bottom-[15%] right-[12%] w-48 h-48 border border-white/5 rounded-[30%] flex items-center justify-center opacity-30 will-change-transform"
      >
        <div className="w-full h-full border border-accent/20 rounded-full rotate-45 animate-pulse" />
        <div className="absolute w-full h-full border border-accent/20 rounded-full -rotate-45 animate-pulse" />
        <div className="absolute w-1/2 h-1/2 bg-accent/5 rounded-full blur-2xl" />
      </motion.div>

      {/* Floating Particles/Dust - Reduced count for performance */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: Math.random() * window.innerWidth, 
            y: Math.random() * window.innerHeight,
            opacity: 0 
          }}
          animate={{
            y: [null, Math.random() * -200],
            x: [null, (Math.random() - 0.5) * 100],
            opacity: [0, 0.4, 0],
            scale: [0, 1.5, 0]
          }}
          transition={{
            duration: 10 + Math.random() * 20,
            repeat: Infinity,
            delay: i * 1.5,
            ease: "easeInOut"
          }}
          className="absolute w-1 h-1 bg-accent rounded-full shadow-[0_0_8px_rgba(46,204,113,0.8)]"
        />
      ))}

      {/* Ambient Radial Gradient Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(15,15,15,0.8)_100%)]" />
    </div>
  );
};
