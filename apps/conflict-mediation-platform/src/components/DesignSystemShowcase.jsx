import React from 'react';

const DesignSystemShowcase = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-display-3xl text-primary-700 mb-6">
            Enhanced Design System
          </h1>
          <p className="text-body-lg text-muted-foreground max-w-3xl mx-auto">
            A comprehensive, accessible, and systematic approach to building beautiful user interfaces with perfect visual hierarchy, typography, and component standards.
          </p>
        </div>

        {/* Typography Section */}
        <section className="mb-16">
          <h2 className="text-display-xl text-foreground mb-8">Typography System</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Display Text */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-heading-lg">Display Text</h3>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <p className="text-display-3xl text-primary-600">Display 3XL</p>
                  <p className="text-body-sm text-muted-foreground">46px • Bold • Tight line-height • Tight letter-spacing</p>
                </div>
                <div>
                  <p className="text-display-2xl text-primary-600">Display 2XL</p>
                  <p className="text-body-sm text-muted-foreground">37px • Bold • Tight line-height • Tight letter-spacing</p>
                </div>
                <div>
                  <p className="text-display-xl text-primary-600">Display XL</p>
                  <p className="text-body-sm text-muted-foreground">30px • Bold • Tight line-height • Tight letter-spacing</p>
                </div>
              </div>
            </div>

            {/* Headings */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-heading-lg">Headings</h3>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <p className="text-heading-lg text-foreground">Heading Large</p>
                  <p className="text-body-sm text-muted-foreground">24px • Semibold • Tight line-height • Tight letter-spacing</p>
                </div>
                <div>
                  <p className="text-heading-md text-foreground">Heading Medium</p>
                  <p className="text-body-sm text-muted-foreground">18px • Semibold • Tight line-height • Tight letter-spacing</p>
                </div>
                <div>
                  <p className="text-heading-sm text-foreground">Heading Small</p>
                  <p className="text-body-sm text-muted-foreground">15px • Semibold • Tight line-height • Tight letter-spacing</p>
                </div>
              </div>
            </div>
          </div>

          {/* Body Text */}
          <div className="card mt-8">
            <div className="card-header">
              <h3 className="text-heading-lg">Body Text</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-body-lg text-foreground mb-2">Body Large</p>
                  <p className="text-body-sm text-muted-foreground">18px • Regular • Relaxed line-height • Natural letter-spacing</p>
                  <p className="text-body-lg text-muted-foreground mt-2">
                    This is body large text used for primary content and main reading material. It provides excellent readability with comfortable line spacing.
                  </p>
                </div>
                <div>
                  <p className="text-body-md text-foreground mb-2">Body Medium</p>
                  <p className="text-body-sm text-muted-foreground">15px • Regular • Relaxed line-height • Natural letter-spacing</p>
                  <p className="text-body-md text-muted-foreground mt-2">
                    Body medium text is perfect for secondary content, descriptions, and supporting information that needs to be easily scannable.
                  </p>
                </div>
                <div>
                  <p className="text-body-sm text-foreground mb-2">Body Small</p>
                  <p className="text-body-sm text-muted-foreground">12px • Regular • Relaxed line-height • Natural letter-spacing</p>
                  <p className="text-body-sm text-muted-foreground mt-2">
                    Small body text works well for captions, helper text, and supplementary information that doesn't require primary attention.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Color System Section */}
        <section className="mb-16">
          <h2 className="text-display-xl text-foreground mb-8">Color System</h2>
          
          {/* Primary Colors */}
          <div className="card mb-8">
            <div className="card-header">
              <h3 className="text-heading-lg">Primary Color Palette</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                  <div key={shade} className="text-center">
                    <div 
                      className="w-16 h-16 rounded-lg mx-auto mb-2 border border-border"
                      style={{ backgroundColor: `var(--primary-${shade})` }}
                    ></div>
                    <p className="text-ui-sm font-medium">Primary {shade}</p>
                    <p className="text-body-sm text-muted-foreground">--primary-{shade}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Semantic Colors */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-heading-lg">Semantic Colors</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-success-500 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <span className="text-white text-2xl">✓</span>
                  </div>
                  <h4 className="text-heading-md text-success-700 mb-2">Success</h4>
                  <p className="text-body-sm text-muted-foreground">Used for positive actions, confirmations, and successful states</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-warning-500 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <span className="text-white text-2xl">⚠</span>
                  </div>
                  <h4 className="text-heading-md text-warning-700 mb-2">Warning</h4>
                  <p className="text-body-sm text-muted-foreground">Used for cautionary messages and non-critical alerts</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-error-500 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <span className="text-white text-2xl">✕</span>
                  </div>
                  <h4 className="text-heading-md text-error-700 mb-2">Error</h4>
                  <p className="text-body-sm text-muted-foreground">Used for error states, destructive actions, and critical alerts</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Component System Section */}
        <section className="mb-16">
          <h2 className="text-display-xl text-foreground mb-8">Component System</h2>
          
          {/* Buttons */}
          <div className="card mb-8">
            <div className="card-header">
              <h3 className="text-heading-lg">Button System</h3>
            </div>
            <div className="card-body">
              <div className="space-y-6">
                {/* Button Sizes */}
                <div>
                  <h4 className="text-heading-md mb-4">Button Sizes</h4>
                  <div className="flex flex-wrap gap-4 items-center">
                    <button className="btn btn-primary btn-sm">Small Button</button>
                    <button className="btn btn-primary btn-md">Medium Button</button>
                    <button className="btn btn-primary btn-lg">Large Button</button>
                  </div>
                </div>

                {/* Button Variants */}
                <div>
                  <h4 className="text-heading-md mb-4">Button Variants</h4>
                  <div className="flex flex-wrap gap-4 items-center">
                    <button className="btn btn-primary btn-md">Primary</button>
                    <button className="btn btn-secondary btn-md">Secondary</button>
                    <button className="btn btn-outline btn-md">Outline</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Elements */}
          <div className="card mb-8">
            <div className="card-header">
              <h3 className="text-heading-lg">Form Elements</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Input Sizes */}
                <div>
                  <h4 className="text-heading-md mb-4">Input Sizes</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="form-label">Small Input</label>
                      <input type="text" className="input input-sm" placeholder="Small input field" />
                    </div>
                    <div>
                      <label className="form-label">Medium Input</label>
                      <input type="text" className="input input-md" placeholder="Medium input field" />
                    </div>
                    <div>
                      <label className="form-label">Large Input</label>
                      <input type="text" className="input input-lg" placeholder="Large input field" />
                    </div>
                  </div>
                </div>

                {/* Input States */}
                <div>
                  <h4 className="text-heading-md mb-4">Input States</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="form-label">Default State</label>
                      <input type="text" className="input input-md" placeholder="Default input" />
                    </div>
                    <div>
                      <label className="form-label">Focus State</label>
                      <input type="text" className="input input-md focus:ring-2 focus:ring-primary-500" placeholder="Focus to see effect" />
                    </div>
                    <div>
                      <label className="form-label">Error State</label>
                      <input type="text" className="input input-md border-error-500" placeholder="Error input" />
                      <p className="text-body-sm text-error-600 mt-1">This field is required</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-heading-lg">Card System</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card hover-lift">
                  <div className="card-body">
                    <h4 className="text-heading-md mb-2">Default Card</h4>
                    <p className="text-body-md text-muted-foreground">A standard card with subtle shadows and hover effects.</p>
                  </div>
                </div>
                <div className="card hover-scale">
                  <div className="card-body">
                    <h4 className="text-heading-md mb-2">Interactive Card</h4>
                    <p className="text-body-md text-muted-foreground">This card scales slightly on hover for enhanced interactivity.</p>
                  </div>
                </div>
                <div className="card hover-glow">
                  <div className="card-body">
                    <h4 className="text-heading-md mb-2">Glow Card</h4>
                    <p className="text-body-md text-muted-foreground">A card with a subtle glow effect on hover for emphasis.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Spacing System Section */}
        <section className="mb-16">
          <h2 className="text-display-xl text-foreground mb-8">Spacing System</h2>
          
          <div className="card">
            <div className="card-header">
              <h3 className="text-heading-lg">Spacing Scale (4px Base Unit)</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {[
                  { name: '4px', class: 'space-1', size: 'var(--space-1)' },
                  { name: '8px', class: 'space-2', size: 'var(--space-2)' },
                  { name: '12px', class: 'space-3', size: 'var(--space-3)' },
                  { name: '16px', class: 'space-4', size: 'var(--space-4)' },
                  { name: '24px', class: 'space-6', size: 'var(--space-6)' },
                  { name: '32px', class: 'space-8', size: 'var(--space-8)' },
                  { name: '48px', class: 'space-12', size: 'var(--space-12)' },
                  { name: '64px', class: 'space-16', size: 'var(--space-16)' }
                ].map((item) => (
                  <div key={item.name} className="flex items-center gap-4">
                    <div className="w-20 text-ui-sm font-medium">{item.name}</div>
                    <div className="flex-1">
                      <div 
                        className="bg-primary-200 rounded"
                        style={{ 
                          height: item.size,
                          width: item.size 
                        }}
                      ></div>
                    </div>
                    <div className="w-24 text-ui-sm text-muted-foreground">{item.class}</div>
                    <div className="w-20 text-ui-sm text-muted-foreground">{item.size}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Accessibility Section */}
        <section className="mb-16">
          <h2 className="text-display-xl text-foreground mb-8">Accessibility Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card">
              <div className="card-header">
                <h3 className="text-heading-lg">Focus Management</h3>
              </div>
              <div className="card-body">
                <p className="text-body-md mb-4">
                  All interactive elements have clear focus indicators that meet WCAG standards.
                </p>
                <div className="space-y-3">
                  <button className="btn btn-primary btn-md">Focus Me</button>
                  <button className="btn btn-secondary btn-md">Focus Me Too</button>
                  <button className="btn btn-outline btn-md">And Me</button>
                </div>
                <p className="text-body-sm text-muted-foreground mt-4">
                  Use Tab key to navigate and see focus indicators.
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="text-heading-lg">Color Contrast</h3>
              </div>
              <div className="card-body">
                <p className="text-body-md mb-4">
                  All color combinations meet WCAG AA compliance (4.5:1 minimum contrast).
                </p>
                <div className="space-y-2">
                  <div className="p-3 bg-primary-600 text-white rounded">
                    <span className="text-ui-md font-medium">Primary Text on Primary Background</span>
                  </div>
                  <div className="p-3 bg-secondary-100 text-secondary-800 rounded">
                    <span className="text-ui-md font-medium">Secondary Text on Secondary Background</span>
                  </div>
                  <div className="p-3 bg-success-500 text-white rounded">
                    <span className="text-ui-md font-medium">Success Text on Success Background</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Implementation Notes */}
        <section className="mb-16">
          <div className="card bg-primary-50 border-primary-200">
            <div className="card-body">
              <h3 className="text-heading-lg text-primary-800 mb-4">Implementation Notes</h3>
              <div className="text-body-md text-primary-700 space-y-2">
                <p>• This design system is built on a 4px base unit for consistent spacing</p>
                <p>• Typography uses a 1.25 ratio scale for harmonious proportions</p>
                <p>• All colors are WCAG AA compliant with proper contrast ratios</p>
                <p>• Components follow consistent sizing and spacing patterns</p>
                <p>• Dark mode support with appropriate color inversions</p>
                <p>• Accessibility features include focus management and reduced motion support</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default DesignSystemShowcase;