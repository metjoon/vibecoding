document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('urlInput');
    const generateBtn = document.getElementById('generateBtn');
    const qrcodeElement = document.getElementById('qrcode');
    const qrContainer = document.getElementById('qrContainer');
    const actionButtons = document.getElementById('actionButtons');
    const downloadBtn = document.getElementById('downloadBtn');

    let qrcode = null;

    function generateQR() {
        const url = urlInput.value.trim();
        
        if (!url) {
            clearQR();
            return;
        }

        // Clear previous QR code if it exists
        if (qrcode) {
            qrcode.clear();
            qrcodeElement.innerHTML = '';
        }

        // Add active class to container to hide placeholder
        qrContainer.classList.add('active');
        actionButtons.classList.remove('hidden');
        actionButtons.style.display = 'flex';

        // Generate new QR Code
        qrcode = new QRCode(qrcodeElement, {
            text: url,
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }

    function clearQR() {
        if (qrcode) {
            qrcode.clear();
            qrcodeElement.innerHTML = '';
            qrcode = null;
        }
        qrContainer.classList.remove('active');
        actionButtons.classList.add('hidden');
        setTimeout(() => {
            if(actionButtons.classList.contains('hidden')) {
                actionButtons.style.display = 'none';
            }
        }, 300);
    }

    // Event Listeners
    generateBtn.addEventListener('click', generateQR);

    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            generateQR();
        }
    });

    // Optional: Auto generate when typing stops
    let timeout = null;
    urlInput.addEventListener('input', () => {
        clearTimeout(timeout);
        
        if (urlInput.value.trim() === '') {
            clearQR();
        } else {
            timeout = setTimeout(() => {
                generateQR();
            }, 500); // 500ms delay after typing stops
        }
    });

    // Download functionality
    downloadBtn.addEventListener('click', () => {
        const img = qrcodeElement.querySelector('img');
        if (img) {
            const link = document.createElement('a');
            link.href = img.src;
            link.download = 'qrcode.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });
});
