import React from 'react';
import { Button } from '../../shared/ui/button';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to House Love</h1>
      <p className="text-lg mb-8">
        Your platform for cooperative community living.
      </p>
      <Button>Get Started</Button>
    </div>
  );
};

export default Home;
