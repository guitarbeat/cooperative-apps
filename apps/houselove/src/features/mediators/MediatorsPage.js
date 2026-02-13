import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../shared/ui/card';
import { Button } from '../../shared/ui/button';
import { SearchInput } from '../../shared/ui/search-input';

// Bolt: Move static data outside component to prevent reallocation on every render
const mediators = [
  {
    id: 1,
    name: 'John Doe',
    description: 'Experienced in community conflict resolution.',
    contact: 'john.doe@example.com',
  },
  {
    id: 2,
    name: 'Jane Smith',
    description: 'Specializes in housing and resource disputes.',
    contact: 'jane.smith@example.com',
  },
];

const MailIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
)

// Bolt: Extract list to memoized component to prevent re-renders on parent updates
const MediatorList = React.memo(({ items }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12" role="status">
        <p className="text-lg font-medium text-muted-foreground">No mediators found</p>
        <p className="text-sm text-muted-foreground mt-1">Try adjusting your search terms</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((mediator) => (
        <Card key={mediator.id}>
          <CardHeader>
            <CardTitle>{mediator.name}</CardTitle>
            <CardDescription>{mediator.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
              <a href={`mailto:${mediator.contact}`} aria-label={`Contact ${mediator.name}`}>
                <MailIcon className="mr-2 h-4 w-4" />
                Contact
              </a>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

MediatorList.displayName = 'MediatorList';

const Mediators = () => {
  const [filter, setFilter] = useState('');

  const filteredMediators = useMemo(() => {
    return mediators.filter(mediator =>
      mediator.name.toLowerCase().includes(filter.toLowerCase()) ||
      mediator.description.toLowerCase().includes(filter.toLowerCase())
    );
  }, [filter]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Mediator Directory</h1>
      <SearchInput
        onSearch={setFilter}
        placeholder="Search mediators..."
        aria-label="Search mediators"
      />
      <MediatorList items={filteredMediators} />
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Find a Mediator Near You</h2>
        <div className="w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-md border border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-center p-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-12 w-12 text-muted-foreground mb-4 opacity-50"
            aria-hidden="true"
          >
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
            <line x1="9" x2="9" y1="3" y2="18" />
            <line x1="15" x2="15" y1="6" y2="21" />
          </svg>
          <h3 className="text-lg font-semibold mb-2">Map View Coming Soon</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            We're working on an interactive map to help you find mediators in your neighborhood.
          </p>
          <Button variant="outline" disabled aria-label="Notification feature coming soon">
            Notify me when available
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Mediators;
