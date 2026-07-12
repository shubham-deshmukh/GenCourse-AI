import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CTA from '../CTA';
import PricingPlans from '../PricingPlans';
import Workflow from '../Workflow';
import Hero from '../Hero';
import Features from '../Features';
import Footer from '../Footer';

// Enable jsdom environment for this component test file
// @vitest-environment jsdom

describe('Landing Page Components', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Mock window.location to capture redirect hrefs
    delete (window as any).location;
    (window as any).location = {
      href: '',
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
    } as any;

    // Mock localStorage
    (globalThis as any).localStorage = {
      removeItem: vi.fn(),
      setItem: vi.fn(),
      getItem: vi.fn(),
    };
  });

  afterEach(() => {
    (window as any).location = originalLocation;
  });

  describe('CTA Component', () => {
    test('renders title, description, and link features', () => {
      render(<CTA />);
      expect(screen.getByText(/Ready to Build Your Structured Learning Experience/i)).toBeInTheDocument();
      expect(screen.getByText(/Explore Tech Features/i)).toBeInTheDocument();
    });

    test('clears mock mode and redirects to signup page on Create Free Account click', () => {
      render(<CTA />);
      const createAccBtn = screen.getByText('Create Free Account');
      fireEvent.click(createAccBtn);

      expect(localStorage.removeItem).toHaveBeenCalledWith('gencourse_mock_mode');
      expect(window.location.href).toContain('/auth/login?screen_hint=signup');
    });
  });

  describe('PricingPlans Component', () => {
    test('renders three price plans correctly', () => {
      render(<PricingPlans />);
      expect(screen.getByText('Free Starter')).toBeInTheDocument();
      expect(screen.getByText('Premium Educator')).toBeInTheDocument();
      expect(screen.getByText('Academy Enterprise')).toBeInTheDocument();
    });

    test('clears mock mode and triggers location redirect on select plan click', () => {
      render(<PricingPlans />);
      const selectPremiumBtn = screen.getByText('Upgrade to Premium');
      fireEvent.click(selectPremiumBtn);

      expect(localStorage.removeItem).toHaveBeenCalledWith('gencourse_mock_mode');
      expect(window.location.assign).toHaveBeenCalled();
      const calledUrl = (window.location.assign as any).mock.calls[0][0];
      expect(calledUrl).toContain('/auth/login?plan=premium');
    });
  });

  describe('Workflow Component', () => {
    test('renders title and pipeline steps', () => {
      render(<Workflow />);
      expect(screen.getByText('How The Course Engine Works')).toBeInTheDocument();
      expect(screen.getByText('1. Topic Analyzer')).toBeInTheDocument();
      expect(screen.getByText('5. Publishing Layer')).toBeInTheDocument();
      expect(screen.getByText('Directed Acyclic Learning Graphs')).toBeInTheDocument();
    });
  });

  describe('Hero Component', () => {
    test('renders hero layout and main headers', () => {
      render(<Hero prompt="" setPrompt={() => {}} onGenerate={() => {}} />);
      expect(screen.getByText(/Transform Any Topic Into a/i)).toBeInTheDocument();
      expect(screen.getByText(/Structured Online Course/i)).toBeInTheDocument();
    });
  });

  describe('Features Component', () => {
    test('renders layout and details cards', () => {
      render(<Features />);
      expect(screen.getByText('Intelligent Compilation Features')).toBeInTheDocument();
      expect(screen.getByText('Contextual AI Tutor')).toBeInTheDocument();
      expect(screen.getByText('LMS Content Scaffolding')).toBeInTheDocument();
    });
  });

  describe('Footer Component', () => {
    test('renders branding details and copyright', () => {
      render(<Footer />);
      expect(screen.getByText(/Agentic content compiler/i)).toBeInTheDocument();
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`© ${currentYear} GenCourse AI`, 'i'))).toBeInTheDocument();
    });
  });
});
