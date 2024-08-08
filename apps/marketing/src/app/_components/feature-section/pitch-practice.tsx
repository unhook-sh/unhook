"use client";

import { CheckCircle } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Progress } from "@acme/ui/progress";

const feedbackData = [
  {
    question: "Can you tell me about your team’s background?",
    response:
      "Our team consists of industry veterans with over 20 years of combined experience in AI and software development.",
    score: 85,
  },
  {
    question: "What problem are you solving, and why is it important?",
    response:
      "We are solving the inefficiency in investor deal flow management, which is crucial for making timely and informed investment decisions.",
    score: 88,
  },
  {
    question: "How does your solution stand out from the competition?",
    response:
      "Our AI-driven platform uniquely integrates data from multiple sources to provide comprehensive insights and predictive analytics.",
    score: 90,
  },
  {
    question: "What is the size of your target market?",
    response:
      "The target market size is over $10 billion, with a significant growth potential as more firms adopt AI technologies.",
    score: 80,
  },
  {
    question: "Can you walk me through your financial projections?",
    response:
      "We project a 150% year-over-year growth with a break-even point reached within the first 18 months of operation.",
    score: 92,
  },
];

export function PitchPractice() {
  return (
    <Card>
      <CardHeader className="items-center pb-4">
        <CardTitle>AI Pitch Practice</CardTitle>
        <CardDescription>
          Simulate a back-and-forth conversation with an investor
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <span className="text-lg font-medium">Sample Investor Q&A</span>
          </div>
          <div className="flex flex-col gap-4">
            {feedbackData.map((item, index) => (
              <div key={index} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span>{item.question}</span>
                  <span className="font-bold">{item.score}%</span>
                </div>
                <Progress value={item.score} className="w-full" />
                <div>
                  <strong>Your Response:</strong> {item.response}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={() => window.location.reload()}
          className="bg-red-500 text-white"
        >
          Try Again
        </Button>
      </CardFooter>
    </Card>
  );
}
