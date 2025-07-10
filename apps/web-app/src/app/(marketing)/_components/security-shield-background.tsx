'use client';

import { cn } from '@unhook/ui/lib/utils';
import { FlickeringGrid } from '@unhook/ui/magicui/flickering-grid';
import { motion } from 'motion/react';

interface SecurityShieldBackgroundProps {
  className?: string;
}

export function SecurityShieldBackground({
  className,
}: SecurityShieldBackgroundProps) {
  return (
    <div
      className={cn(
        'relative flex size-full items-center justify-center overflow-hidden transition-all duration-300 hover:[mask-image:none] hover:[webkit-mask-image:none]',
        className,
      )}
      style={{
        maskImage:
          "url('data:image/svg+xml,%3Csvg width=\'265\' height=\'268\' viewBox=\'0 0 265 268\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath fillRule=\'evenodd\' clipRule=\'evenodd\' d=\'M121.384 4.5393C124.406 1.99342 128.319 0.585938 132.374 0.585938C136.429 0.585938 140.342 1.99342 143.365 4.5393C173.074 29.6304 210.174 45.6338 249.754 50.4314C253.64 50.9018 257.221 52.6601 259.855 55.3912C262.489 58.1223 264.005 61.6477 264.13 65.3354C265.616 106.338 254.748 146.9 232.782 182.329C210.816 217.759 178.649 246.61 140.002 265.547C137.645 266.701 135.028 267.301 132.371 267.298C129.715 267.294 127.1 266.686 124.747 265.526C86.0991 246.59 53.9325 217.739 31.9665 182.309C10.0005 146.879 -0.867679 106.317 0.618784 65.3147C0.748654 61.6306 2.26627 58.1102 4.9001 55.3833C7.53394 52.6565 11.1121 50.9012 14.9945 50.4314C54.572 45.6396 91.6716 29.6435 121.384 4.56V4.5393Z' fill='black'/%3E%3C/svg%3E')",
        maskPosition: 'center',
        maskSize: 'contain',
        WebkitMaskImage:
          "url('data:image/svg+xml,%3Csvg width=\'265\' height=\'268\' viewBox=\'0 0 265 268\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath fillRule=\'evenodd\' clipRule=\'evenodd\' d=\'M121.384 4.5393C124.406 1.99342 128.319 0.585938 132.374 0.585938C136.429 0.585938 140.342 1.99342 143.365 4.5393C173.074 29.6304 210.174 45.6338 249.754 50.4314C253.64 50.9018 257.221 52.6601 259.855 55.3912C262.489 58.1223 264.005 61.6477 264.13 65.3354C265.616 106.338 254.748 146.9 232.782 182.329C210.816 217.759 178.649 246.61 140.002 265.547C137.645 266.701 135.028 267.301 132.371 267.298C129.715 267.294 127.1 266.686 124.747 265.526C86.0991 246.59 53.9325 217.739 31.9665 182.309C10.0005 146.879 -0.867679 106.317 0.618784 65.3147C0.748654 61.6306 2.26627 58.1102 4.9001 55.3833C7.53394 52.6565 11.1121 50.9012 14.9945 50.4314C54.572 45.6396 91.6716 29.6435 121.384 4.56V4.5393Z' fill='black'/%3E%3C/svg%3E')",
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskSize: 'contain',
      }}
    >
      <div className="absolute top-[55%] md:top-[58%] left-[55%] md:left-[57%] -translate-x-1/2 -translate-y-1/2  size-full z-10">
        <svg
          aria-label="Security Shield Background"
          className="size-[90%] md:size-[85%] object-contain fill-background"
          fill="none"
          height="244"
          role="img"
          viewBox="0 0 227 244"
          width="227"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Security Shield Background</title>
          <path
            clipRule="evenodd"
            d="M104.06 3.61671C106.656 1.28763 110.017 0 113.5 0C116.983 0 120.344 1.28763 122.94 3.61671C148.459 26.5711 180.325 41.2118 214.322 45.6008C217.66 46.0312 220.736 47.6398 222.999 50.1383C225.262 52.6369 226.563 55.862 226.67 59.2357C227.947 96.7468 218.612 133.854 199.744 166.267C180.877 198.68 153.248 225.074 120.052 242.398C118.028 243.454 115.779 244.003 113.498 244C111.216 243.997 108.969 243.441 106.948 242.379C73.7524 225.055 46.1231 198.661 27.2556 166.248C8.38807 133.835 -0.947042 96.7279 0.329744 59.2168C0.441295 55.8464 1.74484 52.6258 4.00715 50.1311C6.26946 47.6365 9.34293 46.0306 12.6777 45.6008C46.6725 41.2171 78.5389 26.5832 104.06 3.63565V3.61671Z"
            fillRule="evenodd"
          />
        </svg>
      </div>
      <div className="absolute top-[58%] md:top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2  size-full z-20">
        <svg
          aria-label="Security Shield Accent"
          className="size-full object-contain fill-accent"
          height="282"
          role="img"
          viewBox="0 0 245 282"
          width="245"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Security Shield Accent</title>
          <g filter="url(#filter0_dddd_2_33)">
            <path
              clipRule="evenodd"
              d="M113.664 7.33065C116.025 5.21236 119.082 4.04126 122.25 4.04126C125.418 4.04126 128.475 5.21236 130.836 7.33065C154.045 28.2076 183.028 41.5233 213.948 45.5151C216.984 45.9065 219.781 47.3695 221.839 49.6419C223.897 51.9144 225.081 54.8476 225.178 57.916C226.339 92.0322 217.849 125.781 200.689 155.261C183.529 184.74 158.4 208.746 128.209 224.501C126.368 225.462 124.323 225.962 122.248 225.959C120.173 225.956 118.13 225.45 116.291 224.484C86.0997 208.728 60.971 184.723 43.811 155.244C26.6511 125.764 18.1608 92.015 19.322 57.8988C19.4235 54.8334 20.6091 51.9043 22.6666 49.6354C24.7242 47.3665 27.5195 45.906 30.5524 45.5151C61.4706 41.5281 90.4531 28.2186 113.664 7.34787V7.33065Z"
              fillRule="evenodd"
            />
          </g>
        </svg>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
        <svg
          aria-label="Lock Icon"
          className="fill-background"
          height="80"
          role="img"
          viewBox="0 0 81 80"
          width="81"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Lock Icon</title>
          <g filter="url(#filter0_iiii_2_34)">
            <path
              clipRule="evenodd"
              d="M20.5 36V28C20.5 22.6957 22.6071 17.6086 26.3579 13.8579C30.1086 10.1071 35.1957 8 40.5 8C45.8043 8 50.8914 10.1071 54.6421 13.8579C58.3929 17.6086 60.5 22.6957 60.5 28V36C62.6217 36 64.6566 36.8429 66.1569 38.3431C67.6571 39.8434 68.5 41.8783 68.5 44V64C68.5 66.1217 67.6571 68.1566 66.1569 69.6569C64.6566 71.1571 62.6217 72 60.5 72H20.5C18.3783 72 16.3434 71.1571 14.8431 69.6569C13.3429 68.1566 12.5 66.1217 12.5 64V44C12.5 41.8783 13.3429 39.8434 14.8431 38.3431C16.3434 36.8429 18.3783 36 20.5 36ZM52.5 28V36H28.5V28C28.5 24.8174 29.7643 21.7652 32.0147 19.5147C34.2652 17.2643 37.3174 16 40.5 16C43.6826 16 46.7348 17.2643 48.9853 19.5147C51.2357 21.7652 52.5 24.8174 52.5 28Z"
              fillRule="evenodd"
            />
          </g>
        </svg>
      </div>
      <motion.div
        animate={{ opacity: 1 }}
        className="size-full"
        initial={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <FlickeringGrid
          className="size-full"
          gridGap={4}
          maxOpacity={0.5}
          squareSize={2}
        />
      </motion.div>
    </div>
  );
}
