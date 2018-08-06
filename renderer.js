const { remote } = require('electron');
const settings = require('electron-settings');
const { app, Menu, MenuItem } = remote;

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
    $('#countdownBackground').css('background-image', function (i, src) {
        var bg = settings.get('app-background');
        if (!bg) return 'url("./zz47.jpg")';
        return `url("${bg}")`;
    });
}

function applyBackground(file) {
    var reader = new FileReader();
    reader.addEventListener("load", function () {
        settings.set('app-background', reader.result);

        setupBackground();
    }, false);
    reader.readAsDataURL(file);
}

function resetBackground() {
    settings.delete('app-background');

    setupBackground();
}

function toggleFrameless() {
    settings.set('frameless', !(settings.get('frameless') == true));

    remote.app.relaunch();
    remote.app.exit(0);
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
    window.addEventListener('contextmenu', (e) => {
        e.preventDefault();

        let frameless = settings.get('frameless') == true;

        const menu = new Menu();
        menu.append(new MenuItem({ label: `高考倒计时`, enabled: false }));
        menu.append(new MenuItem({ type: 'separator' }));
        menu.append(new MenuItem({ label: '还原背景', click: resetBackground }));
        menu.append(new MenuItem({ type: 'checkbox', label: '无边框', checked: frameless, click: toggleFrameless }));
        menu.append(new MenuItem({ type: 'separator' }));
        menu.append(new MenuItem({ label: '退出', click: function () { app.exit(0); } }));
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
        setupCountdown();
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