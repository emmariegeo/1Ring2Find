const express = require('express');
const fetch = require('node-fetch');
const { Headers } = require('node-fetch');
// https://www.npmjs.com/package/random-lotr-movie-quote
const randomQuote = require('random-lotr-movie-quote');
const token = process.env['token'];
const app = express();

// Characters that have images
const charSet = new Set(['aragorn', 'arwen', 'bilbo', 'boromir', 'celeborn', 'elrond', 'frodo', 'galadriel', 'gandalf', 'gimli', 'gollum', 'legolas', 'merry', 'pippin', 'sam', 'saruman']);

// Authorization for The One API
const myHeaders = new Headers({
  'Authorization': `Bearer ${token}`
});

// Set view engine
app.set("view engine", "ejs");
// Specify folder for static files
app.use(express.static("public"));

// Error message
const getError = (code) => {
  if (code == 502) {
    let msg = 'Oops! Looks like we made too many API requests.'
  } else {
    let msg = 'We have encountered a network error.'
  }
  return msg;
}

// routes
// Index
app.get('/', (req, res) => {
  res.render('index', {
      'searchError': false
    });
});

// Random Quote
app.get('/quote', async (req, res) => {
  let quote = randomQuote();
  let image = 'images/ring.jpg'
  // If quoted character is in the list of char pictures, add picture
  if (charSet.has(quote.char.toLowerCase())) {
    image = `../images/char/${quote.char.toLowerCase()}-small.jpg`;
  }
  res.render('quote', {
    'dialog': quote.dialog,
    'char': quote.char,
    'movie': quote.movie,
    'image': image
  });
});

// Movies
app.get('/movies', async (req, res) => {
  let url = `https://the-one-api.dev/v2/movie`;
  let response = await fetch(url, { headers: myHeaders });
  let data = await response.json();
  if (data.total == 0) {
    res.render('error', {
      'errorcode': 'Not found.',
      'errormsg': 'Not all who wander are lost. But you might be.'
    });
  } else if (response.ok) {
    res.render('movies', {
      'movieList': data.docs
    });
  } else {
    let msg = getError(response.status);
    res.render('error', {
      'errorcode': response.status,
      'errormsg': msg
    });
  }
});

// Books
app.get('/books', async (req, res) => {
  let url = `https://the-one-api.dev/v2/book`;
  let response = await fetch(url);
  let data = await response.json();
  if (data.total == 0) {
    res.render('error', {
      'errorcode': 'Not found.',
      'errormsg': 'Not all who wander are lost. But you might be.'
    });
  } else if (response.ok) {
    res.render('books', {
      'bookList': data.docs
    });
  } else {
    let msg = getError(response.status);
    res.render('error', {
      'errorcode': response.status,
      'errormsg': msg
    });
  }
});

// Book ID
app.get('/book/:id', async (req, res) => {
  let url = `https://the-one-api.dev/v2/book/${req.params.id}`;
  let response = await fetch(url);
  let data = await response.json();
  let bookName = '';
  if (data.total != 0) {
    bookName = data.docs[0].name;
  } 

  url = `https://the-one-api.dev/v2/book/${req.params.id}/chapter`;
  response = await fetch(url);
  data = await response.json();
  if (data.total == 0) {
    res.render('error', {
      'errorcode': 'Not found.',
      'errormsg': 'Not all who wander are lost. But you might be.'
    });
  } else if (response.ok) {
    res.render('book', {
      'bookName': bookName,
      'chapters': data.docs
    });
  } else {
    let msg = getError(response.status);
    res.render('error', {
      'errorcode': response.status,
      'errormsg': msg
    });
  }
});

// Character
app.get('/character', async (req, res) => {
  // If searching empty string
  if (req.query['name'].trim() == '') {
    res.render('index', {
      'searchError': true
    });
  } else {
    // Fetch character info from api
    let url = `https://the-one-api.dev/v2/character?name=/${req.query['name']}/i`;
    let response = await fetch(url, { headers: myHeaders });
    let data = await response.json();
    // Blank response
    if (data.total == 0) {
      res.render('error', {
        'errorcode': 'Not found.',
        'errormsg': 'Not all who wander are lost. But you might be.'
      });
    } else if (response.ok) {
      // If character has an image, display theirs
      let image = '../images/ring.jpg'
      let firstName = ((req.query['name']).split(' '))[0].toLowerCase();
      if (charSet.has(firstName)) {
        image = `../images/char/${firstName}-small.jpg`;
      }
      res.render('character', {
        'character': data.docs,
        'image': image
      });
    } else {
      let msg = getError(response.status);
      res.render('error', {
        'errorcode': response.status,
        'errormsg': msg
      });
    }
  }
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});



