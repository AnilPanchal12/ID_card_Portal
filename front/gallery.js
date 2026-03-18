

// gallery.js

const nameInput = document.getElementById('img-name');
const descInput = document.getElementById('img-desc');
const fileInput = document.getElementById('image-upload');
const fileLabel = document.getElementById('file-label');
const saveBtn = document.getElementById('save-btn');
const galleryContainer = document.getElementById('gallery');

// Modal Elements
const openModalBtn = document.getElementById('open-add-modal');
const closeModalBtn = document.getElementById('close-modal');
const modalOverlay = document.getElementById('upload-modal');

const API_URL = 'http://127.0.0.1:5000';

// --- Modal Logic ---
function openModal() {
    modalOverlay.classList.add('active');
}

function closeModal() {
    modalOverlay.classList.remove('active');
}

openModalBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);

// Close modal if user clicks on the blurry background outside the box
modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) {
        closeModal();
    }
});

// Visual feedback when an image is selected
fileInput.addEventListener('change', function () {
    if (this.files && this.files.length > 0) {
        fileLabel.textContent = "Photo Selected ✦";
        fileLabel.classList.add('has-file');
    } else {
        fileLabel.textContent = "Choose Photo";
        fileLabel.classList.remove('has-file');
    }
});

// Create the aesthetic card
function renderCard(data) {
    const card = document.createElement('div');
    card.className = 'image-card';

    const delay = (galleryContainer.children.length % 10) * 0.1;
    card.style.animationDelay = `${delay}s`;

    // Inside gallery.js -> renderCard(data)

    const safeUrl = encodeURIComponent(data.imageUrl);
    const safeName = encodeURIComponent(data.name);
    const safeDesc = encodeURIComponent(data.description);

    // MAKE SURE THIS LINE HAS id=${data.id}

    // Instead of view.html, point back to index if needed, or point to view.html
    const viewPageLink = `view.html?id=${data.id}&img=${safeUrl}&name=${safeName}&desc=${safeDesc}`;
    card.innerHTML = `
        <a href="${viewPageLink}" style="text-decoration: none; color: inherit;">
            <div class="image-container">
                <img src="${data.imageUrl}" alt="${data.name}">
            </div>
            <div class="card-info">
                <h3>${data.name}</h3>
                <p>${data.description}</p>
            </div>
        </a>
    `;

    galleryContainer.prepend(card);
}

// Fetch images from backend
async function loadGallery() {
    galleryContainer.innerHTML = '';
    try {
        const response = await fetch(`${API_URL}/images`);
        const images = await response.json();
        images.reverse().forEach(data => renderCard(data));
    } catch (error) {
        console.error("Error loading gallery:", error);
    }
}

// Save to backend
saveBtn.addEventListener('click', async function () {
    const nameVal = nameInput.value.trim();
    const descVal = descInput.value.trim();
    const file = fileInput.files[0];

    if (!nameVal || !descVal || !file) {
        alert("Please provide a title, a story, and a photo.");
        return;
    }

    const originalBtnText = saveBtn.textContent;
    saveBtn.textContent = "Adding...";
    saveBtn.disabled = true;

    const formData = new FormData();
    formData.append('name', nameVal);
    formData.append('description', descVal);
    formData.append('image', file);

    try {
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const newProject = await response.json();
            newProject.imageUrl = `${API_URL}/uploads/${newProject.filename}`;
            renderCard(newProject);

            // Reset form
            nameInput.value = '';
            descInput.value = '';
            fileInput.value = '';
            fileLabel.textContent = "Choose Photo";
            fileLabel.classList.remove('has-file');

            // Successfully uploaded! Close the modal automatically
            closeModal();

        } else {
            alert("Error uploading image.");
        }
    } catch (error) {
        console.error("Error saving to database:", error);
    } finally {
        saveBtn.textContent = originalBtnText;
        saveBtn.disabled = false;
    }
});

loadGallery();