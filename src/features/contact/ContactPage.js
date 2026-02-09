import React, { useState } from 'react';
import { Input } from '../../shared/ui/input';
import { Textarea } from '../../shared/ui/textarea';
import { Button } from '../../shared/ui/button';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      // EmailJS integration will go here
      console.log('Form submitted:', formData);
      setSubmitStatus('success');
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === 'success') {
    return (
      <div className="bg-green-50 text-green-800 p-4 rounded-md mb-4 border border-green-200" role="alert">
        <h2 className="font-semibold text-lg mb-1">Message Sent!</h2>
        <p>Thanks for reaching out. We'll get back to you soon.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => setSubmitStatus(null)}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Your Name <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <Input
          id="name"
          type="text"
          name="name"
          placeholder="e.g. Jane Doe"
          value={formData.name}
          onChange={handleChange}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Your Email <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <Input
          id="email"
          type="email"
          name="email"
          placeholder="e.g. jane@example.com"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="message" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Your Message <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <Textarea
          id="message"
          name="message"
          placeholder="How can we help you?"
          value={formData.message}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          className="min-h-[120px]"
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? (
          <>
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
            Sending...
          </>
        ) : 'Send Message'}
      </Button>

      {submitStatus === 'error' && (
        <p className="text-sm text-red-500 mt-2" role="alert">
          Something went wrong. Please try again.
        </p>
      )}
    </form>
  );
};

const Contact = () => {
  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
      <ContactForm />
    </div>
  );
};

export default Contact;
