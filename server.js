const express = require('express');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');


// SQLite initialization
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('clm_database.db');

// Create a directory to store uploaded images
const uploadDirectory = './static/uploads';
const storage = multer.diskStorage({
    destination: uploadDirectory,
    filename: (req, file, callback) => {
        callback(null, file.originalname); // Use the original file name
    },
});
const upload = multer({ storage });

const app = express();
const port = 8080;

app.set('view engine', 'ejs')

// Configure express-session middleware
app.use(session({
    secret: 'your-secret-key', // Replace with a secure secret key
    resave: false,
    saveUninitialized: true,
}));

// Serve static files from the "public" directory
// sendFile will go here
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '/static/html/login_register.html'));
  });
app.use(express.static(path.join(__dirname, '/static')));
console.log(__dirname);
app.use(express.urlencoded({ extended: true })); // Enable parsing of form data


// Define a route to handle the form submission
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    // Open a connection to the SQLite database

    // Insert the user into the database
    const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
    db.run(sql, [username, password], (err) => {
        if (err) {
            console.error(err.message);
            res.send('Registration failed.');
        } else {
            //res.send('Registration successful!');
            res.redirect('/html/register_success.html');
        }
        db.close();
    });
});

// Define a route to handle login form submissions
app.post('/login', (req, res) => {

    const { username, password } = req.body;

    // Open a connection to the SQLite database
    const db = new sqlite3.Database('clm_database.db');

  
    // Check if the user exists and the password matches
    const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.get(sql, [username, password], (err, row) => {
        if (err) {
            console.error(err.message);
            res.send('Login failed.');
        } else if (row) {
            // res.send('Login successful! Welcome, ' + row.username + '.');
            // User found and password matches
            const userId = row.user_id; // Retrieve the user ID from the database row'
            console.log('User ID:', userId);

            // You can set the user's ID in the session or handle it as needed here
            req.session.userId = userId;
        
            // Redirect to a secured page (e.g., image upload page) or send a success response.
            res.redirect('/html/index.html'); 
           
        }
          
        else {
            res.redirect('/html/failed_login.html');
        }
        db.close();
    });
});



// Define a route to handle image uploads
app.post('/upload', upload.single('image'), (req, res) => {
    const { originalname } = req.file;
    // Check if the user is logged in (you can implement user sessions here)
    // For demonstration purposes, we assume the user is logged in.

    // You can store the image information in the database or perform other actions here.
    // Example: Save the image filename in the database.
    // Check if the user is logged in (i.e., their user ID is in the session)
    if (req.session.userId) {
        // User is logged in; you can now use req.session.userId for image uploads.

        // Insert the image information along with the user ID into the database.
        const db = new sqlite3.Database('clm_database.db'); // Replace with your SQLite database file
        const sql = 'INSERT INTO user_images (user_id, filename) VALUES (?, ?)';
        db.run(sql, [req.session.userId, originalname], (err) => {
            if (err) {
                console.error(err.message);
                res.send('Image upload failed.');
            } 
            else {
                res.redirect(`/annotater/annotater.html?originalname=${originalname}`);
                
            }
        })
                
    }
    
    else {
        // User is not logged in; handle this case.
        res.send('User is not logged in.');
    }
    // db.close();

});

app.get('/setCoordinates', (req, res) => {
    const coordinates = req.query.coordinates;
    const id = req.query.id;
    const originalname = id.concat(".jpg");
    if (req.session.userId) {
        // User is logged in; you can now use req.session.userId for image uploads.

        // Insert the image information along with the user ID into the database.
        const db = new sqlite3.Database('clm_database.db'); // Replace with your SQLite database file
        const sql = 'UPDATE user_images SET coordinates = ? WHERE user_id = ? AND filename = ?';
        db.run(sql, [coordinates, req.session.userId, originalname], (err) => {
            if (err) {
                console.error(err.message);
                res.send('Image upload failed.');
            } 
            else {
                // console.log(id, coordinates);
                res.redirect('/html/index.html');
                
            }
        })
                
    }
    
    else {
        // User is not logged in; handle this case.
        res.send('User is not logged in.');
    }
    
    
    // Now you can use 'coordinates' and 'id' in your server logic
  });

app.get('/getSelectData', (req, res) => {
    const db = new sqlite3.Database('clm_database.db'); // Replace with your SQLite database file
    // Fetch data from the database (replace with your own logic)
    userId = req.session.userId;
    const sql = 'SELECT filename FROM user_images WHERE user_id = ?';
    db.all(sql, [req.session.userId], (err, rows) => {
        if (err) {
            console.error('Error fetching custom images:', err);
            res.status(500).send('Internal Server Error');
        }   else if (rows && rows.length > 0) {
        
            const customImagesNames = rows.map((row) => row.filename)
                    
            const selectData = customImagesNames;
            // console.log(customImagesNames);
            // const selectData = ["Option 1", "Option 2", "Option 3"];
                            
            // Send the data as JSON in the response
            res.json(selectData);
            };  
                       
        })
        
    //const selectData = ["Option 1", "Option 2", "Option 3"];
    
    // Send the data as JSON in the response

});  

// Define a route to fetch image data
app.get('/getImages', (req, res) => {
    // Fetch image data from your database or other source
    

    const db = new sqlite3.Database('clm_database.db'); // Replace with your SQLite database file
    // Fetch data from the database (replace with your own logic)
    userId = req.session.userId;
    const sql = 'SELECT filename, coordinates FROM user_images WHERE user_id = ?';
    db.all(sql, [req.session.userId], (err, rows) => {
        if (err) {
            console.error('Error fetching custom images:', err);
            res.status(500).send('Internal Server Error');
        }   else if (rows && rows.length > 0) {
            const image_url = "../uploads/";
        
            // Map rows to the desired format
            const imageData = rows.map((row) => ({
                id: row.filename.replace('.jpg', ''),
                path: image_url + row.filename,
                coordinates: row.coordinates // Add coordinates to the response
            }));               
            // Send the data as JSON in the response
            res.json(imageData);
            }
        else {
            imageData = [];
            res.json(imageData);
        };
                       
    })

});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});