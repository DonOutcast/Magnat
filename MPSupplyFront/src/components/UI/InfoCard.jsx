import React from 'react';

const InfoCard = (props) => {
    return (
        <div className="card h-100">
            <div className="card-header pb-0 p-3">
                <div className="row">
                    <div className="col-md-6 d-flex align-items-center">
                        <h5 className=" ms-1 mb-0">{props.title}</h5>
                    </div>
                    <div className="col d-flex">
                        {props.topButton}
                    </div>
                </div>
            </div>
            <div className="card-body p-3">
                <ul className="list-group">

                    {props.elements.map(el =>
                        <li key={el.label} className="list-group-item border-0 px-1 py-1 d-flex">
                            <span>{el.label}:</span>
                            <span className={'ms-auto text-dark ' + (el.bv ? 'text-bold' : '')}>{el.value}</span>
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default InfoCard;