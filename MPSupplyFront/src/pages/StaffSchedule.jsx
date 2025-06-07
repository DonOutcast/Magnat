import React, {useEffect, useMemo, useState} from 'react';
import Calendar from "../components/Calendar";
import UserRAPI from "../API/UserRAPI";
import {useTypedSelector} from "../hooks/useTypedSelector";


const StaffSchedule = () => {
    const [selUID, setSelUID] = useState(0)
    const [schedule, setSchedule] = useState([])
    const [holidays, setHolidays] = useState([])

    const masters = useTypedSelector(state => state.masters)

    function filterMasters(masters) {
        return masters.filter((x) => {
            const roles = x.roles.map(el => el.slug)

            return x.active && roles.includes('manager')
        })
    }

    const activeMasters = filterMasters(masters.masters)

    async function fetch()
    {
        const res = await UserRAPI.GetSchedule()

        if (!res.error) {
            setSchedule(res.schedule)
            setHolidays(res.holidays)
        }
    }

    async function moveSchedule(uid, from, to)
    {
        const res = await UserRAPI.MoveSchedule(uid, from, to)
        setTimeout(fetch, 100);
    }

    async function removeSchedule(uid, date)
    {
        const res = await UserRAPI.RemoveSchedule(uid, date)
        setTimeout(fetch, 100);
    }
    async function addSchedule(date)
    {
        if (selUID !== 0) {
            const res = await UserRAPI.AddSchedule(selUID, date)
            setTimeout(fetch, 100);
        }
    }

    async function renderHolidays() {
        Array.from(document.querySelectorAll('.fc-day[data-date]')).forEach(e => {
            if (holidays.includes(e.getAttribute('data-date'))) {
                e.querySelector('.fc-daygrid-day-number').style.color = '#ea0606';
            }
        })
    }

    useEffect(function () {
        renderHolidays()
        if (holidays.length > 0) {
            document.querySelector('.fc-prev-button').addEventListener("click", () => setTimeout(renderHolidays, 200));
            document.querySelector('.fc-next-button').addEventListener("click", () => setTimeout(renderHolidays, 200));
        }
    }, [holidays])

    useEffect(function () {
        fetch()
    }, [])

    return (
        <div>
            <div className="row">
                <div className="col-lg-8">
                    <div className="card">
                        {useMemo(
                            () => (
                                <Calendar
                                    initialView="dayGridMonth"
                                    events={schedule}
                                    selectable
                                    editable
                                    eventResizableFromStart={false}
                                    eventDurationEditable={false}
                                    weekends={true}
                                    eventDrop={(e) => {
                                        moveSchedule(e.event._def.extendedProps.uid, e.oldEvent.start.toLocaleDateString('en-CA'), e.event.start.toLocaleDateString('en-CA'))
                                    }}
                                    eventClick={(e) => {
                                        removeSchedule(e.event._def.extendedProps.uid, e.event.startStr)
                                    }}
                                    dateClick={(info) => {
                                            addSchedule(info.dateStr)
                                    }}
                                />
                            ),
                            [schedule, selUID]
                        )}
                    </div>
                </div>
                <div className="col-lg-4">
                    <div className="card p-3 pb-0">
                        {activeMasters.map(el =>
                            <div key={el.id} onClick={() => setSelUID(el.id)}
                                className={'cp badge mb-3 ' + (selUID === el.id?'shadow ':'') + (el.class ? el.class.replace('bg-', 'bg-gradient-') : 0)}
                            >{el.fio}</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffSchedule;