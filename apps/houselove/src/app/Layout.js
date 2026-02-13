import React from 'react';

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-4 border-b">
        {/* Header content will go here */}
      </header>
      <main className="flex-grow p-4">
        {children}
      </main>
      <footer className="p-4 border-t">
        {/* Footer content will go here */}
      </footer>
    </div>
  );
};

export default Layout;
