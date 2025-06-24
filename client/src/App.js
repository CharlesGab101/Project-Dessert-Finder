import { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Form, Button, Card, Row, Col } from 'react-bootstrap';
import { Navbar, Nav } from 'react-bootstrap';

function App() {
  const [location, setLocation] = useState('Fullerton, CA');
  const [category, setCategory] = useState('');
  const [results, setResults] = useState([]);
  const [sortType, setSortType] = useState('none');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [loggedInUser, setLoggedInUser] = useState(null); // holds who is current logged in user
  const [savedRestaurants, setSavedRestaurants] = useState({});
  const [restaurantRatings, setRestaurantRatings] = useState({});
  const [userRatings, setUserRatings] = useState({});

  const [showSaved, setShowSaved] = useState(false); //turn on and off ui
  const [showsRegistering, setShowIsRegistering] = useState(false); // turn on and off ui
  const [ratingTargetId, setRatingTargetId] = useState(null);  // turn on and off ui

  const [reg_Username, setRegUsername] = useState('');
  const [reg_Password, setRegPassword] = useState('');
  
  useEffect(() => {
    if (location) {
      searchDesserts();
    }
    const storedUser = localStorage.getItem('loggedInUser'); // load the current logged in  user
    const storedData = localStorage.getItem('savedRestaurants'); // load the saved restaurants data
    const storedRating = localStorage.getItem('restaurantRatings'); // load restaurant ratings
    const storedUserRating = localStorage.getItem('userRatings'); //load the list of user's rated restaurants and last ratings
    if (storedUser) {
      setLoggedInUser(storedUser); 
    }
    if (storedData) {
      setSavedRestaurants(JSON.parse(storedData));
    }
    if(storedRating) {
      setRestaurantRatings(JSON.parse(storedRating));
    }
    if(storedUserRating) {
      setUserRatings(JSON.parse(storedUserRating));
    }
  }, []);

  const searchDesserts = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/yelp/desserts`, { // get the data from the /server backend (yelp api)
        params: { location, term: category }
      });
      setResults(res.data.businesses);
    } catch (err) {
      console.error('API error:', err);
    }
  };

  // HANDLE SORT FUNCTION
  const handleSortChange = (e) => {
    const newType = e.target.value;
    setSortType(newType);
    if (newType === 'none') {
      return;
    } 
    const sorted = sortResults(results, newType);
    setResults(sorted);
  };

  //SORT FUNCTION
  const sortResults = (businesses, type) => {
    if (!businesses) return [];
    if (type === 'rating') {
      return [...businesses].sort((a, b) => b.rating - a.rating);// using (copy) ... to avoid mutating the original results data
    } else if (type === 'price') {
      const priceToNum = (p) => (p || '').length;
      return [...businesses].sort((a, b) => priceToNum(a.price) - priceToNum(b.price)); // using (copy) ... to avoid mutating the original results data
    } else {
      return businesses;
    }
  };

  //LOGIN FUNCTION
  const loginHandler = (e) => {
      e.preventDefault();
      const stored_password = localStorage.getItem(username); //retrieve the (value : password) using (key : username)
      if(stored_password && stored_password === password) { //then checks if the same
      setLoggedInUser(username);
      localStorage.setItem('loggedInUser', username);
      setUsername('');
      setPassword('');
      } else {
        alert('Invalid username or password!')
      }
  };

  //REGISTER FUNCTION
  const registerHandler = (e) => {
    e.preventDefault();
    if (reg_Password && reg_Username) {
      const isAlready = localStorage.getItem(reg_Username)
      if (isAlready) {
        alert('Username already exist');
      } else {
        localStorage.setItem(reg_Username, reg_Password);
        alert('Account Successfully Created!');
        setShowIsRegistering(false);
        setRegUsername('');
        setRegPassword('');
        }
      } else {
        alert('Please enter both username and password');
      }
    };

      //AVERAGE HANDLER
      //NOTE: If the user clicks the rating button multiple times this function will prevent the user from exploiting the ratings of each restaurants.
      const ratingSubmitHandler = (biz, new_star) => {
      const restaurantId = biz.id;
      const currentUser = loggedInUser;

      const currentRatings = { ...restaurantRatings };
      const userRatingData = { ...userRatings };
    
      const previousRating = userRatingData[currentUser]?.[restaurantId] || null;
      const restData = currentRatings[restaurantId] || { sum: 0, count: 0, average: 0 };
      
      let updatedSum = restData.sum;
      let updatedCount = restData.count;
      // If the user already rated this restaurant with the same value 
      if (previousRating === new_star) {
        alert('You already rated this restaurant with the same value.');
        return;
      }

      if (previousRating !== null) { //double checks if the previousRating is empty
        updatedSum = updatedSum - previousRating + new_star; //updates the existing rating
      } else { //if the user's first time rating the restaurant
        updatedSum += new_star;
        updatedCount += 1;
      }

      const avg = parseFloat((updatedSum / updatedCount).toFixed(1));
      //update
      const updatedRestaurantRatings = {...currentRatings, [restaurantId]: { sum: updatedSum, count: updatedCount, average: avg} };
      const updatedUserRatings = { ...userRatingData, [currentUser]: {...(userRatingData[currentUser] || {}), [restaurantId]: new_star}};

      setRestaurantRatings(updatedRestaurantRatings);
      setUserRatings(updatedUserRatings);
      localStorage.setItem('restaurantRatings', JSON.stringify(updatedRestaurantRatings));
      localStorage.setItem('userRatings', JSON.stringify(updatedUserRatings));
      setRatingTargetId(null); //close the window after clicking the button
    };
    
    //RATING FLOATING WINDOW
    const renderWindowRating = () => {
    const biz = results.find((b) => b.id === ratingTargetId); //current restaurant target
    if (!biz) {
      return null;
    }
      return (
        <div className="rating-modal">
          <div className="modal-content" style={{
            background: 'white',
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            padding: '20px',
            borderRadius: '8px',
            width: '400px',
            height: '400px',
            boxShadow: '0 0 10px rgba(0,0,0,0.3)'
          }}>
            <h5>Write a Rate ⭐ {biz.name}</h5>
            {[1,2,3,4,5].map((star) => (
              <Button
                key= {star}
                variant="outline-warning"
                className="me-2"
                onClick ={() => ratingSubmitHandler(biz, star)}>
                {star}
              </Button>
            ))}
            <div className="text-end mt-3">
              <Button variant="secondary" onClick={() => setRatingTargetId(null)}>Cancel</Button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => setRatingTargetId(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999
            }}
          ></div>
        </div>
      );
    };

    //REGISTER FLOATING WINDOW
    const renderWindowRegister = () => {
      return (
      <div className="register-modal">
        <div
          className="modal-content p-4 rounded shadow"
          style={{
            background: 'pink',
            position: 'fixed',
            top: '50%',
            left: '46%',
            transform: 'translate(-30%, -50%)',
            zIndex: 1000,
            width: '400px',
            height: '400px',
            minWidth: '300px'
          }}
        >
          <h5 className="mb-3">Register</h5>
          <Form onSubmit={registerHandler}>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={reg_Username}
                onChange={(e) => setRegUsername(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={reg_Password}
                onChange={(e) => setRegPassword(e.target.value)}
              />
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button
                variant="secondary"
                className="me-2"
                onClick={() => setShowIsRegistering(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Register
              </Button>
            </div>
          </Form>
        </div>
        <div
          className="modal-backdrop"
          onClick={() => setShowIsRegistering(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
        ></div>
      </div>
    );
  };
  //HANDLE SAVE RESTAURANT FUNCTION
  const handleSaveRestaurant = (restaurant) => {
    if (!loggedInUser) return;

    const updatedUserSaves = { ...savedRestaurants };
    if (!updatedUserSaves[loggedInUser]) {
      updatedUserSaves[loggedInUser] = []; //initialize if the user's list is empty
    }
    if (!updatedUserSaves[loggedInUser].some(r => r.id === restaurant.id)) { // check if the user has already the restaurant 
      updatedUserSaves[loggedInUser].push(restaurant); // push the restaurant in user's list
    }
    setSavedRestaurants(updatedUserSaves); //updateSaveDRestaurants
    localStorage.setItem('savedRestaurants', JSON.stringify(updatedUserSaves)); //Saves in browser's localstorage 
  };

  return (
    <div className="App">
    <div className="content-wrapper">
      <Navbar bg="light" expand="lg" className="px-3 py-2 shadow-sm">
          <Navbar.Brand>Dessert Finder</Navbar.Brand>
          <Nav className="ms-auto d-flex align-items-center">
            {!loggedInUser ? (
              <Form className="d-flex align-items-center" onSubmit={loginHandler}>
                <Form.Control
                  type="text"
                  value={username}
                  onChange={function (e) { setUsername(e.target.value)}}
                  placeholder="Username"
                  size="sm"
                  className="me-2"
                />
                <Form.Control
                  type="password"
                  value={password}
                  onChange={function (e) { setPassword(e.target.value)}}
                  placeholder="Password"
                  size="sm"
                  className="me-2"
                />
                <Button size="sm"type="submit">Login</Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="ms-2"
                  onClick={function() { setShowIsRegistering(true)}}
                >
                  Register
                </Button>
              </Form>
            ) : (
              <div className="text-end">
                <span className="me-3 fw-semibold">👤 {loggedInUser}</span>
                <Button size="sm" variant="outline-danger" onClick={ function() {setLoggedInUser(null); localStorage.removeItem('loggedInUser');}}>Logout</Button>
              </div>
            )}
          </Nav>
        </Navbar>
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
                        ⭐ <strong>Yelp {biz.rating}</strong> ({biz.review_count} reviews) &nbsp;
                        
                        <span className="text-muted">{biz.price || '$$'} • {biz.categories?.[0]?.title}</span>
                      </p>
                      <p className="text-success fw-semibold mb-2">
                        {biz.hours?.[0]?.is_open_now ? 'Open now' : ''}
                      </p>
                     
                      <p>
                           <p className="mb-1">
                            🍰 <strong>Dessert Finder {restaurantRatings[biz.id]?.average || "No ratings"}</strong>
                          </p>

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
                        {loggedInUser && (
                          <>
                            <Button
                              size="sm"
                              variant="success"
                              className="mt-2 me-2"
                              onClick={() => handleSaveRestaurant(biz)}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              className="mt-2"
                              onClick={function() { setRatingTargetId(biz.id)}}
                            >
                              Rate
                            </Button>
                          </>
                        )}
                      </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
            {loggedInUser && savedRestaurants[loggedInUser]?.length > 0 && (
            <div className="mt-4">
              <Button
                variant="success"
                size="sm"
                onClick={() => setShowSaved((prev) => !prev)}
              >
                {showSaved ? "Hide Saved" : "View Saved"}
              </Button>

              {showSaved && (
                <div className="mt-3">
                  <h4>Your Saved Restaurants</h4>
                  <ul>
                    {savedRestaurants[loggedInUser].map((r) => (
                      <li key={r.id}>
                        <a href={r.url} target="_blank" rel="noreferrer">
                          {r.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          </Row>
        </Container>
      </div>
      {showsRegistering && renderWindowRegister()} 
      {ratingTargetId && renderWindowRating()}
    </div>
  );
}
export default App;