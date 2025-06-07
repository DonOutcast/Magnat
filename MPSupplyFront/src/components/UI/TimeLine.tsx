import React from 'react';
import {MastersType, TimeLineType} from "../../models/OrderModels";
import Moment from "moment";
import 'moment/locale/ru';

const TimeLine = (props: {
timeline: TimeLineType[]
masters: MastersType[]
}) => {

    const masterById:any = {}
    props.masters.forEach(master => {
        masterById[master.id] = master
    })

    return (
        <div className="timeline timeline-one-side">
            { props.timeline.map((el) =>
            <div className="timeline-block mb-3" key={el.createdAt + el.event}>
                <span className={'timeline-step ' + (el.selected == true?'bg-dark':'')}>
                    <i className={'ni ni-bell-55 ' + (el.selected == true?'text-white':'text-secondary')}></i>
                </span>
                <div className="timeline-content">
                    <h6 className="text-dark text-sm font-weight-bold mb-0">{el.event}</h6>
                    <p className="d-flex justify-content-between text-secondary font-weight-bold text-xs mt-1 mb-0">
                        {Moment(el.createdAt).format('D MMM LT')}
                        <span className="float-right">{masterById[el.userId].fio}</span>
                    </p>
                </div>
            </div>
            )}
        </div>
    );
};

export default TimeLine;