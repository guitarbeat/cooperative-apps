import React, { useState, useRef, useEffect } from 'react';
import { Input } from '../../shared/ui/input';
import { Textarea } from '../../shared/ui/textarea';
import { Button } from '../../shared/ui/button';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
  const successRef = useRef(null);

  useEffect(() => {
    if (submitStatus === 'success' && successRef.current) {
      successRef.current.focus();
    }
  }, [submitStatus]);

  const validate = (data) => {
    const newErrors = {};
    if (!data.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (data.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!data.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!data.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (data.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    return newErrors;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for the field being edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleBlur = e => {
    const { name, value } = e.target;
    // Sanitize input on blur
    setFormData(prev => ({ ...prev, [name]: value.trim() }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    // Sanitize before validation
    const sanitizedData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      message: formData.message.trim()
    };

    setFormData(sanitizedData);

    const validationErrors = validate(sanitizedData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      // EmailJS integration will go here
      console.log('Form submitted:', sanitizedData);
      setSubmitStatus('success');
      setFormData({ name: '', email: '', message: '' });
      setErrors({});
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === 'success') {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        className="bg-green-50 text-green-800 p-4 rounded-md mb-4 border border-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        role="alert"
      >
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
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
          onBlur={handleBlur}
          required
          disabled={isSubmitting}
          className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && (
          <p id="name-error" className="text-sm text-red-500 mt-1" role="alert">
            {errors.name}
          </p>
        )}
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
          onBlur={handleBlur}
          required
          disabled={isSubmitting}
          className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-red-500 mt-1" role="alert">
            {errors.email}
          </p>
        )}
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
          onBlur={handleBlur}
          required
          disabled={isSubmitting}
          className={`min-h-[120px] ${errors.message ? "border-red-500 focus-visible:ring-red-500" : ""}`}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
        />
        {errors.message && (
          <p id="message-error" className="text-sm text-red-500 mt-1" role="alert">
            {errors.message}
          </p>
        )}
      </div>

      <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? 'Sending...' : 'Send Message'}
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
