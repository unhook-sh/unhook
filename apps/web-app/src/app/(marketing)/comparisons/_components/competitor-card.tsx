'use client';

import { Badge } from '@unhook/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@unhook/ui/card';
import { motion } from 'motion/react';

interface Competitor {
  category: string;
  comparison: string;
  description: string;
  logo: string;
  marketShare: string;
  name: string;
  pricing: string;
  strengths: string[];
  unhookAdvantages: string[];
  weaknesses: string[];
  website: string;
}

interface CompetitorCardProps {
  competitor: Competitor;
  index: number;
}

export function CompetitorCard({ competitor, index }: CompetitorCardProps) {
  // Extract domain from website URL for brandfetch
  const getDomainFromUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain;
    } catch {
      return '';
    }
  };

  const domain = getDomainFromUrl(competitor.website);
  const logoUrl = domain
    ? `https://cdn.brandfetch.io/${domain}/w/400/h/400?c=1idGJK6TyS2PPBb74bA`
    : '';

  return (
    <motion.div
      animate="visible"
      id={competitor.name.toLowerCase()}
      transition={{ delay: index * 0.1 }}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
    >
      <Card className="relative overflow-hidden h-full bg-accent border border-border">
        <CardHeader>
          <div className="flex items-center gap-4 mb-4">
            {logoUrl ? (
              <a
                className="block hover:opacity-80 transition-opacity"
                href={competitor.website}
                rel="noopener noreferrer"
                target="_blank"
              >
                {/** biome-ignore lint/performance/noImgElement: no need*/}
                <img
                  alt={`${competitor.name} logo`}
                  className="rounded-lg"
                  height={48}
                  src={logoUrl}
                  width={48}
                />
              </a>
            ) : (
              <span className="text-4xl">{competitor.logo}</span>
            )}
            <div>
              <CardTitle className="text-xl">{competitor.name}</CardTitle>
              <CardDescription>{competitor.category}</CardDescription>
            </div>
            <Badge className="ml-auto" variant="secondary">
              {competitor.marketShare} Usage
            </Badge>
          </div>
          <p className="text-muted-foreground">{competitor.description}</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="font-medium">Starting Price:</span>
            <span className="text-primary font-semibold">
              {competitor.pricing}
            </span>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-primary">
              Why Teams Choose Unhook:
            </h4>
            <ul className="space-y-2">
              {competitor.unhookAdvantages.map((advantage) => (
                <li className="flex items-center gap-2 text-sm" key={advantage}>
                  <div className="size-5 rounded-full border flex items-center justify-center bg-secondary/50 border-border">
                    <div className="size-3 flex items-center justify-center">
                      <svg
                        className="block dark:hidden"
                        fill="none"
                        height="7"
                        viewBox="0 0 8 7"
                        width="8"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <title>Checkmark Icon</title>
                        <path
                          d="M1.5 3.48828L3.375 5.36328L6.5 0.988281"
                          stroke="#101828"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                        />
                      </svg>
                      <svg
                        className="hidden dark:block"
                        fill="none"
                        height="7"
                        viewBox="0 0 8 7"
                        width="8"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <title>Checkmark Icon</title>
                        <path
                          d="M1.5 3.48828L3.375 5.36328L6.5 0.988281"
                          stroke="#FAFAFA"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>
                  </div>
                  {advantage}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium mb-2 text-primary">Strengths:</h5>
              <ul className="space-y-1">
                {competitor.strengths.map((strength) => (
                  <li className="text-sm text-muted-foreground" key={strength}>
                    • {strength}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-2 text-muted-foreground">
                Limitations:
              </h5>
              <ul className="space-y-1">
                {competitor.weaknesses.map((weakness) => (
                  <li className="text-sm text-muted-foreground" key={weakness}>
                    • {weakness}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
