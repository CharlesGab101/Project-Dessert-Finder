import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';


jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: { businesses: [] } }))
}));

import axios from 'axios';


beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

const sortResults = (businesses, type) => {
  if (!Array.isArray(businesses)) return [];

  if (type === 'rating') {
    return [...businesses].sort((a, b) => b.rating - a.rating);
  } else if (type === 'price') {
    const priceToNum = (p) => (p || '').length;
    return [...businesses].sort((a, b) => priceToNum(a.price) - priceToNum(b.price));
  } else {
    return businesses;
  }
};

describe('App Component', () => {
  test('renders login form and search controls', () => {
    render(<App />);
    expect(screen.getByPlaceholderText(/Username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter a city or ZIP code/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Search/i })).toBeInTheDocument();
  });

  test('login fails with wrong credentials', () => {
    window.alert = jest.fn();
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/Username/i), {
      target: { value: 'invalidUser' }
    });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), {
      target: { value: 'wrongPass' }
    });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    expect(window.alert).toHaveBeenCalledWith('Invalid username or password!');
  });
});

describe('sortResults function', () => {
  const businesses = [
    { id: 1, rating: 3, price: '$$$' },
    { id: 2, rating: 5, price: '$' },
    { id: 3, rating: 4, price: '$$' }
  ];

  test('sorts by rating descending', () => {
    const sorted = sortResults(businesses, 'rating');
    expect(sorted.map(b => b.id)).toEqual([2, 3, 1]);
  });

  test('sorts by price ascending', () => {
    const sorted = sortResults(businesses, 'price');
    expect(sorted.map(b => b.id)).toEqual([2, 3, 1]);
  });

  test('returns original array for unknown sort type', () => {
    const sorted = sortResults(businesses, 'unknown');
    expect(sorted.map(b => b.id)).toEqual([1, 2, 3]);
  });

  test('returns empty array for invalid input', () => {
    expect(sortResults(null, 'rating')).toEqual([]);
    expect(sortResults('not an array', 'price')).toEqual([]);
  });
});

describe('Yelp API Integration', () => {
  test('makes a request to the Yelp API with correct params', async () => {
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText(/Enter a city or ZIP code/i), {
      target: { value: 'Irvine, CA' }
    });
    fireEvent.click(screen.getByRole('button', { name: /Search/i }));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:5001/api/yelp/desserts',
        expect.objectContaining({
          params: expect.objectContaining({
            location: 'Irvine, CA'
          })
        })
      );
    });
  });
});
