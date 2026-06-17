import React from 'react'
import { motion } from 'framer-motion'

export const LoadingScreen: React.FC = React.memo(() => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent'
      }}
    >
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'radial-gradient(circle, hsla(210, 50%, 70%, 0.3) 0%, transparent 70%)',
          filter: 'blur(4px)'
        }}
      />
      <div
        style={{
          marginTop: 16,
          color: 'hsla(210, 30%, 80%, 0.5)',
          fontSize: 14,
          fontFamily: 'sans-serif'
        }}
      >
        加载中...
      </div>
    </motion.div>
  )
})

LoadingScreen.displayName = 'LoadingScreen'
