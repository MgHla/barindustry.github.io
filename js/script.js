document.addEventListener('DOMContentLoaded', () => {
    const foodsMenuContainer = document.getElementById('foods-menu');
    const drinksMenuContainer = document.getElementById('drinks-menu');
    const menuCategoryButtons = document.querySelectorAll('.menu-category-btn');
    const slideshowBackground = document.querySelector('.slideshow-background'); // Get the slideshow container

    let allMenuItems = [];

    // --- Slideshow Configuration ---
    const slideshowImages = [
        'http://localhost:8000/images/hero-bg-1.png', // Make sure these images exist in your /images/ folder
        'http://localhost:8000/images/hero-bg-2.png',
        'http://localhost:8000/images/hero-bg-3.png',
        'http://localhost:8000/images/hero-bg-4.png'
    ];
    let currentSlide = 0;
    const slideIntervalTime = 5000; // 5 seconds

    function startSlideshow() {
        if (!slideshowBackground || slideshowImages.length === 0) {
            console.warn('Slideshow background container not found or no images configured.');
            return;
        }

        // Pre-load images and create img elements
        slideshowImages.forEach((src, index) => {
            const img = document.createElement('img');
            img.src = src;
            img.alt = `Bar Industry background ${index + 1}`;
            if (index === 0) {
                img.classList.add('active'); // First image is active initially
            }
            slideshowBackground.appendChild(img);
        });

        const images = slideshowBackground.querySelectorAll('img');

        setInterval(() => {
            // Hide current active image
            images[currentSlide].classList.remove('active');

            // Move to next slide
            currentSlide = (currentSlide + 1) % images.length;

            // Show new active image
            images[currentSlide].classList.add('active');
        }, slideIntervalTime);
    }

    // Call startSlideshow when DOM is ready
    startSlideshow();


    // --- Menu Loading Logic (existing code) ---

    // Function to parse CSV data
    async function fetchCsvData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            const lines = text.split('\n').filter(line => line.trim() !== '');

            if (lines.length === 0) {
                throw new Error('CSV file is empty or malformed.');
            }

            const headers = lines[0].split(',').map(header => header.trim());
            const data = [];

            for (let i = 1; i < lines.length; i++) {
                const values = parseCsvLine(lines[i]);
                if (values.length !== headers.length) {
                    console.warn(`Skipping malformed row ${i + 1}: "${lines[i]}" - Expected ${headers.length} columns but found ${values.length}.`);
                    continue;
                }
                const item = {};
                headers.forEach((header, index) => {
                    item[header] = values[index];
                });
                data.push(item);
            }
            return data;
        } catch (error) {
            console.error('Error fetching or parsing CSV:', error);
            throw error;
        }
    }

    // A simple CSV line parser to handle quoted fields with commas
    function parseCsvLine(line) {
        const result = [];
        let inQuote = false;
        let currentField = '';
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' && line[i + 1] === '"') { // Handle escaped quotes ""
                currentField += '"';
                i++; // Skip the next quote
            } else if (char === '"') {
                inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
                result.push(currentField.trim());
                currentField = '';
            } else {
                currentField += char;
            }
        }
        result.push(currentField.trim()); // Add the last field
        return result;
    }


    // Function to render menu items
    function renderMenuItems(items, container) {
        container.innerHTML = '';
        if (items.length === 0) {
            container.innerHTML = '<p class="no-items">No items found in this category.</p>';
            return;
        }

        items.forEach(item => {
            const menuItemDiv = document.createElement('div');
            menuItemDiv.classList.add('menu-item');

            const imageUrl = item.image_url && item.image_url.trim() !== '' ? item.image_url : 'images/placeholder.jpg';

            menuItemDiv.innerHTML = `
                <img src="${imageUrl}" alt="${item.name}" onerror="this.onerror=null; this.src='images/placeholder.jpg';">
                <div class="menu-item-details">
                    <h3>${item.name}</h3>
                    <p class="price">$${parseFloat(item.price).toFixed(2)}</p>
                    <p>${item.description}</p>
                </div>
            `;
            container.appendChild(menuItemDiv);
        });
    }

    // Fetch and display menu on load
    fetchCsvData('menu.csv')
        .then(data => {
            allMenuItems = data;
            const foods = allMenuItems.filter(item => item.category.toLowerCase() === 'food');
            renderMenuItems(foods, foodsMenuContainer);

            // Set up button click handlers
            menuCategoryButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const category = button.dataset.category;

                    menuCategoryButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');

                    foodsMenuContainer.classList.remove('active');
                    drinksMenuContainer.classList.remove('active');

                    if (category === 'food') {
                        const foods = allMenuItems.filter(item => item.category.toLowerCase() === 'food');
                        renderMenuItems(foods, foodsMenuContainer);
                        foodsMenuContainer.classList.add('active');
                    } else if (category === 'drink') {
                        const drinks = allMenuItems.filter(item => item.category.toLowerCase() === 'drink');
                        renderMenuItems(drinks, drinksMenuContainer);
                        drinksMenuContainer.classList.add('active');
                    }
                });
            });
        })
        .catch(error => {
            console.error('Initialization failed:', error);
            foodsMenuContainer.innerHTML = '<p class="error-message">Failed to load menu items. Please check the `menu.csv` file and console for errors.</p>';
            drinksMenuContainer.innerHTML = '<p class="error-message">Failed to load menu items. Please check the `menu.csv` file and console for errors.</p>';
        });

    // Smooth scrolling for navigation links
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            document.querySelector(targetId).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});
