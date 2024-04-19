var option_value = 17;

// asynchronous function to update the <select> element with data from the server
function updateSelectWithData() {
    // make a request to the server route
    fetch('/getSelectData')
        .then((response) => response.json())
        .then((data) => {
            const selectElement = document.getElementById('selectmask');

            const selectData = data.selectData;
            const imageExtensions = data.imageExtensions;

            // add new options based on the data

            if (selectData !== undefined) {
                selectData.forEach((optionText, index) => {
                    const extension = imageExtensions[index];
                    
                    // capitalize the first letter of optionText to match the format
                    var capitalizedText = optionText.charAt(0).toUpperCase() + optionText.slice(1);
    
                    const option = document.createElement('option');
                    option.text = capitalizedText;
                    
                    // set the extension as a data attribute to each option
                    option.setAttribute('data-extension', extension); 
                    
                    // adding a value to each option starting from 17 as there are already 17 included images in the app
                    option.value = option_value;
                    option_value += 1;
    
                    selectElement.appendChild(option);
    
                });
            }

            // after the custom images' names have been loaded to our selectElement we create the container with the available options 
            createOptionsContainer();
        })
        .catch((error) => {
            console.error('Error fetching data:', error);
        });
}

// call the function to update the <select> element when needed
updateSelectWithData();

var selectedItem;
const maxVisibleItems = 5; // Set the maximum visible items for the container

// function to create the optionsContainer based on the updated selectmask
function createOptionsContainer() {
    const optionsContainer = document.querySelector(".options-container");

    // get the index of the current image mask which is set randomly in index.html
    var currentMask = selectElement.selectedIndex;

    // iterate over the options in the select element
    for (let i = 0; i < selectElement.options.length; i++) {
        var option = selectElement.options[i];

        // create a new container element for each option
        var optionContainer = document.createElement('div');
        optionContainer.classList.add('option-container');

        // create a new span element for each option
        var newOption = document.createElement('span');

        newOption.classList.add('menu-item');
        newOption.textContent = option.textContent;

        var extension = option.getAttribute('data-extension');
        newOption.setAttribute('option-extension', extension);


        // add a "data-selected" attribute to the focused item
        if (i === currentMask) {
            newOption.setAttribute('data-selected', 'true');
        }

        // append the new span and deleteButton elements to the container
        optionContainer.appendChild(newOption);

        if (i >= 17) {
            // create a delete button for custom uploaded images
            var deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-button');
            deleteButton.textContent = 'delete';

            deleteButton.style.fontFamily = '"Material Symbols Outlined", sans-serif';

            optionContainer.appendChild(deleteButton);
        }

        // append the container to the optionsContainer
        optionsContainer.appendChild(optionContainer);

    }    
    
    // get the selected item using the attribute selector
    selectedItem = document.querySelector('.menu-item[data-selected="true"]');

    // scroll the selected item into view
    selectedItem.scrollIntoView({ behavior: 'smooth' });


    var menuDeleteButtons = document.querySelectorAll(".delete-button");

    // handle the custom images deletion
    menuDeleteButtons.forEach((item, index) => {
        item.addEventListener("click", function () {
            if (containerOpen == true) {
                // Accessing the image we want to delete by using the index in menuItems and adding 17 so we skip the already existing images which have no delete option
                var menuItem = menuItems.item(index+17);
                var itemExtension = menuItem.getAttribute('option-extension');

                window.location.href = `/discardUpload?image_id=${encodeURIComponent(itemExtension)}`;
            }
        });
    });

    // close the container when the user clicks anywhere on the page and automatically scroll to the selected option
    document.addEventListener('click', (event) => {
        const isClickInsideContainer = optionsContainer.contains(event.target);
        if (!isClickInsideContainer) {
            // check if the click is outside the container
            optionsContainer.style.maxHeight = null; // close the container
            optionsContainer.style.overflowY = 'hidden';
            menuItems.forEach((item, index) => {
                if (index === currentMask) {
                    setTimeout(() => {
                        item.scrollIntoView({ behavior: 'smooth' });
                    }, 400);
                }
            });
        }
    });

    var containerOpen = false;

    // open/close the container displaying the available images
    optionsContainer.addEventListener('click', (event) => {
        event.stopPropagation();
        if (optionsContainer.style.maxHeight) {
            optionsContainer.style.maxHeight = null; // Close the container
            optionsContainer.style.overflowY = 'hidden';
            containerOpen = false;
        } else {
            const totalHeight = optionsContainer.scrollHeight;
            const visibleHeight = maxVisibleItems * (totalHeight / optionsContainer.children.length);
            optionsContainer.style.maxHeight = visibleHeight + 'px'; // open the container
            optionsContainer.style.overflowY = 'auto';
            containerOpen = true;
        }
    });
        
    var menuItems = document.querySelectorAll(".menu-item");
    
    // handle image mask selection
    menuItems.forEach((item, index) => {
        item.addEventListener("click", function () {
            if (containerOpen == true) {
                // remove the "data-selected" attribute from the previously selected item
                if (selectedItem) {
                    selectedItem.removeAttribute('data-selected');
                }

                // add the "data-selected" attribute to the clicked item
                item.setAttribute('data-selected', 'true');
                selectedItem = item;

                customScroll(item,index);

                currentMask = index;
                selectElement.selectedIndex = currentMask;
                
                // this line is crucial as it is responsible for actually changing the image mask by calling the event listener for when the selectmask changes
                selectElement.dispatchEvent(new Event("change"));
            }
        });
    });


    // custom scrolling function with a delay if the selected image is in the last five options
    function customScroll(item, index) {
        if (index >= optionsContainer.children.length - maxVisibleItems) {
            setTimeout(() => {
                item.scrollIntoView({ behavior: 'smooth' });
            }, 400);
        }
        else {
            item.scrollIntoView({ behavior: "smooth", inline: "nearest"  }); 
        }
    };

    var arrowUp = document.getElementById("arrow-up");
    var arrowDown = document.getElementById("arrow-down");

    // function for changing the image mask using the arrows with the same logic as when selecting each option by the container
    function arrowsUpdateAndScroll(index) {
        currentMask = index;
        selectElement.selectedIndex = currentMask;
        selectElement.dispatchEvent(new Event("change"));

        var selectedItem = menuItems.item(index);
        selectedItem.scrollIntoView({ behavior: "smooth" });
    }
    
    // event for when arrowDown is clicked
    arrowDown.addEventListener("click", function () {
        if (currentMask < selectElement.options.length - 1) {
            currentMask++;
        } else {
            currentMask = 0;
        }
        arrowsUpdateAndScroll(currentMask);
    });
    
    // same logic with arrowDown
    arrowUp.addEventListener("click", function () {
        if (currentMask > 0) {
            currentMask--;
        } else {
            currentMask = selectElement.options.length - 1;
        }
        arrowsUpdateAndScroll(currentMask);
    });
    
}

var clientimages = [];
var clientcoordinates = [];

// asynchronous function to update the images array in index.html
async function updateImages() {
    try {
        const response = await fetch('/getImages');
        const data = await response.json();

        const clientImages = data.map((item) => ({
            id: item.id,
            path: item.path
        }));

        const imageCoordinates = data.reduce((acc, item) => {
            // assuming that item.id contains the key (e.g., "audrey")
            const key = item.id;
            const coordinates = JSON.parse(item.coordinates);
            
            // assign the coordinates array to the key in the accumulator object
            acc[key] = coordinates;
            
            return acc;
        }, {});

        images = images.concat(clientImages);

        // once images are updated, call the function within index.html that relies on clientimages
        handleClientImages(imageCoordinates);
    } catch (error) {
        console.error('Error fetching image data:', error);
    }
}
updateImages();


