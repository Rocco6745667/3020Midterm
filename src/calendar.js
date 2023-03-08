//import the the package for getting dates
import { getDaysAndHours } from './lookUpDaysHours.js';

// this allows for the calendar to find events and get the current date
export default class Calendar {
    constructor(events) {
        this._validateEvents(events);
        this.events = this._parseEvents(events);
        this.currentDate = new Date();
        this._scrollListener();
        this._addHeaderButtonEventListeners();
        this.renderAllDayRow();
        this.renderCalendarBody();
        this.renderCalendarHours();
        this.render();
    }
// allows for the calendar to set the date
    setDate(date) {
        this.currentDate.setDate(date);
    }
// allows for the calendar to get the date
    getDate() {
        return this.currentDate;
    }
//allows the calendar to get the month
    getMonth() {
        return this.currentDate.getMonth();
    }
//allows for the calendar to get the title
    getTitle() {
        return document.getElementById('calendar-title');
    }
//allows for the month names to be set tin order of appearance
    setTitle() {
        const monthNames = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December'
        ];
        //add the months of the year from the list above
        const titleMonth = document.createElement('span');
        titleMonth.classList.add('calendar-title-month');
        titleMonth.innerText = monthNames[this.getMonth()];
        const titleYear = document.createElement('span');
        titleYear.classList.add('calendar-title-year');
        titleYear.innerText = this.getDate().getFullYear();
        this.getTitle().innerHTML = '';
        this.getTitle().appendChild(titleMonth);
        this.getTitle().appendChild(titleYear);
    }

    //renders the titles above
    render() {
        this.setTitle();
        this.renderDays();
        this.renderEvents();
    }

    //renders the events above
    renderEvents() {
        this._resetAllColumns();
        const thisWeekEvents = this.events.filter(event => {
            return this._isExistInThisWeek(event.dateFrom, event.dateTo);
        });
        thisWeekEvents.forEach(event => {
            this._renderEvent(event);
        });
    }

    //renders the days of the year
    renderDays() {
        const days = document.getElementById('calendar-days');
        days.innerHTML = '';
        const timelineColumn = document.createElement('div');
        timelineColumn.classList.add('calendar-timeline-column');
        days.appendChild(timelineColumn);

        //sets the days with monday at i=0 as its starting point ending at sunday with i=7
        let monday = this._getMonday(this.getDate());
        for (let i = 0; i < 7; i++) {
            const day = document.createElement('div');
            day.classList.add('calendar-day');

            //adds the day name
            const dayName = document.createElement('span');
            dayName.classList.add('calendar-day-name');
            dayName.innerText = this._getDayName(monday);
            day.appendChild(dayName);

            //adds the number of the day
            const dayNumber = document.createElement('span');
            dayNumber.classList.add('calendar-day-number');
            // Check if monday is today, starting point
            if (this._isToday(monday)) {
                dayNumber.classList.add('calendar-day-number-today');
            } else {
                dayNumber.classList.remove('calendar-day-number-today');
            }
            dayNumber.innerText = monday.getDate();
            day.appendChild(dayNumber);

            // adding the date based on its postion to monday
            days.appendChild(day);
            monday.setDate(monday.getDate() + 1);
        }

    }

    //makes the day rows
    renderAllDayRow() {
        const calendarBody = document.getElementById('calendar-body');
        const allDayRow = document.createElement('div');
        allDayRow.classList.add('calendar-all-day-row');
        this._createCalendarBodyColumns(allDayRow);
        allDayRow.querySelector('.calendar-timeline-column').innerText = 'all-day';
        calendarBody.appendChild(allDayRow);
    }

    //makes the hours of the day
    renderCalendarHours() {
        const calendarRows = document.getElementsByClassName('calendar-body-row');
        //gets hours form the complier
        for (let i = 0; i < calendarRows.length; i++) {
            const calendarRow = calendarRows[i];
            const hourDiv = calendarRow.querySelector('.calendar-timeline-column');
            const hour = `${(parseInt(calendarRow.dataset.hour)) % 24}`.padStart(2, '0') + ':00';
            if (i === calendarRows.length - 1) {
                const lastHour = document.createElement('div');
                lastHour.classList.add('calendar-timeline-last-hour');
                const lastHourText = document.createElement('span');
                lastHourText.innerText = '00:00';
                const hourText = document.createElement('span');
                hourText.innerText = hour;
                lastHour.appendChild(hourText);
                lastHour.appendChild(lastHourText);
                hourDiv.appendChild(lastHour);
            } else {
                hourDiv.innerText = hour;
            }
        }
    }

    //renders the body of the calendar
    renderCalendarBody() {
        const calendarBody = document.getElementById('calendar-body');
        const calendarBodyRows = this._createCalendarBodyRows();
        calendarBody.appendChild(calendarBodyRows);
    }

    //this allows for events to be renederd properly
    _renderEvent(event) {
        const timeSlots = this._getDaysAndHours(event.dateFrom, event.dateTo);
        timeSlots.forEach((slot, index) => {
            const cell = this._getCell(slot.day, slot.hour);
            //this alows for the events to be registered properly 
            if (!cell.querySelector(`[data-event-id="${event.id}"]`)) {
                const eventDiv = document.createElement('div');
                eventDiv.classList.add('calendar-event');
                eventDiv.dataset.eventId = event.id;
                eventDiv.style.backgroundColor = event.bgColor;
                eventDiv.style.color = event.textColor;
                this._addClicklistenerToEvent(eventDiv);
                eventDiv.innerText = this._getEventName(event, timeSlots, index);
                cell && cell.appendChild(eventDiv);
            }
        });
        this._setEventStartEndSize(event);
    }

    //allows for the events properties to be created
    _addClicklistenerToEvent(eventDiv) {
        eventDiv.addEventListener('click', () => {
            const eventId = eventDiv.dataset.eventId;
            document.querySelector('#calendar-event-tooltip')?.remove();
            const position = eventDiv.getBoundingClientRect();
            const tooltip = document.createElement('div');
            tooltip.classList.add('calendar-event-tooltip');
            tooltip.id = 'calendar-event-tooltip';
            tooltip.style.top = `${position.top + window.scrollY}px`;
            tooltip.style.left = `${position.left + window.scrollX + this._getCellHeightAsNumber()}px`;

            const event = this.events.find(event => event.id === parseInt(eventId));

            //adds the functianlity to create the event
            const eventBody = document.createElement('div');
            eventBody.classList.add('calendar-event-tooltip-body');

            //creates the functianlty to close the event
            const closeIcon = document.createElement('span');
            closeIcon.classList.add('calendar-event-tooltip-close');
            closeIcon.innerHTML = '&#9747;';
            closeIcon.addEventListener('click', () => {
                tooltip.remove();
            });

            //shows the event header
            const eventHeader = document.createElement('h1');
            eventHeader.classList.add('calendar-event-tooltip-header');
            eventHeader.innerText = event.eventName;

            //shows the event time
            const eventTime = document.createElement('div');
            eventTime.classList.add('calendar-event-tooltip-time');
            eventTime.innerText = this._generateDateFromDateToString(event.dateFrom, event.dateTo);

            //alows for the generation of events
            eventBody.appendChild(closeIcon);
            eventBody.appendChild(eventHeader);
            eventBody.appendChild(eventTime);
            tooltip.appendChild(eventBody);
            document.querySelector('body').appendChild(tooltip);
        });
    }

    //this allows for the dates to work properly 
    //extension of lookUpDaysHours.js
    _generateDateFromDateToString(dateFrom, dateTo) {
        const dateFromHour = dateFrom.getHours().toString().padStart(2, '0');
        const dateFromMinute = dateFrom.getMinutes().toString().padStart(2, '0');
        const dateToHour = dateTo.getHours().toString().padStart(2, '0');
        const dateToMinute = dateTo.getMinutes().toString().padStart(2, '0');
        return `${dateFrom.toLocaleDateString()} ${dateFromHour}:${dateFromMinute} - ${dateTo.toLocaleDateString()} ${dateToHour}:${dateToMinute}`;
    }
    //creating the size of each event
    _setEventStartEndSize(event) {
        // Check if event start is within this week
        if (this._isThisWeek(event.dateFrom)) {
            const startDay = event.dateFrom.getDay();
            const startHour = event.dateFrom.getHours();
            const startMinute = event.dateFrom.getMinutes();
            const cell = this._getCell(startDay, startHour);
            const eventDiv = cell.querySelector(`[data-event-id="${event.id}"]`);
            if (eventDiv) {
                const marginTop = startMinute ? (this._getCellHeightAsNumber() / 60) * startMinute : 0;
                eventDiv.style.height = `${this._getCellHeightAsNumber() - marginTop}px`;
                eventDiv.style.marginTop = `${marginTop}px`;
            }
        }

        // Check if event end is within this week
        if (this._isThisWeek(event.dateTo)) {
            const endDay = event.dateTo.getDay();
            const endHour = event.dateTo.getHours();
            const endMinute = event.dateTo.getMinutes();
            const cell = this._getCell(endDay, endHour);
            const eventDiv = cell.querySelector(`[data-event-id="${event.id}"]`);
            if (eventDiv) {
                const marginBottom = endMinute ? ((this._getCellHeightAsNumber() / 60) * (60 - endMinute)) : 0;
                if (eventDiv.style.height) {
                    eventDiv.style.height = `calc(${eventDiv.style.height} - ${marginBottom}px)`;
                } else {
                    eventDiv.style.height = `${this._getCellHeightAsNumber() - marginBottom}px`;
                }
            }
        }
    }

    //formulating each cell
    _getCell(day, hour) {
        const row = document.querySelector(`#calendar-body-row-${hour}`);
        return row.querySelector(`[data-day="${day}"]`);
    }

    //getting the height of each cell number
    _getCellHeightAsNumber() {
        return parseFloat(getComputedStyle(document.documentElement)
            .getPropertyValue('--calendar-cell-height').replace('px', ''));
    }

    //getting the name of each event
    _getEventName(event, timeSlots, index) {
        const currentDay = timeSlots[index].day;
        const previousSlotDay = timeSlots[index - 1] ? timeSlots[index - 1].day : null;

        if (timeSlots.length === 1) {
            return event.eventName;
        } else if (index === 0) {
            return event.eventName;
        } else if (currentDay !== previousSlotDay) {
            return event.eventName;
        } else {
            return '';
        }
    }
//getting each of the hours of the day
    _getDaysAndHours(dateFrom, dateTo) {
        return this._getHours(dateFrom, dateTo);
    }

    //getting each of days of the year
    _getDays(dateFrom, dateTo) {
        const days = [];
        let currentDate = new Date(dateFrom);
        while (currentDate <= dateTo) {
            days.push(currentDate);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return days;
    }

    //getting the hours for each day
    _getHours(dateFrom, dateTo) {
        dateFrom = new Date(dateFrom);
        dateTo = new Date(dateTo);
        const hours = [];
        let currentDateFrom = dateFrom.getTime() <= this._getMonday(this.getDate()).getTime() ? this._getMonday(this.getDate()) : dateFrom;
        let currentDateTo = dateTo.getTime() >= this._getSunday(this.getDate()).getTime() ? this._getSunday(this.getDate()) : dateTo;
        return getDaysAndHours(currentDateFrom, currentDateTo);
    }

    //reseting the rows for each day
    _resetAllColumns() {
        const calendarColumns = document.querySelectorAll('.calendar-body-column');
        for (let i = 0; i < calendarColumns.length; i++) {
            if (!calendarColumns[i].classList.contains('calendar-timeline-column')) {
                calendarColumns[i].innerHTML = '';
            }
        }
    }

    //creating the row properties
    _createCalendarBodyRows() {
        const calendarBodyRows = document.createElement('div');
        calendarBodyRows.classList.add('calendar-body-rows');
       //creating the rows for each hour
        for (let i = 0; i < 24; i++) {
            const row = this._createCalendarBodyRow();
            row.setAttribute('id', `calendar-body-row-${i}`);
            row.dataset.hour = i;
            calendarBodyRows.appendChild(row);
        }
        return calendarBodyRows;
    }

    //creating the rows
    _createCalendarBodyRow() {
        const calendarBodyRow = document.createElement('div');
        calendarBodyRow.classList.add('calendar-body-row');
        this._createCalendarBodyColumns(calendarBodyRow);
        return calendarBodyRow;
    }

    _createCalendarBodyColumns(row) {
        //create the columns
        const timelineColumn = document.createElement('div');
        timelineColumn.classList.add('calendar-body-column');
        timelineColumn.classList.add('calendar-timeline-column');
        row.appendChild(timelineColumn);
        //let the calendar add the proper columns
        for (let i = 0; i < 7; i++) {
            const column = document.createElement('div');
            column.dataset.day = (i + 1) % 7;
            column.classList.add('calendar-body-column');
            row.appendChild(column);
        }
    }

    _addHeaderButtonEventListeners() {
        //add the previuous week, next week and today buttons
        const prevWeekButton = document.getElementById('calendar-action-button-prev');
        const nextWeekButton = document.getElementById('calendar-action-button-next');
        const todayButton = document.getElementById('calendar-action-button-today');

        //add the functiality to the  previous week button
        prevWeekButton.addEventListener('click', () => {
            this.setDate(this.currentDate.getDate() - 7);
            this.render();
        });

        //add the functianlity to the next week button
        nextWeekButton.addEventListener('click', () => {
            this.setDate(this.currentDate.getDate() + 7);
            this.render();
        });

        //add the functionality to the today button
        todayButton.addEventListener('click', () => {
            this.currentDate = new Date();
            this.render();
        });
    }

    _scrollListener() {
        const calendarBody = document.getElementById('calendar-body');
        calendarBody.addEventListener('scroll', () => {
            const scrollTop = calendarBody.scrollTop;
            const allDayRow = document.querySelector('.calendar-all-day-row');
            const rows = allDayRow.getElementsByClassName('calendar-body-column');
            if (scrollTop < 7) {
                rows[rows.length - 1].style.paddingTop = '40px';
                rows[rows.length - 2].style.paddingTop = '40px';
            } else {
                rows[rows.length - 1].style.paddingTop = '0';
                rows[rows.length - 2].style.paddingTop = '0';
            }

        });
    }

    //checks to make sure that events follow the correct protocols
    _validateEvents(events) {
        if (!Array.isArray(events)) {
            throw new Error('Events must be an array');
        }
        //checks to make sure that event start and end dates make logical sense
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            if (!event.dateFrom || !event.dateTo) {
                throw new Error('Events must have start and end properties');
            }
            if (event.dateFrom > event.dateTo) {
                throw new Error('Events must have start date before end date');
            }
            //checks to make sure events are titled correctly
            if (!event.eventName) {
                throw new Error('Events must have a name');
            }

            if (event.id === undefined || event.id === null) {
                event.id = this._getRandomId();
            }
        }
    }

    //gets the events that are needed for the calendar
    _parseEvents(events) {
        const parsedEvents = [];
        for (let i = 0; i < events.length; i++) {
            const event = {
                ...events[i],
                //get the colors for the event and the to and from date
                bgColor: this._getRandomBgColorAndTextColor().bgColor,
                textColor: this._getRandomBgColorAndTextColor().textColor,
                dateFrom: new Date(events[i].dateFrom),
                dateTo: new Date(events[i].dateTo)
            }
            parsedEvents.push(event);
        }
        return parsedEvents;
    }

    //gets the dates of the year
    _getDayName(date) {
        const dayNames = [
            'Sun',
            'Mon',
            'Tue',
            'Wed',
            'Thu',
            'Fri',
            'Sat'
        ];
        return dayNames[date.getDay()];
    }

    //check to see if the date for the complier is monday, start point of i=0
    _getMonday(date) {
        date = new Date(date);
        var day = date.getDay(),
            diff = date.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
        return new Date((new Date(date.setDate(diff))).setHours(0, 0, 0, 0));
    }

    //check to see if the date for the complier is sunday, end point of i=6
    _getSunday(date) {
        date = new Date(date);
        var day = date.getDay(),
            diff = date.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
        return new Date((new Date(date.setDate(diff + 6))).setHours(23, 59, 59, 999));
    }

    //to make the dates conistant with real time
    _isToday(date) {
        const today = new Date()
        return date.getDate() == today.getDate() &&
            date.getMonth() == today.getMonth() &&
            date.getFullYear() == today.getFullYear()
    }

    //moves the today date to the correct week
    _isThisWeek(date) {
        const monday = this._getMonday(this.getDate()).getTime();
        const sunday = this._getSunday(this.getDate()).getTime();
        return date.getTime() >= monday && date.getTime() <= sunday;
    }


    //moves the dates from day to day
    _isExistInThisWeek(dateFrom, dateTo) {
        this.counter += 1;
        return this._getMonday(this.getDate()).getTime() >= this._getMonday(dateFrom).getTime() &&
            this._getSunday(this.getDate()).getTime() <= this._getSunday(dateTo).getTime()
    }

    //stores the colors needed for the machine
    _getRandomBgColorAndTextColor() {
        const bgColors = [
            '#f44336',
            '#e91e63',
            '#9c27b0',
            '#673ab7',
            '#3f51b5',
            '#2196f3',
            '#03a9f4',
            '#00bcd4',
            '#009688',
            '#4caf50',
            '#8bc34a',
            '#cddc39',
            '#ffeb3b',
            '#ffc107',
            '#ff9800',
            '#ff5722',
            '#795548',
            '#607d8b'
        ];
        const textColors = [
            '#ffffff',
            '#ffffff',
            '#ffffff',
            '#ffffff',
            '#ffffff',
            '#ffffff',
            '#ffffff',
            '#ffffff',
            '#ffffff',
            '#ffffff',
            '#ffffff',
            '#ffffff',
            '#ffffff',
            '#ffffff',
            '#ffffff',
            '#ffffff',
            '#ffffff',
            '#ffffff'
        ];
        return {
            bgColor: bgColors[Math.floor(Math.random() * bgColors.length)],
            textColor: textColors[Math.floor(Math.random() * textColors.length)]
        }
    }

}
