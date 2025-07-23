'use client';

import { useOrganizationList } from '@clerk/nextjs';
import { motion } from 'motion/react';
import Image from 'next/image';
import { useEffect } from 'react';

export function SetActiveAndRedirect(props: { redirectTo: string }) {
  const { setActive, userMemberships } = useOrganizationList({
    userMemberships: true,
  });

  useEffect(() => {
    (async () => {
      if (!userMemberships || userMemberships.count === 0) {
        console.log('No organization found');
        return null;
      }

      const firstOrganization = userMemberships.data?.[0];

      if (!firstOrganization) {
        console.log('No organization found');
        return null;
      }

      console.log(
        'Setting active organization',
        firstOrganization.organization.id,
      );
      await setActive?.({ organization: firstOrganization.organization.id });

      console.log('Redirecting to', props.redirectTo);

      window.location.href = props.redirectTo;
    })();
  }, [
    setActive,
    userMemberships.data,
    props.redirectTo,
    userMemberships.count,
    userMemberships,
  ]);

  return (
    <main className="container grid min-h-screen place-items-center mx-auto">
      <motion.div
        animate="visible"
        className="flex w-full max-w-[32rem] flex-col items-center gap-8"
        initial="hidden"
        variants={{
          hidden: {
            opacity: 0,
            y: 20,
          },
          visible: {
            opacity: 1,
            transition: {
              duration: 0.6,
              ease: 'easeOut',
              staggerChildren: 0.2,
            },
            y: 0,
          },
        }}
      >
        <motion.div
          className="flex items-center flex-col"
          variants={{
            hidden: {
              opacity: 0,
              scale: 0.9,
              y: 20,
            },
            visible: {
              opacity: 1,
              scale: 1,
              transition: {
                duration: 0.5,
                ease: 'easeOut',
              },
              y: 0,
            },
          }}
        >
          <motion.div
            animate={['visible', 'loading']}
            className="relative"
            initial="hidden"
            variants={{
              hidden: {
                opacity: 0,
                rotate: -10,
                scale: 0.8,
              },
              loading: {
                rotate: [0, 0, 360, 360, 0],
                // scale: [1, 1.15, 1, 1, 1],
                transition: {
                  duration: 4,
                  ease: 'easeInOut',
                  repeat: Number.POSITIVE_INFINITY,
                  times: [0, 0.25, 0.75, 0.9, 1],
                },
              },
              visible: {
                opacity: 1,
                rotate: 0,
                scale: 1,
                transition: {
                  duration: 0.8,
                  ease: [0.6, -0.05, 0.01, 0.99],
                },
              },
            }}
          >
            <Image
              alt="Unhook Logo"
              className="h-32 w-auto"
              height={128}
              priority
              src="/logo.svg"
              width={120}
            />
          </motion.div>
          <motion.div
            className="text-2xl font-bold mt-4"
            variants={{
              hidden: {
                opacity: 0,
                y: 10,
              },
              visible: {
                opacity: 1,
                transition: {
                  duration: 0.5,
                  ease: 'easeOut',
                },
                y: 0,
              },
            }}
          >
            Welcome to Unhook
          </motion.div>
        </motion.div>

        <motion.div
          className="flex items-center gap-1 text-muted-foreground"
          variants={{
            hidden: {
              opacity: 0,
              scale: 0.9,
              y: 20,
            },
            visible: {
              opacity: 1,
              scale: 1,
              transition: {
                duration: 0.5,
                ease: 'easeOut',
              },
              y: 0,
            },
          }}
        >
          <span className="text-sm">Setting up your workspace</span>
          <motion.div
            animate="loading"
            className="flex gap-1 ml-1"
            variants={{
              loading: {
                transition: {
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: 'loop',
                  staggerChildren: 0.2,
                },
              },
            }}
          >
            {[0, 1, 2].map((index) => (
              <motion.div
                className="w-1 h-1 bg-current rounded-full"
                key={index}
                variants={{
                  loading: {
                    opacity: [0.4, 1, 0.4],
                    transition: {
                      duration: 0.8,
                      ease: 'easeInOut',
                      repeat: Number.POSITIVE_INFINITY,
                    },
                    y: [0, -10, 0],
                  },
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    </main>
  );
}
