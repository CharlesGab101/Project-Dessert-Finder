import { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Form, Button, Card, Row, Col } from 'react-bootstrap';

function App() {
  const [location, setLocation] = useState('Fullerton, CA');
  const [category, setCategory] = useState('');
  const [results, setResults] = useState([]);
  const [sortType, setSortType] = useState('none');

  useEffect(() => {
    if (location) {
      searchDesserts();
    }
  }, []);

  const searchDesserts = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/yelp/desserts`, {
        params: { location, term: category }
      });
      setResults(res.data.businesses);
    } catch (err) {
      console.error('API error:', err);
    }
  };

  const handleSortChange = (e) => {
    const newType = e.target.value;
    setSortType(newType);
    if (newType === 'none') return;
    const sorted = sortResults(results, newType);
    setResults(sorted);
  };

  const sortResults = (businesses, type) => {
    if (!businesses) return [];
    if (type === 'rating') {
      return [...businesses].sort((a, b) => b.rating - a.rating);
    } else if (type === 'price') {
      const priceToNum = (p) => (p || '').length;
      return [...businesses].sort((a, b) => priceToNum(a.price) - priceToNum(b.price));
    } else {
      return businesses;
    }
  };

  return (
    <div className="App">
      <div className="content-wrapper">
        <Container className="py-4">
          <h1 className="text-center mb-4">🍰 Dessert Finder</h1>

          <Form onSubmit={(e) => { e.preventDefault(); searchDesserts(); }}>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Control
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter a city or ZIP code"
                />
              </Col>
              <Col md={4}>
                <Form.Select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">All Desserts</option>
                  <option value="ice cream">Ice Cream</option>
                  <option value="cupcakes">Cupcakes</option>
                  <option value="donuts">Donuts</option>
                  <option value="cakes">Cakes</option>
                  <option value="boba">Boba</option>
                  <option value="frozen yogurt">Frozen Yogurt</option>
                  <option value="bakery">Bakery</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Button variant="primary" type="submit" className="w-100">
                  Search
                </Button>
              </Col>
            </Row>
            <Row className="mb-4">
              <Col sm={4}>
                <Form.Select value={sortType} onChange={handleSortChange}>
                  <option value="none">Sort by...</option>
                  <option value="rating">Rating (high → low)</option>
                  <option value="price">Price ($ → $$$$)</option>
                </Form.Select>
              </Col>
            </Row>
          </Form>

          <Row className="gy-4">
            {results.map((biz, index) => (
              <Col xs={12} key={biz.id}>
                <Card className="d-flex flex-row p-3 shadow-sm">
                  <Card.Img
                    src={biz.image_url}
                    alt={biz.name}
                    style={{
                      width: '160px',
                      height: '160px',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                  <Card.Body className="d-flex flex-column justify-content-between ms-3">
                    <div>
                      <h5 className="mb-1">
                        {index + 1}. <a href={biz.url} target="_blank" rel="noreferrer" className="text-decoration-none">{biz.name}</a>
                      </h5>
                      <p className="mb-1">
                        ⭐ <strong>{biz.rating}</strong> ({biz.review_count} reviews) &nbsp;
                        <span className="text-muted">{biz.price || '$$'} • {biz.categories?.[0]?.title}</span>
                      </p>
                      <p className="text-success fw-semibold mb-2">
                        {biz.hours?.[0]?.is_open_now ? 'Open now' : ''}
                      </p>
                      <p className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>
                        {biz.location.address1}, {biz.location.city}, {biz.location.state}
                      </p>
                    </div>
                    <div className="mt-2">
                      {biz.categories.slice(0, 3).map(tag => (
                        <span key={tag.alias} className="badge bg-light text-dark border me-2">
                          {tag.title}
                        </span>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </div>
    </div>
  );
}

export default App;
