// Helper for padding (since padStart is not in iOS 9)
function padZero(num) {
    var s = num.toString();
    if (s.length < 2) {
        return '0' + s;
    }
    return s;
}

function updateClock() {
    var now = new Date();

    // --- Digital Clock ---
    // Use helper instead of padStart
    var hours = padZero(now.getHours());
    var minutes = padZero(now.getMinutes());
    var seconds = padZero(now.getSeconds());

    var digitalMain = document.getElementById('digital-time-main');
    var digitalSeconds = document.getElementById('digital-time-seconds');

    // Check if elements exist before using them
    if (digitalMain && digitalSeconds) {
        // Use string concatenation instead of template literals
        digitalMain.innerText = hours + ':' + minutes;
        digitalSeconds.innerText = ':' + seconds; // Keeping the separator :
    }

    // --- Date ---
    var dateElement = document.getElementById('date-display');
    if (dateElement) {
        var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        // de-DE locale generally supported, might fall back on older iOS
        try {
            dateElement.innerText = now.toLocaleDateString('de-DE', options);
        } catch (e) {
            // Fallback for very old browsers if toLocaleDateString fails with options
            dateElement.innerText = now.toDateString();
        }
    }

    // --- Analog Clock ---
    var secondHand = document.getElementById('second-hand');
    var minuteHand = document.getElementById('minute-hand');
    var hourHand = document.getElementById('hour-hand');

    if (secondHand && minuteHand && hourHand) {
        var secondsValue = now.getSeconds();
        var minutesValue = now.getMinutes();
        var hoursValue = now.getHours();

        // Calculate degrees
        var secondsDeg = (secondsValue / 60) * 360;
        var minutesDeg = ((minutesValue / 60) * 360) + ((secondsValue / 60) * 6);
        var hoursDeg = ((hoursValue / 12) * 360) + ((minutesValue / 60) * 30);

        // Add -webkit- prefix for older iOS
        secondHand.style.webkitTransform = 'rotate(' + secondsDeg + 'deg)';
        secondHand.style.transform = 'rotate(' + secondsDeg + 'deg)';

        minuteHand.style.webkitTransform = 'rotate(' + minutesDeg + 'deg)';
        minuteHand.style.transform = 'rotate(' + minutesDeg + 'deg)';

        hourHand.style.webkitTransform = 'rotate(' + hoursDeg + 'deg)';
        hourHand.style.transform = 'rotate(' + hoursDeg + 'deg)';
    }
}

// Initial call
updateClock();

// Update every second
setInterval(updateClock, 1000);

// --- Idle Timer & Auto Reload ---
var idleTimer;
var scrollContainer = document.getElementById('main-scroll');

function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () {
        // If user is on page 2 (scrollTop > 50), reload the page
        if (scrollContainer.scrollTop > 50) {
            window.location.reload();
        }
    }, 10000); // 10 seconds
}

// Listen for interactions to reset timer
var events = ['mousemove', 'touchstart', 'click', 'scroll', 'keydown'];
for (var i = 0; i < events.length; i++) {
    window.addEventListener(events[i], resetIdleTimer);
}

// --- Calendar & World Clocks ---

var monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

function updateCalendar() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth();
    var today = now.getDate();

    // Update header
    var monthHeader = document.getElementById('calendar-month');
    if (monthHeader) {
        monthHeader.innerText = monthNames[month] + ' ' + year;
    }

    // Get first day of month and total days
    var firstDay = new Date(year, month, 1);
    var lastDay = new Date(year, month + 1, 0);
    var totalDays = lastDay.getDate();

    // Day of week for the 1st (0=Sunday, convert to Monday-start: 0=Monday)
    var startDay = firstDay.getDay();
    startDay = (startDay === 0) ? 6 : startDay - 1;

    var calendarDays = document.getElementById('calendar-days');
    if (calendarDays) {
        calendarDays.innerHTML = '';

        for (var e = 0; e < startDay; e++) {
            var emptyDiv = document.createElement('div');
            emptyDiv.className = 'calendar-day empty';
            calendarDays.appendChild(emptyDiv);
        }

        for (var d = 1; d <= totalDays; d++) {
            var dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.innerText = d;

            if (d === today) {
                dayDiv.className += ' today';
            }

            var dayOfWeek = (startDay + d - 1) % 7;
            if (dayOfWeek === 5 || dayOfWeek === 6) {
                dayDiv.className += ' weekend';
            }

            calendarDays.appendChild(dayDiv);
        }
    }
}

function updateWorldClocks() {
    var now = new Date();
    var utc = now.getTime() + (now.getTimezoneOffset() * 60000);

    // Timezone offsets in hours from UTC (standard time)
    // San Juan (Puerto Rico): UTC-4
    // New York: UTC-5 (EST)
    // Los Angeles: UTC-8 (PST)
    // Dubai: UTC+4
    var cities = [
        { id: 'time-sanjuan', offset: -4 },
        { id: 'time-newyork', offset: -5 },
        { id: 'time-losangeles', offset: -8 },
        { id: 'time-dubai', offset: 4 }
    ];

    for (var i = 0; i < cities.length; i++) {
        var city = cities[i];
        var cityTime = new Date(utc + (city.offset * 3600000));
        var hours = padZero(cityTime.getHours());
        var minutes = padZero(cityTime.getMinutes());

        var el = document.getElementById(city.id);
        if (el) {
            el.innerText = hours + ':' + minutes;
        }
    }
}

// Initialize calendar and world clocks
updateCalendar();
updateWorldClocks();

// Update world clocks every second
setInterval(updateWorldClocks, 1000);

// Update calendar every minute
setInterval(updateCalendar, 60000);

// --- Smooth Scroll & Snap Fallback for iOS 9 ---
var isAnimating = false;

function smoothScrollTo(targetY) {
    if (isAnimating) return;
    isAnimating = true;

    var startY = scrollContainer.scrollTop;
    var duration = 400;
    var startTime = new Date().getTime();

    function animate() {
        var now = new Date().getTime();
        var elapsed = now - startTime;
        var progress = Math.min(elapsed / duration, 1);

        var ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

        scrollContainer.scrollTop = startY + (targetY - startY) * ease;

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            isAnimating = false;
        }
    }
    requestAnimationFrame(animate);
}

var snapTimeout;
scrollContainer.addEventListener('scroll', function () {
    if (isAnimating) return;
    clearTimeout(snapTimeout);
    snapTimeout = setTimeout(function () {
        var h = window.innerHeight;
        var current = scrollContainer.scrollTop;
        var target = Math.round(current / h) * h;
        if (Math.abs(current - target) > 5) {
            smoothScrollTo(target);
        }
    }, 200);
});

scrollContainer.addEventListener('touchend', function () {
    setTimeout(function () {
        if (!isAnimating) {
            var h = window.innerHeight;
            var current = scrollContainer.scrollTop;
            var target = Math.round(current / h) * h;
            smoothScrollTo(target);
        }
    }, 400);
});
