'use client';

import React, { useState } from 'react';
import emailjs from '@emailjs/browser';

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState('');

  const handleSendEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus('');

    const formData = new FormData(e.currentTarget);
    const templateParams = {
      name: formData.get('user_name'),
      email: formData.get('user_email'),
      title: formData.get('subject'),
      message: formData.get('message'),
    };

    try {
      // 1. Send Notification to Admin (Skyship Logistics)
      await emailjs.send(
        'service_ldkowmp', 
        'template_piekyck', 
        templateParams, 
        '_SrHHxPIUy05AU7dn'
      );

      // 2. Send Auto-Reply to Customer
      await emailjs.send(
        'service_ldkowmp', 
        'template_hn537xj', 
        templateParams, 
        '_SrHHxPIUy05AU7dn'
      );

      setStatus('Success! Your message has been sent and a confirmation email is on its way.');
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('EmailJS Error:', error);
      setStatus('Oops! Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="max-w-2xl mx-auto p-6 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl">
      <form onSubmit={handleSendEmail} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-white">Full Name</label>
          <input 
            name="user_name" 
            type="text" 
            required 
            className="w-full p-3 rounded-lg bg-black/20 border border-white/10 focus:border-[#9DC400] outline-none transition text-white placeholder-white/50" 
            placeholder="John Doe" 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-white">Email Address</label>
          <input 
            name="user_email" 
            type="email" 
            required 
            className="w-full p-3 rounded-lg bg-black/20 border border-white/10 focus:border-[#9DC400] outline-none transition text-white placeholder-white/50" 
            placeholder="john@example.com" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-white">Subject</label>
          <input 
            name="subject" 
            type="text" 
            required 
            className="w-full p-3 rounded-lg bg-black/20 border border-white/10 focus:border-[#9DC400] outline-none transition text-white placeholder-white/50" 
            placeholder="Shipping Inquiry" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-white">Message</label>
          <textarea 
            name="message" 
            required 
            className="w-full p-3 h-32 rounded-lg bg-black/20 border border-white/10 focus:border-[#9DC400] outline-none transition text-white placeholder-white/50" 
            placeholder="Tell us more about your logistics needs..." 
          />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full py-3 px-6 rounded-lg bg-[#9DC400] hover:bg-[#8AB300] font-bold text-[#001f3f] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Processing...' : 'Send Message'}
        </button>

        {status && (
          <p className={`mt-4 text-center text-sm font-semibold ${status.includes('Success') ? 'text-[#9DC400]' : 'text-red-400'}`}>
            {status}
          </p>
        )}
      </form>
    </section>
  );
}
