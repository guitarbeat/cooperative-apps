import React, { useState, useMemo } from 'react';
import { SearchInput } from '../../shared/ui/search-input';
import ResourceList from './ResourceList';

const resources = [
  {
    id: 1,
    title: 'Community Gardening Guide',
    description: 'A comprehensive guide to starting a community garden.',
    category: 'Gardening',
  },
  {
    id: 2,
    title: 'Conflict Resolution Workbook',
    description: 'A workbook for resolving conflicts peacefully.',
    category: 'Conflict Resolution',
  },
  {
    id: 3,
    title: 'Cooperative Bylaws Template',
    description: 'A template for creating cooperative bylaws.',
    category: 'Legal',
  },
];

const Resources = () => {
  const [filter, setFilter] = useState('');

  // Bolt: Memoize filtered resources to prevent unnecessary recalculations
  const filteredResources = useMemo(() => {
    return resources.filter(resource =>
      resource.title.toLowerCase().includes(filter.toLowerCase())
    );
  }, [filter]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Resource Library</h1>
      <SearchInput
        onSearch={setFilter}
        placeholder="Search for resources..."
        aria-label="Search resources"
      />
      <ResourceList resources={filteredResources} />
    </div>
  );
};

export default Resources;
