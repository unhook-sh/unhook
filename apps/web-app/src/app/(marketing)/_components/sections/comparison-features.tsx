'use client';

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

        <div className="space-y-12">
          {features.map((category, categoryIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
              viewport={{ once: true }}
              className="bg-card border rounded-lg overflow-hidden"
            >
              <div className="bg-muted/50 px-6 py-4 border-b">
                <h3 className="text-xl font-semibold">{category.category}</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Feature</th>
                      <th className="text-center p-4 font-medium">Unhook</th>
                      <th className="text-center p-4 font-medium">
                        {competitor}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {category.items.map((item) => (
                      <tr
                        key={item.feature}
                        className="border-b last:border-b-0 hover:bg-muted/30"
                      >
                        <td className="p-4 font-medium">{item.feature}</td>
                        <td className="p-4 text-center">
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                              item.unhookAdvantage
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                            }`}
                          >
                            {item.unhookAdvantage && (
                              <Check className="w-4 h-4" />
                            )}
                            {item.unhook}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                              !item.unhookAdvantage
                                ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {item.unhookAdvantage &&
                              item.competitor !== '✓' && (
                                <X className="w-4 h-4" />
                              )}
                            {item.competitor}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
