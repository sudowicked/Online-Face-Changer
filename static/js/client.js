// Function to update the <select> element with data from the server
var option_value = 17;

function updateSelectWithData() {
    // Make a request to the server route
    fetch('/getSelectData')
        .then((response) => response.json())
        .then((data) => {
            const selectElement = document.getElementById('selectmask');
            
            // Clear existing options
            // selectElement.innerHTML = '';

            // Add new options based on the data
            data.forEach((optionText) => {
                // Capitalize the first letter of optionText
                var capitalizedText = optionText.charAt(0).toUpperCase() + optionText.slice(1);
                capitalizedText = capitalizedText.replace('.jpg', '')

                const option = document.createElement('option');
                option.text = capitalizedText;

                option.value = option_value;
                // console.log(option.value);
                option_value += 1;

                selectElement.appendChild(option);
            });
        })
        .catch((error) => {
            console.error('Error fetching data:', error);
        });
}

// Call the function to update the <select> element when needed
updateSelectWithData();

var clientimages = [];
var clientcoordinates = [];

// Function to update the images array in index.html
async function updateImages() {
    try {
        const response = await fetch('/getImages');
        const data = await response.json();
        const clientimages = data.map((item) => ({
            id: item.id,
            path: item.path
        }));
        const clientcoordinates = data.map((item) => ({
            id: item.id,
            coordinates: JSON.parse(item.coordinates)
        }));

        images = images.concat(clientimages);
        console.log('Client Images:', clientcoordinates);
        // Once images are updated, call the function or execute code that relies on clientimages.
        handleClientImages(images, clientcoordinates, masks);
    } catch (error) {
        console.error('Error fetching image data:', error);
    }
}
updateImages();

async function updateCoordinates() {
    try {
        const response = await fetch('/getCoordinates');
        const data = await response.json();
        coordinates = data;
        console.log(coordinates);
    } catch (error) {
        console.error('Error fetching image data:', error);
    }
}
//updateCoordinates();


// Function to update the var images array
/*function updateImages() {
    // Fetch image data from your server or another source
    // Replace this with your logic to fetch image data
    const imageData = [
        {
            "id": "average",
            "path": "../media/average2_crop.jpg"
        }, {
            "id": "terminator",
            "path": "../media/terminator_crop.jpg"
        }, {
            "id": "walter2",
            "path": "../media/walter2_crop.jpg"
        }
    ];

    // Update the var images array with the fetched data
    images = imageData;
}

// Call the function to update var images when needed
updateImages(); */