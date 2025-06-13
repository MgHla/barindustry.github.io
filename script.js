document.addEventListener('DOMContentLoaded', () => {
    const foodsMenuContainer = document.getElementById('foods-menu');
    const drinksMenuContainer = document.getElementById('drinks-menu');
    const mainCategoryButtons = document.querySelectorAll('.main-category-btn');
    const foodSubcategoriesContainer = document.getElementById('food-subcategories');
    const drinkSubcategoriesContainer = document.getElementById('drink-subcategories');

    const slideshowBackground = document.querySelector('.slideshow-background');
    const hamburgerMenu = document.querySelector('.hamburger-menu'); // Get the hamburger icon
    const navLinks = document.querySelector('.nav-links'); // Get the navigation links

    let allMenuItems = [];
    let currentActiveCategory = 'food';

    // --- Hamburger Menu Toggle ---
    hamburgerMenu.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        hamburgerMenu.classList.toggle('active');
    });

    // Close the menu when a nav link is clicked (for smoother navigation)
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                hamburgerMenu.classList.remove('active');
            }
        });
    });


    // --- Slideshow Configuration ---
    const slideshowImages = [
        './images/hero-bg-1.png',
        './images/hero-bg-2.png',
        './images/hero-bg-3.png',
        './images/hero-bg-4.png'
    ];
    let currentSlide = 0;
    const slideIntervalTime = 5000;

    function startSlideshow() {
        if (!slideshowBackground || slideshowImages.length === 0) {
            console.warn('Slideshow background container not found or no images configured.');
            return;
        }

        slideshowImages.forEach((src, index) => {
            const img = document.createElement('img');
            img.src = src;
            img.alt = `Bar Industry background ${index + 1}`;
            if (index === 0) {
                img.classList.add('active');
            }
            slideshowBackground.appendChild(img);
        });

        const images = slideshowBackground.querySelectorAll('img');

        setInterval(() => {
            images[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % images.length;
            images[currentSlide].classList.add('active');
        }, slideIntervalTime);
    }

    startSlideshow();

    // --- Menu Loading Logic ---

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

    function parseCsvLine(line) {
        const result = [];
        let inQuote = false;
        let currentField = '';
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' && line[i + 1] === '"') {
                currentField += '"';
                i++;
            } else if (char === '"') {
                inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
                result.push(currentField.trim());
                currentField = '';
            } else {
                currentField += char;
            }
        }
        result.push(currentField.trim());
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
                <!-- img src="${imageUrl}" alt="${item.name}" onerror="this.onerror=null; this.src='images/placeholder.jpg';" -->
                <div class="menu-item-details">
                    <h3>${item.name}</h3>
                    <span class="price">${parseFloat(item.price)} Ks</span>
                    <!-- p>${item.description}</p -->
                </div>
            `;
            container.appendChild(menuItemDiv);
        });
    }

    // Function to render sub-category buttons
    function renderSubCategoryButtons(category, container) {
        container.innerHTML = '';
        const subCategories = new Set();
        allMenuItems
            .filter(item => item.category.toLowerCase() === category.toLowerCase())
            .forEach(item => {
                if (item.sub_category && item.sub_category.trim() !== '') {
                    subCategories.add(item.sub_category.trim());
                }
            });

        const allBtn = document.createElement('button');
        allBtn.classList.add('sub-category-btn', 'active');
        allBtn.dataset.subcategory = 'all';
        allBtn.textContent = 'All';
        container.appendChild(allBtn);

        subCategories.forEach(subCat => {
            const button = document.createElement('button');
            button.classList.add('sub-category-btn');
            button.dataset.subcategory = subCat;
            button.textContent = subCat;
            container.appendChild(button);
        });

        container.querySelectorAll('.sub-category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.sub-category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const selectedSubCategory = btn.dataset.subcategory;
                const filteredItems = allMenuItems.filter(item =>
                    item.category.toLowerCase() === category.toLowerCase() &&
                    (selectedSubCategory === 'all' || item.sub_category.toLowerCase() === selectedSubCategory.toLowerCase())
                );

                if (category === 'food') {
                    renderMenuItems(filteredItems, foodsMenuContainer);
                } else if (category === 'drink') {
                    renderMenuItems(filteredItems, drinksMenuContainer);
                }
            });
        });
    }


    // Fetch and display menu on load
    fetchCsvData('menu.csv')
        .then(data => {
            allMenuItems = data;

            const initialFoods = allMenuItems.filter(item => item.category.toLowerCase() === 'food');
            renderMenuItems(initialFoods, foodsMenuContainer);
            renderSubCategoryButtons('food', foodSubcategoriesContainer);

            mainCategoryButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const category = button.dataset.category;
                    currentActiveCategory = category;

                    mainCategoryButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');

                    foodsMenuContainer.classList.remove('active');
                    drinksMenuContainer.classList.remove('active');
                    foodSubcategoriesContainer.classList.remove('active');
                    drinkSubcategoriesContainer.classList.remove('active');

                    if (category === 'food') {
                        const foods = allMenuItems.filter(item => item.category.toLowerCase() === 'food');
                        renderMenuItems(foods, foodsMenuContainer);
                        foodsMenuContainer.classList.add('active');
                        foodSubcategoriesContainer.classList.add('active');
                        renderSubCategoryButtons('food', foodSubcategoriesContainer);
                    } else if (category === 'drink') {
                        const drinks = allMenuItems.filter(item => item.category.toLowerCase() === 'drink');
                        renderMenuItems(drinks, drinksMenuContainer);
                        drinksMenuContainer.classList.add('active');
                        drinkSubcategoriesContainer.classList.add('active');
                        renderSubCategoryButtons('drink', drinkSubcategoriesContainer);
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
