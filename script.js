// Global variables
let cases = [];
let providers = [];
let services = [];
let rooms = [];
let constraints = {};
let roomConstraints = {};
let timeSlots = ['8:00', '8:30', '9:00', '9:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
let draggedCase = null;
let draggedCaseElement = null;

// Initialize the schedule
function initSchedule() {
    console.log('Initializing schedule...');
    const scheduleGrid = document.getElementById('scheduleGrid');
    if (!scheduleGrid) {
        console.error('Schedule grid element not found!');
        return;
    }

    scheduleGrid.innerHTML = '';
    console.log('Creating schedule for', rooms.length, 'rooms');

    rooms.forEach(room => {
        console.log('Creating room row for:', room.name, 'ID:', room.id);
        const roomRow = document.createElement('div');
        roomRow.className = 'room-row';
        roomRow.dataset.roomId = room.id;

        const roomName = document.createElement('div');
        roomName.className = 'room-name';
        roomName.textContent = room.name;
        roomRow.appendChild(roomName);

        const timeSlotsContainer = document.createElement('div');
        timeSlotsContainer.className = 'time-slots';

        timeSlots.forEach((time, index) => {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot-cell';
            timeSlot.dataset.time = time;
            timeSlot.dataset.index = index;
            timeSlotsContainer.appendChild(timeSlot);
        });

        roomRow.appendChild(timeSlotsContainer);
        scheduleGrid.appendChild(roomRow);
    });

    console.log('Schedule grid created with', scheduleGrid.children.length, 'room rows');
    renderCases();
}

// Render all cases on the schedule
function renderCases() {
    console.log('Rendering cases...', cases.length, 'cases to render');

    // Clear existing cases
    document.querySelectorAll('.case').forEach(caseEl => caseEl.remove());

    cases.forEach((caseData, index) => {
        console.log(`Rendering case ${index + 1}:`, caseData);
        const caseElement = createCaseElement(caseData);
        positionCase(caseElement, caseData);
    });

    console.log('Cases rendered, checking for overlaps...');
    checkForOverlaps();
}

// Create a case element
function createCaseElement(caseData) {
    const caseEl = document.createElement('div');
    caseEl.className = 'case';
    caseEl.dataset.caseId = caseData.id;

    // Find service and provider information
    const service = services.find(s => s.id === caseData.serviceId);
    const provider = providers.find(p => p.id === caseData.providerId);

    const serviceName = service ? service.name : 'Unknown Service';
    const providerName = provider ? provider.name : 'Unknown Provider';
    const patientName = caseData.patientName || 'Unknown Patient';

    // Check if we're on mobile
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
        // On mobile, show only patient name
        caseEl.innerHTML = `
            <div class="case-title">${patientName}</div>
            <div class="case-provider" style="display: none;">${providerName}</div>
            <div class="case-duration" style="display: none;">${caseData.duration}min</div>
        `;
    } else {
        // On desktop, show full information
        caseEl.innerHTML = `
            <div class="case-title">${serviceName} - ${patientName}</div>
            <div class="case-provider">${providerName}</div>
            <div class="case-duration">${caseData.duration}min</div>
        `;
    }

    // Add drag event listeners
    caseEl.draggable = true;
    caseEl.addEventListener('dragstart', handleDragStart);
    caseEl.addEventListener('dragend', handleDragEnd);

    return caseEl;
}

// Position a case on the schedule
function positionCase(caseElement, caseData) {
    console.log('Positioning case:', caseData.patientName, 'in room:', caseData.roomId);

    const roomRow = document.querySelector(`[data-room-id="${caseData.roomId}"]`);
    if (!roomRow) {
        console.error('Room row not found for roomId:', caseData.roomId);
        return;
    }

    const timeSlotsContainer = roomRow.querySelector('.time-slots');
    if (!timeSlotsContainer) {
        console.error('Time slots container not found for room:', caseData.roomId);
        return;
    }

    const startIndex = timeSlots.indexOf(caseData.startTime);
    const durationSlots = Math.ceil(caseData.duration / 30);

    if (startIndex === -1) {
        console.error('Start time not found:', caseData.startTime);
        return;
    }

    const startSlot = timeSlotsContainer.children[startIndex];
    const endSlot = timeSlotsContainer.children[Math.min(startIndex + durationSlots - 1, timeSlots.length - 1)];

    if (!startSlot || !endSlot) {
        console.error('Time slots not found for positioning');
        return;
    }

    const startRect = startSlot.getBoundingClientRect();
    const endRect = endSlot.getBoundingClientRect();
    const containerRect = timeSlotsContainer.getBoundingClientRect();

    const left = startRect.left - containerRect.left;
    const width = endRect.right - startRect.left;

    caseElement.style.left = `${left}px`;
    caseElement.style.width = `${width}px`;
    caseElement.style.top = '10px';

    timeSlotsContainer.appendChild(caseElement);
    console.log('Case positioned successfully');
}

// Drag and drop handlers
function handleDragStart(e) {
    draggedCase = cases.find(c => c.id === e.target.dataset.caseId);
    draggedCaseElement = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';

    // For mobile devices, add touch support
    if (e.dataTransfer) {
        e.dataTransfer.setData('text/plain', '');
    }
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedCase = null;
    draggedCaseElement = null;
}

// Add drop zones to time slots
function addDropZones() {
    document.querySelectorAll('.time-slot-cell').forEach(slot => {
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('drop', handleDrop);
        slot.addEventListener('dragenter', handleDragEnter);
        slot.addEventListener('dragleave', handleDragLeave);
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    const dropZone = e.target.querySelector('.drop-zone') || createDropZone(e.target);
    dropZone.classList.add('active');
}

function handleDragLeave(e) {
    const dropZone = e.target.querySelector('.drop-zone');
    if (dropZone) {
        dropZone.classList.remove('active');
    }
}

function createDropZone(slot) {
    const dropZone = document.createElement('div');
    dropZone.className = 'drop-zone';
    slot.appendChild(dropZone);
    return dropZone;
}

function handleDrop(e) {
    e.preventDefault();
    const dropZone = e.target.querySelector('.drop-zone');
    if (dropZone) {
        dropZone.classList.remove('active');
    }

    if (!draggedCase) return;

    const timeSlot = e.target.closest('.time-slot-cell');
    const roomRow = e.target.closest('.room-row');

    if (!timeSlot || !roomRow) return;

    const newTime = timeSlot.dataset.time;
    const newRoomId = roomRow.dataset.roomId;

    // Update case data
    draggedCase.startTime = newTime;
    draggedCase.roomId = newRoomId;

    // Re-render cases
    renderCases();
}

// Check for overlapping cases
function checkForOverlaps() {
    const caseElements = document.querySelectorAll('.case');
    caseElements.forEach(caseEl => {
        caseEl.classList.remove('overlap');
    });

    rooms.forEach(room => {
        const roomCases = cases.filter(c => c.roomId === room.id);

        for (let i = 0; i < roomCases.length; i++) {
            for (let j = i + 1; j < roomCases.length; j++) {
                if (casesOverlap(roomCases[i], roomCases[j])) {
                    const case1El = document.querySelector(`[data-case-id="${roomCases[i].id}"]`);
                    const case2El = document.querySelector(`[data-case-id="${roomCases[j].id}"]`);
                    if (case1El) case1El.classList.add('overlap');
                    if (case2El) case2El.classList.add('overlap');
                }
            }
        }
    });
}

function casesOverlap(case1, case2) {
    const start1 = timeSlots.indexOf(case1.startTime);
    const end1 = start1 + Math.ceil(case1.duration / 30);
    const start2 = timeSlots.indexOf(case2.startTime);
    const end2 = start2 + Math.ceil(case2.duration / 30);

    return !(end1 <= start2 || end2 <= start1);
}

// Modal functions
function openAddCaseModal() {
    const modal = document.getElementById('addCaseModal');
    modal.style.display = 'block';

    // Prevent body scroll on mobile when modal is open
    document.body.style.overflow = 'hidden';

    // Focus on first input for better mobile UX
    setTimeout(() => {
        const firstInput = modal.querySelector('select, input');
        if (firstInput) {
            firstInput.focus();
        }
    }, 100);
}

function closeAddCaseModal() {
    const modal = document.getElementById('addCaseModal');
    modal.style.display = 'none';
    document.getElementById('casePatientName').value = '';

    // Restore body scroll
    document.body.style.overflow = 'auto';
}

function addCase() {
    const serviceId = document.getElementById('caseService').value;
    const patientName = document.getElementById('casePatientName').value.trim();
    const roomId = document.getElementById('caseRoom').value;
    const startTime = document.getElementById('caseStartTime').value;
    const duration = parseInt(document.getElementById('caseDuration').value);
    const providerId = document.getElementById('caseProvider').value;

    if (!serviceId) {
        alert('Please select a service');
        return;
    }

    if (!patientName) {
        alert('Please enter a patient name');
        return;
    }

    if (!providerId) {
        alert('Please select a provider');
        return;
    }

    // Validate room-service combination against room constraints
    if (roomConstraints && Object.keys(roomConstraints).length > 0) {
        const allowedServices = roomConstraints[roomId];
        if (!allowedServices || !allowedServices.includes(serviceId)) {
            alert('This service cannot be performed in the selected room. Please select a different room or service.');
            return;
        }
    }

    // Validate provider-service combination against constraints
    if (constraints && Object.keys(constraints).length > 0) {
        const allowedServices = constraints[providerId];
        if (!allowedServices || !allowedServices.includes(serviceId)) {
            alert('This provider is not qualified to provide the selected service. Please select a different provider or service.');
            return;
        }
    }

    // Get service duration if not manually set
    const selectedService = services.find(s => s.id === serviceId);
    const finalDuration = duration || (selectedService ? selectedService.duration : 30);

    const newCase = {
        id: Date.now().toString(),
        serviceId: serviceId,
        patientName: patientName,
        roomId: roomId,
        startTime: startTime,
        duration: finalDuration,
        providerId: providerId
    };

    cases.push(newCase);
    renderCases();
    closeAddCaseModal();
}

// JSON file handling
document.getElementById('jsonFile').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            console.log('Loading JSON file:', file.name);
            const data = JSON.parse(e.target.result);
            console.log('JSON parsed successfully:', data);

            // Handle JSON format with providers, services, rooms, constraints, and roomConstraints
            if (data.cases && data.providers && data.services && data.rooms && data.constraints && data.roomConstraints) {
                cases = data.cases;
                providers = data.providers;
                services = data.services;
                rooms = data.rooms;
                constraints = data.constraints;
                roomConstraints = data.roomConstraints;

                console.log('Data loaded:', {
                    cases: cases.length,
                    providers: providers.length,
                    services: services.length,
                    rooms: rooms.length,
                    constraints: Object.keys(constraints).length,
                    roomConstraints: Object.keys(roomConstraints).length
                });
            } else {
                const missing = [];
                if (!data.cases) missing.push('cases');
                if (!data.providers) missing.push('providers');
                if (!data.services) missing.push('services');
                if (!data.rooms) missing.push('rooms');
                if (!data.constraints) missing.push('constraints');
                if (!data.roomConstraints) missing.push('roomConstraints');

                alert(`Invalid JSON format. Missing required properties: ${missing.join(', ')}`);
                console.error('Missing properties:', missing);
                return;
            }

            populateProviderDropdown();
            populateServiceDropdown();
            populateRoomDropdown();
            validateExistingCases();

            // Re-initialize the schedule with the loaded rooms data
            initSchedule();

            // Re-add drop zones to the newly created time slots
            addDropZones();

            // Re-add event listeners for the form dropdowns
            addFormEventListeners();

            console.log('Schedule loaded successfully');
        } catch (error) {
            console.error('Error loading JSON:', error);
            alert('Error parsing JSON file: ' + error.message + '\n\nCheck the browser console for more details.');
        }
    };
    reader.readAsText(file);
});

// Populate provider dropdown based on selected service
function populateProviderDropdown(selectedServiceId = null) {
    const providerSelect = document.getElementById('caseProvider');
    providerSelect.innerHTML = '<option value="">Select a provider</option>';

    let availableProviders = providers;

    // Filter providers based on constraints if a service is selected
    if (selectedServiceId && constraints && Object.keys(constraints).length > 0) {
        availableProviders = providers.filter(provider => {
            const allowedServices = constraints[provider.id];
            return allowedServices && allowedServices.includes(selectedServiceId);
        });
    }

    availableProviders.forEach(provider => {
        const option = document.createElement('option');
        option.value = provider.id;
        option.textContent = `${provider.name} (${provider.title})`;
        providerSelect.appendChild(option);
    });

    // If no providers are available for the selected service, show a message
    if (selectedServiceId && availableProviders.length === 0) {
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "No providers available for this service";
        option.disabled = true;
        providerSelect.appendChild(option);
    }
}

// Populate service dropdown based on selected room
function populateServiceDropdown(selectedRoomId = null, preserveSelection = null) {
    const serviceSelect = document.getElementById('caseService');
    const currentSelection = preserveSelection || serviceSelect.value;
    serviceSelect.innerHTML = '<option value="">Select a service</option>';

    let availableServices = services;

    // Filter services based on room constraints if a room is selected
    if (selectedRoomId && roomConstraints && Object.keys(roomConstraints).length > 0) {
        availableServices = services.filter(service => {
            const allowedServices = roomConstraints[selectedRoomId];
            return allowedServices && allowedServices.includes(service.id);
        });
    }

    availableServices.forEach(service => {
        const option = document.createElement('option');
        option.value = service.id;
        option.textContent = `${service.name} (${service.duration}min)`;
        serviceSelect.appendChild(option);
    });

    // If no services are available for the selected room, show a message
    if (selectedRoomId && availableServices.length === 0) {
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "No services available for this room";
        option.disabled = true;
        serviceSelect.appendChild(option);
    }

    // Restore the previous selection if it's still valid
    if (currentSelection && availableServices.some(service => service.id === currentSelection)) {
        serviceSelect.value = currentSelection;
    }
}

// Populate room dropdown based on selected service
function populateRoomDropdown(selectedServiceId = null, preserveSelection = null) {
    const roomSelect = document.getElementById('caseRoom');
    const currentSelection = preserveSelection || roomSelect.value;
    roomSelect.innerHTML = '<option value="">Select a room</option>';

    let availableRooms = rooms;

    // Filter rooms based on room constraints if a service is selected
    if (selectedServiceId && roomConstraints && Object.keys(roomConstraints).length > 0) {
        availableRooms = rooms.filter(room => {
            const allowedServices = roomConstraints[room.id];
            return allowedServices && allowedServices.includes(selectedServiceId);
        });
    }

    availableRooms.forEach(room => {
        const option = document.createElement('option');
        option.value = room.id;
        option.textContent = `${room.name} - ${room.description}`;
        roomSelect.appendChild(option);
    });

    // If no rooms are available for the selected service, show a message
    if (selectedServiceId && availableRooms.length === 0) {
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "No rooms available for this service";
        option.disabled = true;
        roomSelect.appendChild(option);
    }

    // Restore the previous selection if it's still valid
    if (currentSelection && availableRooms.some(room => room.id === currentSelection)) {
        roomSelect.value = currentSelection;
    }
}

// Validate existing cases against constraints
function validateExistingCases() {
    const invalidProviderCases = [];
    const invalidRoomCases = [];

    cases.forEach(caseData => {
        // Check provider-service constraints
        if (constraints && Object.keys(constraints).length > 0 && caseData.providerId && caseData.serviceId) {
            const allowedServices = constraints[caseData.providerId];
            if (!allowedServices || !allowedServices.includes(caseData.serviceId)) {
                invalidProviderCases.push(caseData);
            }
        }

        // Check room-service constraints
        if (roomConstraints && Object.keys(roomConstraints).length > 0 && caseData.roomId && caseData.serviceId) {
            const allowedServices = roomConstraints[caseData.roomId];
            if (!allowedServices || !allowedServices.includes(caseData.serviceId)) {
                invalidRoomCases.push(caseData);
            }
        }
    });

    let warningMessage = '';

    if (invalidProviderCases.length > 0) {
        const caseTitles = invalidProviderCases.map(c => {
            const service = services.find(s => s.id === c.serviceId);
            const provider = providers.find(p => p.id === c.providerId);
            return `${service ? service.name : 'Unknown Service'} - ${c.patientName} (${provider ? provider.name : 'Unknown Provider'})`;
        }).join('\n');

        warningMessage += `Warning: The following cases have invalid provider-service combinations:\n\n${caseTitles}\n\n`;
    }

    if (invalidRoomCases.length > 0) {
        const caseTitles = invalidRoomCases.map(c => {
            const service = services.find(s => s.id === c.serviceId);
            const room = rooms.find(r => r.id === c.roomId);
            return `${service ? service.name : 'Unknown Service'} - ${c.patientName} (${room ? room.name : 'Unknown Room'})`;
        }).join('\n');

        warningMessage += `Warning: The following cases have invalid room-service combinations:\n\n${caseTitles}\n\n`;
    }

    if (warningMessage) {
        warningMessage += 'These cases will be displayed but may need to be corrected.';
        alert(warningMessage);
    }
}

// Export schedule as JSON
function exportSchedule() {
    const exportData = {
        providers: providers,
        services: services,
        rooms: rooms,
        roomConstraints: roomConstraints,
        constraints: constraints,
        cases: cases
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'schedule.json';
    link.click();
    URL.revokeObjectURL(url);
}

// Add event listeners for form dropdowns
function addFormEventListeners() {
    // Remove existing event listeners by cloning the elements
    const roomSelect = document.getElementById('caseRoom');
    const serviceSelect = document.getElementById('caseService');

    const newRoomSelect = roomSelect.cloneNode(true);
    const newServiceSelect = serviceSelect.cloneNode(true);

    roomSelect.parentNode.replaceChild(newRoomSelect, roomSelect);
    serviceSelect.parentNode.replaceChild(newServiceSelect, serviceSelect);

    // Add event listener for room selection to update service dropdown
    newRoomSelect.addEventListener('change', function () {
        const selectedRoomId = this.value;
        const selectedServiceId = newServiceSelect.value;

        // Update services based on room selection, preserving current selection if valid
        populateServiceDropdown(selectedRoomId, selectedServiceId);

        // Update providers based on current service selection
        if (selectedServiceId) {
            populateProviderDropdown(selectedServiceId);
        } else {
            document.getElementById('caseProvider').innerHTML = '<option value="">Select a provider</option>';
        }
    });

    // Add event listener for service selection to update room and provider dropdowns
    newServiceSelect.addEventListener('change', function () {
        const selectedServiceId = this.value;
        const selectedRoomId = newRoomSelect.value;

        // Update rooms based on service selection, preserving current selection if valid
        populateRoomDropdown(selectedServiceId, selectedRoomId);

        // Update providers based on current service selection
        if (selectedServiceId) {
            populateProviderDropdown(selectedServiceId);
        } else {
            document.getElementById('caseProvider').innerHTML = '<option value="">Select a provider</option>';
        }
    });
}

// Load mental health JSON by default
function loadMentalHealthJSON() {
    fetch('mental-health-cases-with-providers.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Loading mental health JSON file by default');
            console.log('JSON parsed successfully:', data);

            // Handle JSON format with providers, services, rooms, constraints, and roomConstraints
            if (data.cases && data.providers && data.services && data.rooms && data.constraints && data.roomConstraints) {
                cases = data.cases;
                providers = data.providers;
                services = data.services;
                rooms = data.rooms;
                constraints = data.constraints;
                roomConstraints = data.roomConstraints;

                console.log('Data loaded:', {
                    cases: cases.length,
                    providers: providers.length,
                    services: services.length,
                    rooms: rooms.length,
                    constraints: Object.keys(constraints).length,
                    roomConstraints: Object.keys(roomConstraints).length
                });
            } else {
                const missing = [];
                if (!data.cases) missing.push('cases');
                if (!data.providers) missing.push('providers');
                if (!data.services) missing.push('services');
                if (!data.rooms) missing.push('rooms');
                if (!data.constraints) missing.push('constraints');
                if (!data.roomConstraints) missing.push('roomConstraints');

                console.error('Invalid JSON format. Missing required properties:', missing);
                return;
            }

            populateProviderDropdown();
            populateServiceDropdown();
            populateRoomDropdown();
            validateExistingCases();

            // Re-initialize the schedule with the loaded rooms data
            initSchedule();

            // Re-add drop zones to the newly created time slots
            addDropZones();

            // Re-add event listeners for the form dropdowns
            addFormEventListeners();

            console.log('Mental health schedule loaded successfully');
        })
        .catch(error => {
            console.error('Error loading mental health JSON:', error);
            console.log('Continuing without default data - user can still load JSON manually');
        });
}

// Add click outside modal to close functionality
function addModalClickOutsideHandler() {
    const modal = document.getElementById('addCaseModal');
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            closeAddCaseModal();
        }
    });
}

// Add scroll indicators for mobile timeline (removed arrow buttons)
function addScrollIndicators() {
    // Function kept for compatibility but no longer adds arrow buttons
    // Horizontal scrolling is still enabled through CSS
    return;
}

// Handle window resize to update case display
function handleWindowResize() {
    // Re-render cases when switching between mobile and desktop
    renderCases();
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    console.log('Initializing application...');

    try {
        // Don't initialize schedule until rooms are loaded
        addDropZones();
        populateProviderDropdown();
        populateServiceDropdown();
        populateRoomDropdown();
        addFormEventListeners();
        addModalClickOutsideHandler();
        addScrollIndicators();

        // Add window resize listener
        window.addEventListener('resize', handleWindowResize);

        // Load mental health JSON by default
        loadMentalHealthJSON();

        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        alert('Error initializing application: ' + error.message);
    }
});
