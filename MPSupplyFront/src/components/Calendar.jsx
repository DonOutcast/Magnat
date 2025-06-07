import React from 'react';
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ruLocale from '@fullcalendar/core/locales/ru';
import CalStyle from "./CalStyle";


function Calendar({ header, ...rest }) {
    const validClassNames = [
        "primary",
        "secondary",
        "info",
        "success",
        "warning",
        "error",
        "light",
        "dark",
    ];

    const events = rest.events
        ? rest.events.map((el) => ({
            ...el,
            className: validClassNames.find((item) => item === el.className)
                ? `event-${el.className}`
                : "event-info",
        }))
        : [];

    return (
        <CalStyle p={2}>
        <FullCalendar
            {...rest}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            events={events}
            locale={ruLocale}
            height="100%"
        />
        </CalStyle>
    );
}
export default Calendar;