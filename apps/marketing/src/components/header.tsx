import { PropsWithChildren } from "react";
import { motion } from "framer-motion";

export function Header(props: PropsWithChildren) {
  return (
    <motion.div className="animate-fade-in translate-y-[-1rem] text-balance bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text py-6 text-5xl font-medium leading-none tracking-tighter text-transparent opacity-0 [--animation-delay:200ms] dark:from-white dark:to-white/40 sm:text-6xl md:text-7xl lg:text-8xl">
      {props.children}
    </motion.div>
  );
}
