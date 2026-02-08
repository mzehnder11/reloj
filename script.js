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

// --- Idle Timer & Auto Revert ---
var idleTimer;
var scrollContainer = document.getElementById('main-scroll');

function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () {
        // If user scrolled down (scrollTop > 50 to allow small accidental scrolls)
        if (scrollContainer.scrollTop > 50) {
            scrollContainer.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }, 10000); // 10 seconds
}

// Listen for interactions to reset timer
var events = ['mousemove', 'touchstart', 'click', 'scroll', 'keydown'];
for (var i = 0; i < events.length; i++) {
    window.addEventListener(events[i], resetIdleTimer);
}

// --- Weather Logic ---

// WMO Code Map
function getWeatherIcon(code) {
    if (code === 0) return '☀️';
    if (code >= 1 && code <= 3) return '☁️';
    if (code === 45 || code === 48) return '🌫️';
    if (code >= 51 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 82) return '🌦️';
    if (code === 85 || code === 86) return '🌨️';
    if (code >= 95 && code <= 99) return '⛈️';
    return '❓';
}

function getWeatherDescription(code) {
    if (code === 0) return 'Klar';
    if (code >= 1 && code <= 3) return 'Bewölkt';
    if (code === 45 || code === 48) return 'Nebel';
    if (code >= 51 && code <= 67) return 'Regen';
    if (code >= 71 && code <= 77) return 'Schnee';
    if (code >= 95) return 'Gewitter';
    return 'Unbeständig';
}

function getDayName(dateStr) {
    var date = new Date(dateStr);
    var days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    return days[date.getDay()];
}

function formatHour(timeStr) {
    var parts = timeStr.split('T');
    if (parts.length > 1) {
        return parts[1].substring(0, 5);
    }
    return timeStr;
}

function updateWeatherUI(data) {
    var currentTemp = Math.round(data.current.temperature_2m);
    var currentCode = data.current.weather_code;

    document.getElementById('current-temp').innerText = currentTemp + '°';
    document.getElementById('current-icon').innerText = getWeatherIcon(currentCode);
    document.getElementById('weather-summary').innerText = getWeatherDescription(currentCode);
    document.getElementById('weather-location').innerText = 'Solothurn';

    // --- Hourly Forecast (Full Hours) ---
    var hourlyList = document.getElementById('hourly-list');
    if (hourlyList) {
        hourlyList.innerHTML = '';

        // Use exact LOCAL time string to find the start index
        var now = new Date();
        var y = now.getFullYear();
        var m = padZero(now.getMonth() + 1);
        var d = padZero(now.getDate());
        var h = padZero(now.getHours());
        var localSearchStr = y + '-' + m + '-' + d + 'T' + h + ':00';

        var startIndex = 0;
        for (var j = 0; j < data.hourly.time.length; j++) {
            // Check if this time matches or is just after our local hour
            if (data.hourly.time[j] >= localSearchStr) {
                startIndex = j;
                break;
            }
        }

        // Display next 24 full hours
        for (var i = startIndex; i < startIndex + 24 && i < data.hourly.time.length; i++) {
            var hrItem = document.createElement('div');
            hrItem.className = 'hourly-item';
            hrItem.innerHTML =
                '<div class="hourly-time">' + formatHour(data.hourly.time[i]) + '</div>' +
                '<div class="hourly-icon">' + getWeatherIcon(data.hourly.weather_code[i]) + '</div>' +
                '<div class="hourly-temp">' + Math.round(data.hourly.temperature_2m[i]) + '°</div>';
            hourlyList.appendChild(hrItem);
        }
    }

    // --- Daily Forecast ---
    var forecastList = document.getElementById('forecast-list');
    if (forecastList) {
        forecastList.innerHTML = '';
        for (var i = 1; i <= 6; i++) {
            var item = document.createElement('div');
            item.className = 'forecast-item';
            item.innerHTML =
                '<div class="forecast-day">' + getDayName(data.daily.time[i]) + '</div>' +
                '<div class="forecast-icon">' + getWeatherIcon(data.daily.weather_code[i]) + '</div>' +
                '<div class="forecast-temp">' + Math.round(data.daily.temperature_2m_max[i]) + '° <span class="forecast-low">' + Math.round(data.daily.temperature_2m_min[i]) + '°</span></div>';
            forecastList.appendChild(item);
        }
    }
}

function fetchWeather(forceHttp) {
    var lat = '47.2088';
    var lon = '7.5323';

    // Hardcoding timezone to Europe/Berlin to avoid 'auto' lookup issues on old devices
    // Trying HTTPS first, but allowing toggle to HTTP
    var protocol = forceHttp ? 'http://' : 'https://';
    var url = protocol + 'api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
        '&current=temperature_2m,weather_code' +
        '&hourly=temperature_2m,weather_code' +
        '&daily=weather_code,temperature_2m_max,temperature_2m_min' +
        '&timezone=Europe%2FBerlin';

    var xhr = new XMLHttpRequest();
    // Using onreadystatechange for widest compatibility
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    updateWeatherUI(JSON.parse(xhr.responseText));
                } catch (e) {
                    document.getElementById('weather-summary').innerText = 'JSON Fehler';
                }
            } else {
                // If 'Fehler 0' occurs on https, immediately try http
                if (xhr.status === 0 && !forceHttp) {
                    fetchWeather(true);
                } else {
                    var msg = 'Fehler ' + xhr.status;
                    if (xhr.status === 0) msg += ' (Blockiert?)';
                    document.getElementById('weather-summary').innerText = msg;
                }
            }
        }
    };

    try {
        xhr.open('GET', url, true);
        // Do not set custom headers to avoid pre-flight CORS issues on old Safari
        xhr.send();
    } catch (e) {
        if (!forceHttp) fetchWeather(true);
        else document.getElementById('weather-summary').innerText = 'Systemfehler';
    }
}

// --- Smooth Scroll & Snap Fallback for iOS 9 ---
var scrollContainer = document.getElementById('main-scroll');
var isAnimating = false;

function smoothScrollTo(targetY) {
    if (isAnimating) return;
    isAnimating = true;

    var startY = scrollContainer.scrollTop;
    var duration = 400; // ms
    var startTime = new Date().getTime();

    function animate() {
        var now = new Date().getTime();
        var elapsed = now - startTime;
        var progress = Math.min(elapsed / duration, 1);

        // Easing function: easeInOutQuad
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

// Touch support for snap
scrollContainer.addEventListener('touchend', function () {
    // Small delay to let inertia settle or start
    setTimeout(function () {
        if (!isAnimating) {
            var h = window.innerHeight;
            var current = scrollContainer.scrollTop;
            var target = Math.round(current / h) * h;
            smoothScrollTo(target);
        }
    }, 400); // Slightly longer delay to allow inertia to start
});

// Initial calls
fetchWeather(false);
setInterval(function () { fetchWeather(false); }, 3600000);
