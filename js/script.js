const SEMESTER_START = new Date('2026-09-14T00:00:00');
const SEMESTER_END = new Date('2026-12-11T23:59:59');

document.addEventListener('DOMContentLoaded', () => { //after HTML is loaded, run the following functions
    initMenu();
    initProgressBar();
    initFilters();
    initCurrentLesson();
    initMap();
});

function initProgressBar() {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    
    // if there is no progress bar on the page, exit the function
    if (!progressBar || !progressText) return; 

    const now = new Date();
    const totalDuration = SEMESTER_END.getTime() - SEMESTER_START.getTime();
    const elapsedDuration = now.getTime() - SEMESTER_START.getTime();
    
    let percentage = Math.round((elapsedDuration / totalDuration) * 100);
    
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;

    progressBar.style.width = percentage + '%';
    progressText.textContent = percentage + ' %';
}

function initFilters() {
    const tableWrapper = document.querySelector('.table-responsive');
    // if there is no table wrapper on the page, exit the function
    if (!tableWrapper) return; 
    
    const buttons = document.querySelectorAll('.filter-btn');
    const cells = document.querySelectorAll('td[data-type]');
    const filterMessage = document.getElementById('filter-message');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('filter-btn--active'));//remove active class from all buttons
            btn.classList.add('filter-btn--active'); //add active class to the clicked button

            const filterValue = btn.getAttribute('data-filter'); //data-filter attribute of the clicked button
            let matchCount = 0;

            cells.forEach(cell => {
                if (filterValue === 'all' || cell.getAttribute('data-type') === filterValue) {//if the cell matches the filter, show it normally
                    cell.style.opacity = '1';
                    cell.style.filter = 'none';
                    matchCount++;
                } else {
                    // darkening the cells that do not match the filter
                    cell.style.opacity = '0.1';
                    cell.style.filter = 'grayscale(100%)';
                }
            });

            // show a message if no matches are found and the filter is not "all"
            if (matchCount === 0 && filterValue !== 'all') {
                tableWrapper.style.display = 'none';
                filterMessage.hidden = false;  // show the message if no matches are found
            } else {
                tableWrapper.style.display = 'block';
                filterMessage.hidden = true; // hide the message if matches are found
            }
        });
    });
}

function initCurrentLesson() {
    const scheduleMessage = document.getElementById('schedule-message');
    if (!scheduleMessage) return; 

    const now = new Date();
    const currentDayIndex = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentHour = now.getHours(); 
    
    const tableRows = document.querySelectorAll('.schedule-table tbody tr');// Get all rows of the schedule table
    let isLessonRunning = false;
    let nextLessonFound = false;
    let nextLessonText = "";

    // Iterate through each row of the schedule table
    tableRows.forEach((row, rowIndex) => {
        const rowDayIndex = rowIndex + 1; // Monday = 1, Tuesday = 2, ..., Friday = 5
        let cellHour = 7; // Schedule starts at 7:00
        
        // Skip the first <th> element (Day name)
        const cells = Array.from(row.children).slice(1);
        
        cells.forEach(cell => {
            const colspan = parseInt(cell.getAttribute('colspan') || '1', 10); // Get the colspan of the cell, default to 1 if not specified
            const cellEndHour = cellHour + colspan;
            const hasData = !cell.classList.contains('empty-slot') && cell.hasAttribute('data-type');

            // Check if the current time is within the lesson's time range
            if (currentDayIndex === rowDayIndex && currentHour >= cellHour && currentHour < cellEndHour) {
                if (hasData) {
                    cell.classList.add('current-lesson');
                    isLessonRunning = true;
                }
            }

            // If no lesson is currently running, find the next lesson
            if (!isLessonRunning && !nextLessonFound && hasData) {
                if ((rowDayIndex === currentDayIndex && cellHour > currentHour) || (rowDayIndex > currentDayIndex)) {
                    const dayName = row.querySelector('th').textContent;
                    const lessonName = cell.querySelector('strong').textContent;
                    nextLessonText = `${lessonName} (${dayName} ${cellHour}:00)`;
                    nextLessonFound = true;
                }
            }

            cellHour = cellEndHour;
        });
    });

    // If no lesson is currently running and no next lesson was found in the first pass, search for the next lesson in the entire schedule
    if (!isLessonRunning && !nextLessonFound) {
        for (let r = 0; r < tableRows.length; r++) {    // Iterate through each row of the schedule table
            const row = tableRows[r]; // Get the current row
            const cells = Array.from(row.children).slice(1);
            let cHour = 7;
            
            for (let c = 0; c < cells.length; c++) {
                const cell = cells[c];
                const col = parseInt(cell.getAttribute('colspan') || '1', 10);
                
                if (!cell.classList.contains('empty-slot') && cell.hasAttribute('data-type')) {
                    const dName = row.querySelector('th').textContent;
                    const lName = cell.querySelector('strong').textContent;
                    nextLessonText = `${lName} (${dName} ${cHour}:00)`;
                    nextLessonFound = true;
                    break;
                }
                cHour += col;
            }
            if (nextLessonFound) break;
        }
    }

    // Display the appropriate message based on whether a lesson is currently running or not
    if (!isLessonRunning) {
        scheduleMessage.hidden = false;
        scheduleMessage.innerHTML = `Aktuálne neprebieha žiadna výučba. Najbližšia hodina: <strong>${nextLessonText}</strong>.`;
    }
}

// --- Map Logic (pages/map.html) ---
function initMap() {
    const mapContainer = document.getElementById('map-container');
    // Safety check: Exit function if not on the map page
    if (!mapContainer) return; 

    // Fixed coordinates for School (FEI STU) and Home
    const schoolCoords = [48.1518, 17.0733];
    const homeCoords = [48.11598200040179, 17.099697695561066];

    // Initialize map centered on Bratislava
    const map = L.map('map-container').setView([48.1500, 17.0900], 13);

    // Load OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add fixed markers to the map
    L.marker(schoolCoords).addTo(map).bindPopup('<b>FEI STU</b><br>Škola').openPopup();
    L.marker(homeCoords).addTo(map).bindPopup('<b>Bydlisko</b><br>Bratislava');

    // Manage user points via localStorage
    let userPoints = JSON.parse(localStorage.getItem('myMapPoints')) || [];
    let userMarkers = [];
    let currentLine = null;

    const emptyState = document.getElementById('map-empty-state');
    const pointSelector = document.getElementById('point-selector');
    const calculateBtn = document.getElementById('calculate-btn');
    const distanceResult = document.getElementById('distance-result');
    const clearBtn = document.getElementById('clear-points-btn');

    // Function to render user points
    function renderUserPoints() {
        userMarkers.forEach(marker => map.removeLayer(marker));
        userMarkers = [];
        pointSelector.innerHTML = '';

        if (userPoints.length === 0) {
            emptyState.style.display = 'block';
            pointSelector.disabled = true;
            calculateBtn.disabled = true;
            pointSelector.innerHTML = '<option value="">Zatiaľ ste nepridali žiadne miesto</option>';
        } else {
            emptyState.style.display = 'none';
            pointSelector.disabled = false;
            calculateBtn.disabled = false;

            userPoints.forEach((pt, index) => {
                const marker = L.marker([pt.lat, pt.lng]).addTo(map).bindPopup(`<b>${pt.name}</b>`);
                userMarkers.push(marker);

                const option = document.createElement('option');
                option.value = index;
                option.textContent = pt.name;
                pointSelector.appendChild(option);
            });
        }
    }

    // Add a new point on map click
    map.on('click', function(e) {
        const pointName = prompt("Zadajte názov pre toto miesto:"); 
        if (pointName && pointName.trim() !== "") {
            const newPoint = {
                name: pointName.trim(),
                lat: e.latlng.lat,
                lng: e.latlng.lng
            };
            userPoints.push(newPoint);
            localStorage.setItem('myMapPoints', JSON.stringify(userPoints));
            renderUserPoints();
        }
    });

    // Custom Haversine formula to calculate distance
    function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // Calculate distance and draw a line
    calculateBtn.addEventListener('click', () => {
        const selectedIndex = pointSelector.value;
        const targetType = document.getElementById('target-selector').value;

        if (selectedIndex === "") return;

        const startPoint = userPoints[selectedIndex];
        const endCoords = targetType === 'school' ? schoolCoords : homeCoords;

        const distance = calculateHaversineDistance(startPoint.lat, startPoint.lng, endCoords[0], endCoords[1]);

        document.getElementById('distance-value').textContent = distance.toFixed(2);
        distanceResult.hidden = false;

        if (currentLine) {
            map.removeLayer(currentLine);
        }

        currentLine = L.polyline([[startPoint.lat, startPoint.lng], endCoords], {color: 'red', weight: 4}).addTo(map);
        map.fitBounds(currentLine.getBounds(), { padding: [50, 50] });
    });

    // Clear all points
    clearBtn.addEventListener('click', () => {
        if (confirm('Naozaj chcete vymazať všetky pridané miesta?')) {
            userPoints = [];
            localStorage.removeItem('myMapPoints');
            if (currentLine) map.removeLayer(currentLine);
            distanceResult.hidden = true;
            renderUserPoints();
            map.setView([48.1500, 17.0900], 13);
        }
    });

    renderUserPoints();
}

// --- Mobile Menu Logic ---
function initMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const mainNavList = document.getElementById('main-nav-list');

    // Safety check: Exit function if menu is not present on the page
    if (!menuToggle || !mainNavList) return;

    menuToggle.addEventListener('click', () => {
        // Toggle class to show/hide menu
        mainNavList.classList.toggle('main-nav__list--open');
        
        // Update Accessibility
        const isOpen = mainNavList.classList.contains('main-nav__list--open');
        menuToggle.setAttribute('aria-expanded', isOpen);
    });
}