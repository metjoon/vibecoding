document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Scroll Fade-in Animation ---
    const fadeElements = document.querySelectorAll('.fade-in');
    
    const checkFade = () => {
        const windowHeight = window.innerHeight;
        fadeElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            if (elementTop < windowHeight - 50) {
                element.classList.add('visible');
            }
        });
    };
    
    // Initial check
    checkFade();
    // Check on scroll
    window.addEventListener('scroll', checkFade);


    // --- 2. Countdown Timer ---
    // Target date: 2099-12-26 12:00:00
    const targetDate = new Date('2099-12-26T12:00:00').getTime();
    
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    const updateCountdown = () => {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
            daysEl.innerText = "00";
            hoursEl.innerText = "00";
            minutesEl.innerText = "00";
            secondsEl.innerText = "00";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        daysEl.innerText = days.toString().padStart(2, '0');
        hoursEl.innerText = hours.toString().padStart(2, '0');
        minutesEl.innerText = minutes.toString().padStart(2, '0');
        secondsEl.innerText = seconds.toString().padStart(2, '0');
    };

    // Update every second
    setInterval(updateCountdown, 1000);
    updateCountdown(); // Initial call


    // --- 3. Gallery Modal ---
    const modal = document.getElementById("image-modal");
    const modalImg = document.getElementById("modal-img");
    const closeBtn = document.getElementsByClassName("close")[0];
    const galleryItems = document.querySelectorAll(".gallery-item img");

    galleryItems.forEach(item => {
        item.onclick = function(){
            modal.style.display = "block";
            modalImg.src = this.src;
        }
    });

    closeBtn.onclick = function() {
        modal.style.display = "none";
    }

    modal.onclick = function(e) {
        if(e.target === modal) {
            modal.style.display = "none";
        }
    }
});

// --- 4. Copy Account Number ---
function copyAccount(accountNumber) {
    // Create a temporary textarea element to copy the text
    const el = document.createElement('textarea');
    el.value = accountNumber;
    document.body.appendChild(el);
    el.select();
    
    try {
        document.execCommand('copy');
        alert("계좌번호가 복사되었습니다: " + accountNumber);
    } catch (err) {
        alert("복사에 실패했습니다. 브라우저를 확인해주세요.");
    }
    
    document.body.removeChild(el);
}
