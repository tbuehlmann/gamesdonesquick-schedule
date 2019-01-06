// ==UserScript==
// @name         AGDQ-Starts-In
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adds a "Starts In" column to the gamesdonequick.com/schedule table. It's clickable and jumps to the current run.
// @author       Tobias Bühlmann
// @match        https://gamesdonequick.com/schedule
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var $ = window.jQuery;
    var table = $("#runTable");

    function jumpToCurrentlyRunning(table) {
        var target;
        var runsWithBlankStartsIn = table.find("td.starts-in").filter(function() { return this.innerText == "" });
        var lastRunWithBlankStartsIn = runsWithBlankStartsIn[runsWithBlankStartsIn.length - 1];

        if (lastRunWithBlankStartsIn) {
            target = $(lastRunWithBlankStartsIn).position().top;
            $("html").scrollTop(target);
        }
    };

    function addStartsInColumn(table) {
        // Add "Starts In" column
        table.find("thead tr").append("<td id='starts-in' title='Jump to current run' style='cursor: pointer;'>Starts In</td>")
        $("#starts-in").click(function() { jumpToCurrentlyRunning(table) });

        // Add empty cells for first rows (time, run game, runner, setup length)
        $("#runTable tbody tr").not(".day-split").not(".second-row").append("<td class='starts-in'></td>")

        // Add empty cells for second rows (length, run type, host)
        $("#runTable tbody tr.second-row").append("<td></td>")
    };

    function distanceOfTimeInWord(seconds) {
        seconds = Number(seconds);

        var days = Math.floor(seconds / (3600*24));
        var hours = Math.floor(seconds % (3600*24)/3600);
        var minutes = Math.floor(seconds % 3600/60);

        var daysDisplay = days > 0 ? days + (days == 1 ? " day" : " days") : "";
        var hoursDisplay = hours > 0 ? hours + (hours == 1 ? " hour" : " hours") : "";
        var minutesDisplay = minutes > 0 ? minutes + (minutes == 1 ? " minute" : " minutes") : "";

        return [daysDisplay, hoursDisplay, minutesDisplay].filter(Boolean).join(", ");
    };

    function monthNameToNumber(name) {
        var mapping = {
            "January": 0,
            "February": 1,
            "March": 2,
            "April": 3,
            "May": 4,
            "June": 5,
            "July": 6,
            "August": 7,
            "September": 8,
            "October": 9,
            "November": 10,
            "December": 11
        }

        return mapping[name];
    };

    function amPmTo24h(amPm, hour) {
        if (amPm == "AM") {
            return hour == 12 ? 0 : hour;
        } else {
            return hour == 12 ? 12 : hour + 12;
        }
    };

    function populateStartsIns(table) {
        var runYear = new Date().getFullYear();
        var runMonth;
        var runDay;
        var runHour;
        var runMinute;
        var runDate;
        var startsInSeconds;
        var now = new Date();

        table.find("tr").each(function(_index, tr) {
            var match;
            tr = $(tr);

            if (tr.hasClass("day-split")) {
                match = tr.find("td")[0].innerText.match(/(\w+)\s(\d+)/);

                // The header cell doesn't have a day
                if (match) {
                    runMonth = monthNameToNumber(match[1]);
                    runDay = parseInt(match[2]);
                }
            } else if (!tr.hasClass("second-row")) {
                match = tr.find("td.start-time")[0].innerText.match(/(\d+):(\d+) (\w+)/);
                runHour = amPmTo24h(match[3], parseInt(match[1]));
                runDate = new Date(runYear, runMonth, runDay, runHour, match[2]);

                if (runDate >= now) {
                    startsInSeconds = runDate.getTime()/1000 - now.getTime()/1000;
                    tr.find("td").last().text(distanceOfTimeInWord(startsInSeconds));
                } else {
                    tr.find("td").last().text("");
                }
            }
        });
    };

    addStartsInColumn(table);
    populateStartsIns(table);

    setInterval(populateStartsIns, 5000, table);
})();
