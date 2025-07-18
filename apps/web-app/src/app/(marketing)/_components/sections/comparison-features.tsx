'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@unhook/ui/card';
import { BorderBeam } from '@unhook/ui/magicui/border-beam';
import { ShimmerButton } from '@unhook/ui/magicui/shimmer-button';
import { Check, X } from 'lucide-react';
import { motion } from 'motion/react';

interface FeatureItem {
  feature: string;
  unhook: string;
  competitor: string;
  unhookAdvantage: boolean;
}

interface FeatureCategory {
  category: string;
  items: FeatureItem[];
}

interface ComparisonFeaturesProps {
  features: FeatureCategory[];
  competitor: string;
}

export function ComparisonFeatures({
  features,
  competitor,
}: ComparisonFeaturesProps) {
  return (
    <section className="w-full py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Feature Comparison
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            See how Unhook compares to {competitor} across key features and
            capabilities.
          </p>
        </div>

        <div className="space-y-8">
          {features.map((category, categoryIndex) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              key={category.category}
              transition={{ delay: categoryIndex * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <Card className="relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-2">
                <BorderBeam
                  colorFrom="hsl(var(--primary))"
                  colorTo="hsl(var(--primary))"
                  delay={categoryIndex * 2}
                  duration={15}
                  size={200}
                />

                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                  <CardTitle className="text-2xl font-bold text-primary">
                    {category.category}
                  </CardTitle>
                  <CardDescription className="text-base">
                    Compare the key features in this category
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/20">
                          <th className="text-left p-6 font-semibold text-lg">
                            Feature
                          </th>
                          <th className="text-center p-6 font-semibold text-lg">
                            <div className="flex items-center justify-center gap-2">
                              <svg
                                aria-label="Unhook Logo"
                                className="w-5 h-5 text-primary"
                                fill="none"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <title>Unhook Logo</title>
                                <path
                                  d="M12 2L2 8v16c0 8.84 6.11 14.41 14 16 7.89-1.59 14-7.16 14-16V8L12 2z"
                                  fill="currentColor"
                                />
                              </svg>
                              Unhook
                            </div>
                          </th>
                          <th className="text-center p-6 font-semibold text-lg">
                            {competitor}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.items.map((item, itemIndex) => (
                          <motion.tr
                            animate={{ opacity: 1, x: 0 }}
                            className="border-b last:border-b-0 hover:bg-muted/20 transition-colors"
                            initial={{ opacity: 0, x: -20 }}
                            key={item.feature}
                            transition={{
                              delay: categoryIndex * 0.1 + itemIndex * 0.05,
                            }}
                          >
                            <td className="p-6 font-medium text-lg">
                              {item.feature}
                            </td>
                            <td className="p-6 text-center">
                              <div
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                                  item.unhookAdvantage
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                }`}
                              >
                                {item.unhookAdvantage && (
                                  <Check className="w-4 h-4" />
                                )}
                                {item.unhook}
                              </div>
                            </td>
                            <td className="p-6 text-center">
                              <div
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                                  !item.unhookAdvantage
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800'
                                }`}
                              >
                                {item.unhookAdvantage &&
                                  item.competitor !== '✓' && (
                                    <X className="w-4 h-4" />
                                  )}
                                {item.competitor}
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.8 }}
        >
          <ShimmerButton className="px-8 py-3 text-lg font-semibold">
            Try Unhook Free Today
          </ShimmerButton>
        </motion.div>
      </div>
    </section>
  );
}
