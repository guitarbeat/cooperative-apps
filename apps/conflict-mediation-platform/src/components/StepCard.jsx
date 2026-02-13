import React from "react";
import { Card, CardContent } from "./ui/card";

const StepCard = ({ children, className = "" }) => {
  return (
    <Card className={`w-full h-auto py-6 sm:py-8 shadow-lg ${className}`}>
      <CardContent className="px-4 sm:px-6 lg:px-8 pb-24 sm:pb-8 lg:pb-10 pt-0 max-h-[calc(100vh-10rem)] sm:max-h-[80vh] overflow-y-auto">
        <div className="fixed-content">{children}</div>
      </CardContent>
    </Card>
  );
};

export default StepCard;
