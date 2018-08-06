const { remote } = require('electron');
const { Menu, MenuItem } = remote;

window.$ = window.jQuery = require('jquery');
require('flipclock');
require('datejs');

function setupCountdown() {
    var now = new Date()
    var nextDate = new Date()
    nextDate.setMonth(5) // June
    nextDate.setDate(7)
    nextDate.setHours(9)
    nextDate.setMinutes(0)
    nextDate.setSeconds(0)

    if (nextDate.getTime() < now.getTime()) {
        nextDate.setFullYear(now.getFullYear() + 1)
    }

    $('#countdownYear').text(function (i, oldtext) {
        return nextDate.getFullYear();
    })

    var countdownSeconds = (nextDate.getTime() - now.getTime()) / 1000;
    var clock = $('#countdownClock').FlipClock(countdownSeconds, {
        clockFace: 'DailyCounter',
        clockFaceOptions: {
            countdown: true,
            showSeconds: true,
            defaultLanguage: 'zh-cn',
            language: 'zh-cn',
        }
    });

    clock.face.once('stop', function () {
        setupCountdown();
    })
}

function setupBackground() {
    $('#countdownBackground').attr('src', function (i, src) {
        var bg = localStorage.getItem('app-background');
        if (!bg) return './zz47.jpg';
        return bg;
    });
}

function applyBackground(file) {
    var reader = new FileReader();
    reader.addEventListener("load", function () {
        localStorage.setItem('app-background', reader.result);

        setupBackground();
    }, false);
    reader.readAsDataURL(file);
}

function resetBackground() {
    localStorage.removeItem('app-background');

    setupBackground();
}

function dropImage(ev) {
    if (ev.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (var i = 0; i < ev.dataTransfer.items.length; i++) {
            // If dropped items aren't files, reject them
            if (ev.dataTransfer.items[i].kind === 'file') {
                var file = ev.dataTransfer.items[i].getAsFile();
                applyBackground(file);
                return;
            }
        }
    } else {
        // Use DataTransfer interface to access the file(s)
        for (var i = 0; i < ev.dataTransfer.files.length; i++) {
            applyBackground(ev.dataTransfer.files[i]);
            return;
        }
    }

    // Pass event to removeDragData for cleanup
    removeDragData(ev);
}

function removeDragData(ev) {
    console.log('Removing drag data')

    if (ev.dataTransfer.items) {
        // Use DataTransferItemList interface to remove the drag data
        ev.dataTransfer.items.clear();
    } else {
        // Use DataTransfer interface to remove the drag data
        ev.dataTransfer.clearData();
    }
}

function setupContextMenu() {
    const menu = new Menu();
    menu.append(new MenuItem({ label: `高考倒计时`, enabled: false }));
    menu.append(new MenuItem({ type: 'separator' }));
    menu.append(new MenuItem({ label: '还原背景', click() { resetBackground(); } }));

    window.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        menu.popup({ window: remote.getCurrentWindow() });
    }, false);
}

$(document).ready(function () {
    setupBackground();
    setupCountdown();
    setupContextMenu();

    // Restart every midnight to prevent from memory leaks and inaccurates
    var interval = Date.today().add(1).days().getTime() - Date.now();
    window.setInterval(function () {
        window.location.reload(true);
    }, interval);
});

document.addEventListener('drop', function (e) {
    e.preventDefault();
    e.stopPropagation();

    dropImage(e);
});
document.addEventListener('dragover', function (e) {
    e.preventDefault();
    e.stopPropagation();
});