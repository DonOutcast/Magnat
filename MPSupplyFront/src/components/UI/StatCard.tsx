import React from 'react';

type StatCardProps = {
    title: string,
    value: number|string,
    icon?: string,
    onClick?: () => void,
    clickable?: boolean
    onClickIcon?: () => void,
    clickableIcon?: boolean
}

const StatCard = (props: StatCardProps) => {
    return (
        <div className="card" style={{cursor: props.clickable ? "pointer" : "initial"}} onClick={props.onClick}>
            <div className="card-body p-3">
                <div className="row">
                    <div className="col-8">
                        <div className="numbers">
                            <p className="text-sm mb-0 text-capitalize font-weight-bold">{props.title}</p>
                            <h5 className="font-weight-bolder mb-0">
                                {props.value}
                            </h5>
                        </div>
                    </div>
                    {typeof props.icon == 'string' &&
                    <div className="col-4 text-end"onClick={(e) => e.stopPropagation()}>
                        <div
                            style={{cursor: props.clickableIcon ? "pointer" : "initial"}}
                            onClick={props.onClickIcon}
                            className="icon icon-shape bg-gradient-primary shadow text-center border-radius-md">
                                <i className={props.icon + ' ni text-lg opacity-10'}
                                aria-hidden="true"/>
                        </div>
                    </div>
                    }
                </div>
            </div>
        </div>
    );
};

export default StatCard;