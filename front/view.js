// view.js

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Get URL Parameters ---
    const urlParams = new URLSearchParams(window.location.search);

    const imageId = urlParams.get('id'); // ID required for the Edit route
    const imageUrl = urlParams.get('img');
    const imageName = urlParams.get('name') || 'Artwork';
    const imageDesc = urlParams.get('desc');

    // --- 2. DOM Elements for Display ---
    const displayImg = document.getElementById('display-image');
    const displayName = document.getElementById('display-name');
    const displayDesc = document.getElementById('display-desc');

    // Download Buttons
    const btnPng = document.getElementById('btn-download-png');
    const btnPdf = document.getElementById('btn-download-pdf');

    // --- 3. Initial Display Setup ---
    if (imageUrl && imageName) {
        displayImg.src = imageUrl;
        displayImg.alt = imageName;
        displayName.textContent = imageName;
        displayDesc.textContent = imageDesc;
    } else {
        displayName.textContent = "Image Not Found";
        displayDesc.textContent = "Please return to the gallery.";
        displayImg.style.display = "none";
        if (btnPng) btnPng.style.display = "none";
        if (btnPdf) btnPdf.style.display = "none";
    }

    // --- 4. Download as High Quality Image (PNG/JPG Original) ---
    if (btnPng) {
        btnPng.addEventListener('click', async () => {
            btnPng.textContent = "Downloading...";
            try {
                // Fetch the current image source (handles newly edited images too)
                const response = await fetch(displayImg.src);
                const blob = await response.blob();

                const blobUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = blobUrl;

                const cleanName = displayName.textContent.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                a.download = `${cleanName}_high_res.png`;

                document.body.appendChild(a);
                a.click();

                window.URL.revokeObjectURL(blobUrl);
                document.body.removeChild(a);
            } catch (error) {
                console.error("Download failed", error);
                alert("Failed to download image. Make sure your local server is running.");
            } finally {
                btnPng.textContent = "↓ Highest Quality PNG";
            }
        });
    }

    // --- 5. Download as PDF ---
    if (btnPdf) {
        btnPdf.addEventListener('click', () => {
            btnPdf.textContent = "Generating PDF...";

            try {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'px',
                    format: 'a4'
                });

                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();

                const imgWidth = displayImg.naturalWidth;
                const imgHeight = displayImg.naturalHeight;
                const ratio = Math.min((pageWidth - 40) / imgWidth, (pageHeight - 100) / imgHeight);

                const finalWidth = imgWidth * ratio;
                const finalHeight = imgHeight * ratio;

                const xOffset = (pageWidth - finalWidth) / 2;

                pdf.addImage(displayImg, 'PNG', xOffset, 40, finalWidth, finalHeight);

                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(18);
                pdf.text(displayName.textContent, 20, finalHeight + 70);

                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(12);
                pdf.setTextColor(100);
                pdf.text(displayDesc.textContent || "", 20, finalHeight + 90, { maxWidth: pageWidth - 40 });

                const cleanName = displayName.textContent.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                pdf.save(`${cleanName}_presentation.pdf`);

            } catch (error) {
                console.error("PDF generation failed", error);
                alert("Failed to generate PDF. Make sure the image has fully loaded.");
            } finally {
                btnPdf.textContent = "↓ Save as PDF";
            }
        });
    }

    // --- 6. Edit Feature Logic ---
    const btnEdit = document.getElementById('btn-edit');
    const editModal = document.getElementById('edit-modal');
    const closeEditBtn = document.getElementById('close-edit-modal');
    const editNameInput = document.getElementById('edit-name');
    const editDescInput = document.getElementById('edit-desc');
    const editFileInput = document.getElementById('edit-image-upload');
    const editFileLabel = document.getElementById('edit-file-label');
    const updateBtn = document.getElementById('update-btn');

    // Make sure the elements exist in HTML before adding listeners
    if (btnEdit && editModal) {

        // Open Modal and pre-fill data
        btnEdit.addEventListener('click', () => {
            editNameInput.value = displayName.textContent;
            editDescInput.value = displayDesc.textContent;
            editModal.classList.add('active');
        });

        // Close Modal logic
        closeEditBtn.addEventListener('click', () => editModal.classList.remove('active'));
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) editModal.classList.remove('active');
        });

        // Update File Label Visuals when a new image is selected
        editFileInput.addEventListener('change', function () {
            if (this.files && this.files.length > 0) {
                editFileLabel.textContent = "New Photo Selected ✦";
                editFileLabel.style.borderColor = "var(--accent)";
                editFileLabel.style.color = "var(--accent)";
            } else {
                editFileLabel.textContent = "Change Photo (Optional)";
                // Reset to standard outline styles
                editFileLabel.style.borderColor = "";
                editFileLabel.style.color = "";
            }
        });

        // Save Changes to Backend
        // Save Changes to Backend (Upgraded Version)
        updateBtn.addEventListener('click', async () => {
            // 1. Check if ID exists
            if (!imageId) {
                alert("Cannot edit: Image ID missing. Please return to the gallery and click the image again.");
                return;
            }

            const nameVal = editNameInput.value.trim();
            const descVal = editDescInput.value.trim();
            const file = editFileInput.files[0];

            // 2. Validate text inputs
            if (!nameVal || !descVal) {
                alert("Please provide both a Title and a Story.");
                return;
            }

            // 3. UI Loading State
            const originalBtnText = updateBtn.textContent;
            updateBtn.textContent = "Saving Changes...";
            updateBtn.disabled = true;

            // 4. Prepare Data
            const formData = new FormData();
            formData.append('name', nameVal);
            formData.append('description', descVal);
            if (file) {
                formData.append('image', file);
            }

            try {
                console.log(`Attempting to update image ID: ${imageId}...`);

                const response = await fetch(`http://127.0.0.1:5000/edit/${imageId}`, {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const updatedData = await response.json();
                    console.log("Update successful:", updatedData);

                    // 5. Update the page immediately 
                    displayName.textContent = updatedData.name;
                    displayDesc.textContent = updatedData.description;

                    // CACHE-BUSTER: Forces the browser to load the new image instead of the old one
                    const cacheBuster = new Date().getTime();
                    displayImg.src = `${updatedData.imageUrl}?t=${cacheBuster}`;

                    // 6. Update the browser URL quietly
                    const newUrl = new URL(window.location);
                    newUrl.searchParams.set('name', updatedData.name);
                    newUrl.searchParams.set('desc', updatedData.description);
                    newUrl.searchParams.set('img', updatedData.imageUrl);
                    window.history.replaceState({}, '', newUrl);

                    // 7. Close modal and clean up
                    editModal.classList.remove('active');
                    editFileInput.value = '';
                    editFileLabel.textContent = "Change Photo (Optional)";
                    editFileLabel.style.borderColor = "";
                    editFileLabel.style.color = "";

                } else {
                    const errorText = await response.text();
                    console.error("Server Error:", errorText);
                    alert(`Error saving to database. Server says: ${response.status}`);
                }
            } catch (error) {
                console.error("Network or Fetch Error:", error);
                alert("Failed to reach the server. Make sure your Python app is running.");
            } finally {
                // Restore button state
                updateBtn.textContent = originalBtnText;
                updateBtn.disabled = false;
            }
        });
    }
});