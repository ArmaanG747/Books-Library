// Global variables to manage state and data
let filter = false;                     // Indicates whether a filter is applied
let globalBookList = [];                 // Stores all loaded books
let currentDisplayMode = "grid";         // Current display mode (grid or list)
let currentPage = 1;                     // Current page number for pagination
let index = 1;                           // Index for numbering books in list view
const pageSize = 10;                     // Number of books to fetch per page
let debounceTimer;                      // Variable to store the debounce timer


// Function to fetch data from the API with pagination support
async function getData(page = 1, size = pageSize) {
    const url = `https://api.freeapi.app/api/v1/public/books?page=${page}&limit=${size}`;
    try {
        const response = await fetch(url);   // Fetching data from API
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);  // Error handling for unsuccessful responses
        }

        let jsonData = await response.json();   // Parsing JSON data
        const books = jsonData["data"]["data"]; // Extracting book data from API response
        globalBookList.push(...books);          // Appending the fetched books to the global list
        return books;                           // Returning the fetched books
    } catch (error) {
        console.error(error.message);           // Logging error message to console
    }
}


// Function to display books in grid or list view
async function displayBooks(displayMode = "grid", filteredBooks = null, append = false) {
    // Get the list of books, either filtered or from the global list
    let bookList = filteredBooks || globalBookList;

    // Check what sorting option the user has selected
    let sortBy = document.getElementById("book-sort").value;

    // If a sort option is selected, sort the books accordingly
    if (sortBy) {
        index = 1;  // Reset index for list view numbering
        bookList = sortBooks(bookList, sortBy);  // Sort the books
    }

    console.log("Displaying Books:", bookList);

    // Get the element where we want to display books
    let displayDiv = document.getElementById("book-display");
    let displayContainer = document.createElement("div");

    // Set the container class based on the selected display mode (grid or list)
    displayContainer.className = displayMode === "grid" ? "book-display-grid" : "book-display-list";

    // Go through each book and create the visual representation
    bookList.forEach((book) => {
        // Create a div to represent a single book item
        let bookItem = document.createElement("div");
        bookItem.className = displayMode === "grid" ? "book-grid-item" : "book-list-item";

        // Set up a clickable link to open book details in a new tab
        const infoLink = book["volumeInfo"]["infoLink"] || "#";
        bookItem.addEventListener("click", () => {
            if (infoLink !== "#") {
                window.open(infoLink, "_blank");  // Open in a new tab
            } else {
                alert("No additional information available for this book.");  // Show alert if no link
            }
        });

        // Create image and text elements for the book
        let bookImg = document.createElement("img");
        bookImg.className = displayMode === "grid" ? "book-grid-thumbnail" : "book-list-thumbnail";

        let bookTitle = document.createElement("div");
        bookTitle.className = displayMode === "grid" ? "book-grid-title" : "book-list-title";

        let bookAuthor = document.createElement("div");
        bookAuthor.className = displayMode === "grid" ? "book-grid-author" : "book-list-author";

        let bookPublisher = document.createElement("div");
        bookPublisher.className = displayMode === "grid" ? "book-grid-publisher" : "book-list-publisher";

        let bookDate = document.createElement("div");
        bookDate.className = displayMode === "grid" ? "book-grid-date" : "book-list-date";

        let bookIndex, firstChild, secondChild;

        // Handle list-specific elements
        if (displayMode === "list") {
            bookIndex = document.createElement("div");
            bookIndex.className = "book-list-index";
            bookIndex.innerHTML = `<strong>${index}</strong>`;  // Show the book number
            index++;  // Increment for the next book

            // Create containers for organizing list view layout
            firstChild = document.createElement("div");
            firstChild.className = "first-child";

            secondChild = document.createElement("div");
            secondChild.className = "second-child";
        }

        // Try to set the book image, and handle cases where the image is missing
        try {
            bookImg.src = displayMode === "grid"
                ? book["volumeInfo"]["imageLinks"]["thumbnail"]
                : book["volumeInfo"]["imageLinks"]["smallThumbnail"];
        } catch (e) {
            console.warn("Image not available");  // Log a warning if image is not available
        }

        // Set the book details text or a placeholder if missing
        bookTitle.textContent = book["volumeInfo"]["title"] || "No Title";
        bookAuthor.innerHTML = `<strong>Authors:</strong> ${book["volumeInfo"]["authors"] || "Unknown"}`;
        bookPublisher.innerHTML = `<strong>Publisher:</strong> ${book["volumeInfo"]["publisher"] || "Unknown"}`;
        bookDate.innerHTML = `<strong>Published Date:</strong> ${book["volumeInfo"]["publishedDate"] || "Unknown"}`;

        // Append the details to the book item based on the display mode
        if (displayMode === "grid") {
            index = 1;  // Reset the index for grid view
            bookItem.appendChild(bookTitle);
            bookItem.appendChild(bookImg);
            bookItem.appendChild(bookAuthor);
            bookItem.appendChild(bookPublisher);
            bookItem.appendChild(bookDate);
        } else {
            // Add elements to the list view's organized structure
            firstChild.appendChild(bookIndex);
            firstChild.appendChild(bookImg);
            firstChild.appendChild(bookTitle);
            firstChild.appendChild(bookAuthor);
            secondChild.appendChild(bookPublisher);
            secondChild.appendChild(bookDate);

            bookItem.appendChild(firstChild);
            bookItem.appendChild(secondChild);
        }

        // Add the book item to the container
        displayContainer.appendChild(bookItem);
    });

    // Clear the display if we're not appending, and then add the new content
    displayDiv.innerHTML = "";
    displayDiv.appendChild(displayContainer);
}

// Debounce function to limit the rate at which a function gets invoked
// It takes the actual function (func) and a delay time (delay) as arguments
function debounce(func, delay) {
    return function (...args) {
        // Clear the previous timer if it exists
        clearTimeout(debounceTimer);
        // Set a new timer to call the function after the specified delay
        debounceTimer = setTimeout(() => func(...args), delay);
    };
}


// Function to filter books based on user input from the search bar
function filterBook(displayMode = "grid") {
    // Get the search input value and make it lowercase to ensure case-insensitive matching
    let filterValue = document.getElementById("searchbar").value.trim().toLowerCase();
    let filteredBooks = [];  // Array to store the filtered results

    // If the input is empty and there's no debounce timer, prompt the user
    if (filterValue.length === 0 && !debounceTimer) {
        alert("Please enter something to search for!");  // Notify user to enter something
        filter = false;  // Reset filter flag since there's no input
        index = 1;       // Reset the book index
        displayBooks(displayMode);  // Show all books when search bar is cleared
    } else {
        // Log the current list of books being displayed
        console.log("Total Books in view:", globalBookList);

        // Iterate through the list of all loaded books
        globalBookList.forEach((book) => {
            // Get the book title and authors, converting them to lowercase for comparison
            let title = book["volumeInfo"]["title"]?.toLowerCase() || "";
            let authors = book["volumeInfo"]["authors"]?.map(author => author.toLowerCase()) || [];

            // Check if the title includes the search term
            if (title.includes(filterValue)) {
                filteredBooks.push(book);  // Add to filtered list if the title matches
                return;  // Stop further checks for this book
            }

            // Check if any of the authors' names include the search term
            let authorMatch = authors.some(author => author.includes(filterValue));
            if (authorMatch) {
                filteredBooks.push(book);  // Add to filtered list if an author matches
            }
        });

        // Log the filtered results for debugging purposes
        console.log("Filtered Books:", filteredBooks);

        // If no books match the search criteria, notify the user
        if (filteredBooks.length === 0 && !debounceTimer) {
            alert("No matching books found!");  // Inform the user about the empty result
            filter = false;  // Reset the filter flag since no results were found
            index = 1;       // Reset the book index
            displayBooks(displayMode);  // Show all books again
            return;  // Stop further execution
        }

        // If we have filtered results, set the filter flag to true
        filter = true;  // Indicate that a filter is active
        index = 1;      // Reset the book index
        // Pass the display mode and filtered books to the display function
        displayBooks(displayMode, filteredBooks);
    }
}


// Function to sort the list of books based on the selected criterion
function sortBooks(bookList, sortBy) {
    // Check if the sorting criterion is "title-asc" (alphabetical A-Z)
    if (sortBy === "title-asc") {
        // Sort the book list alphabetically by title (A-Z)
        bookList.sort((a, b) => {
            // Convert both titles to lowercase to make sorting case-insensitive
            let titleA = a["volumeInfo"]["title"]?.toLowerCase() || "";
            let titleB = b["volumeInfo"]["title"]?.toLowerCase() || "";
            // Use localeCompare to compare the two titles
            return titleA.localeCompare(titleB);
        });

    // Check if the sorting criterion is "title-desc" (reverse alphabetical Z-A)
    } else if (sortBy === "title-desc") {
        // Sort the book list reverse alphabetically by title (Z-A)
        bookList.sort((a, b) => {
            // Convert both titles to lowercase to make sorting case-insensitive
            let titleA = a["volumeInfo"]["title"]?.toLowerCase() || "";
            let titleB = b["volumeInfo"]["title"]?.toLowerCase() || "";
            // Reverse the comparison to achieve Z-A order
            return titleB.localeCompare(titleA);
        });

    // Check if the sorting criterion is "date-asc" (oldest first)
    } else if (sortBy === "date-asc") {
        // Sort the book list by published date, from oldest to newest
        bookList.sort((a, b) => {
            // Convert the published date strings to Date objects
            let dateA = new Date(a["volumeInfo"]["publishedDate"] || "1900-01-01");
            let dateB = new Date(b["volumeInfo"]["publishedDate"] || "1900-01-01");
            // Subtract dates to get ascending order (earlier dates first)
            return dateA - dateB;
        });

    // Check if the sorting criterion is "date-desc" (newest first)
    } else if (sortBy === "date-desc") {
        // Sort the book list by published date, from newest to oldest
        bookList.sort((a, b) => {
            // Convert the published date strings to Date objects
            let dateA = new Date(a["volumeInfo"]["publishedDate"] || "1900-01-01");
            let dateB = new Date(b["volumeInfo"]["publishedDate"] || "1900-01-01");
            // Subtract dates to get descending order (latest dates first)
            return dateB - dateA;
        });
    }

    // Return the sorted book list
    return bookList;
}

// Function to scroll back to the top of the page when triggered
function topFunction() {
    // Scroll to the top of the document for both body and HTML elements
    // Works for different browsers that might use either "body" or "documentElement"
    document.body.scrollTop = 0;         // For Safari
    document.documentElement.scrollTop = 0;  // For Chrome, Firefox, IE, and Opera
}

// Function to control the visibility of the "Back to Top" button when scrolling
function scrollFunction() {
    // Get references to the "Back to Top" button and its icon
    let topButton = document.getElementById("back-to-top-button");
    let topButtonIcon = document.getElementById("back-to-top-icon");

    // Check how far the user has scrolled from the top of the page
    // If the user has scrolled more than 20 pixels from the top, show the button
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        topButton.style.display = "block";  // Make the button visible
        topButtonIcon.style.display = "block";  // Make the icon visible

    // If the user has scrolled less than or equal to 20 pixels from the top, hide the button
    } else {
        topButton.style.display = "none";  // Hide the button
        topButtonIcon.style.display = "block";  // Make sure the icon is still visible
    }
}

// Attach the scrollFunction to the window's onscroll event
// This makes sure the function gets called whenever the user scrolls the page
window.onscroll = function() {
    scrollFunction();  // Trigger the scroll function on every scroll event
};

// Event Listeners

// When the document is fully loaded, fetch the initial data and display it in grid view
document.addEventListener("DOMContentLoaded", async () => {
    await getData(currentPage, pageSize);    // Fetch the initial set of books
    displayBooks(currentDisplayMode);        // Show books in the current display mode (grid by default)
});

// Event listener to switch to list view when the list button is clicked
document.getElementById("view-list-button").addEventListener('click', () => {
    currentDisplayMode = "list";    // Update the current display mode to list
    displayBooks(currentDisplayMode);  // Display books in list format
});

// Event listener to switch to grid view when the grid button is clicked
document.getElementById("view-grid-button").addEventListener('click', () => {
    currentDisplayMode = "grid";    // Update the current display mode to grid
    displayBooks(currentDisplayMode);  // Display books in grid format
});

// Event listener for the search button to trigger the filtering function
document.getElementById("search-button").addEventListener('click', () => {
    filterBook(currentDisplayMode);  // Filter the books according to the current display mode
});

// Event listener to handle sorting when the user changes the sort option from the dropdown
document.getElementById("book-sort").addEventListener("change", () => {
    let sortBy = document.getElementById("book-sort").value;   // Get the selected sorting option
    if (sortBy) {
        displayBooks(currentDisplayMode);  // Update the book display with the new sorting
    }
});

// Event listener to scroll to the top when the "Back to Top" button is clicked
document.getElementById("back-to-top-button").addEventListener('click', topFunction);

// Event listener to perform live search as the user types, with debounce to reduce API calls
document.getElementById("searchbar").addEventListener("input", debounce(() => {
    filterBook(currentDisplayMode);  // Perform live filtering while typing
}, 500));

// Event listener to load more books when the "Load More" button is clicked
document.getElementById("load-more-books").addEventListener('click', async () => {
    currentPage++;  // Increment the page number to load the next set of books
    const newBooks = await getData(currentPage, pageSize);  // Fetch additional books from the API
    if (newBooks && newBooks.length > 0) {
        displayBooks(currentDisplayMode, null, true);  // Append the new books to the current list
    } else {
        alert("No more books to load.");  // Notify the user if there are no more books
    }
});





