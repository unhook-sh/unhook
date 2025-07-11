'use client';

import { motion } from 'framer-motion';
import { Cloud, Database, Server, Terminal } from 'lucide-react';
import { useRef, useState } from 'react';

interface MainBoxProps {
  icon: React.ReactNode;
  title: string;
  id: string;
  initialAnimation?: {
    y?: number;
    scale?: number;
  };
}

const MainBox = ({ icon, title, initialAnimation }: MainBoxProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const glowClasses =
    'absolute inset-0 rounded-3xl bg-emerald-400/10 blur-xl transition-all duration-300';
  const mainBoxClasses =
    'relative flex items-center justify-center gap-3 px-10 py-4 bg-emerald-950/60 backdrop-blur-sm border border-emerald-400/20 rounded-3xl shadow-lg min-w-[280px]';
  const iconClasses = 'w-6 h-6 text-emerald-300';
  const textClasses = 'text-xl font-medium text-emerald-50';

  return (
    <motion.div
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="relative"
      initial={{ opacity: 0, ...(initialAnimation || { scale: 0.9 }) }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      transition={{ duration: 0.5 }}
    >
      <div
        className={`${glowClasses} ${isHovering ? 'scale-110 opacity-30' : ''}`}
      />
      <div className={mainBoxClasses}>
        <div className={iconClasses}>{icon}</div>
        <span className={textClasses}>{title}</span>
      </div>
    </motion.div>
  );
};

interface ActionButtonProps {
  label: string;
  delay?: number;
}

const ActionButton = ({ label, delay = 0.3 }: ActionButtonProps) => {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-emerald-400/10 blur-lg" />
        <div className="relative px-6 py-2 bg-emerald-950/40 rounded-full text-emerald-300 font-medium text-sm shadow-md">
          {label}
        </div>
      </div>
      <motion.div
        animate={{ y: [0, 3, 0] }}
        className="flex justify-center mt-2"
        transition={{
          duration: 2,
          ease: 'easeInOut',
          repeat: Number.POSITIVE_INFINITY,
        }}
      >
        <svg
          aria-hidden="true"
          fill="none"
          height="20"
          viewBox="0 0 24 24"
          width="20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 5V19M12 19L5 12M12 19L19 12"
            stroke="#6ee7b7"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </motion.div>
    </motion.div>
  );
};

const ModernFlowDiagram = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="relative w-full h-full bg-gradient-to-br from-[#064e3b] via-[#065f46] to-[#064e3b] rounded-xl overflow-hidden"
      ref={containerRef}
    >
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] rounded-full bg-emerald-600/5 blur-[100px]" />
        <div className="absolute bottom-[15%] right-[10%] w-[350px] h-[350px] rounded-full bg-emerald-400/5 blur-[100px]" />
        <div className="absolute top-[40%] right-[15%] w-[300px] h-[300px] rounded-full bg-emerald-500/5 blur-[80px]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiMwNDI3MWMiIGZpbGwtb3BhY2l0eT0iMC4wNCIgZD0iTTM2IDM0aDR2MWgtNHYtMXptMC0yaDF2NGgtMXYtNHptMi0yaDF2MWgtMXYtMXptLTIgMmgtMXYxaDF2LTF6bS0yLTJoMXYxaC0xdi0xem0yLTJoMXYxaC0xdi0xem0yLTJoMXYxaC0xdi0xem0tMi0yaDF2MWgtMXYtMXptLTItMmgxdjFoLTF2LTF6Ii8+PC9nPjwvc3ZnPg==')] opacity-10" />
      </div>

      {/* Main flow diagram - perfectly centered */}
      <div className="relative z-10 flex flex-col items-center gap-4 py-16">
        <MainBox
          icon={<Cloud />}
          id="webhook"
          initialAnimation={{ y: -20 }}
          title="Webhook Provider"
        />
        <ActionButton delay={0.3} label="POST" />
        <MainBox icon={<Server />} id="api" title="Unhook API" />
        <ActionButton delay={0.4} label="Store" />
        <MainBox icon={<Database />} id="database" title="Database" />
        <ActionButton delay={0.5} label="Websocket" />
        <MainBox icon={<Terminal />} id="client" title="CLI Client" />
        <ActionButton delay={0.6} label="Forward" />
        <MainBox
          icon={<Server />}
          id="server"
          initialAnimation={{ y: 20 }}
          title="Local Server"
        />
      </div>
    </div>
  );
};

export default ModernFlowDiagram;
