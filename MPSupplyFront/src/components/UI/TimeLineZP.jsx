import React from 'react';
import {TimeLineType} from "../../models/OrderModels";
import Moment from "moment";
import 'moment/locale/ru';

const TimeLineZP = (props) => {
    return (
        <div className="timeline timeline-one-side">
            { props.timeline.map((el) =>
            <div className="timeline-block mb-3" key={el.id}>
                <span className="timeline-step">
                    <i className="ni ni-bell-55 text-secondary"></i>
                </span>
                <div className="timeline-content">
                    <h6 className="text-dark text-sm font-weight-bold mb-0">{Intl.NumberFormat("ru").format(el.amount)}</h6>
                    <p className="d-flex justify-content-between text-secondary font-weight-bold text-xs mt-1 mb-0">
                        {Moment(el.createdAt).format('D MMM LT')}
                        <span className="float-right">{el.fio}</span>
                    </p>
                </div>
            </div>
            )}
        </div>
    );
};

export default TimeLineZP;