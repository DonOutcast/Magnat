import React from 'react';
import Moment from 'moment';
import {useTitle} from "../hooks/useTitle";

const Main = () => {
    Moment.locale('ru')

    useTitle(process.env.REACT_APP_TITLE)

    return (
        <div className="row">
            <div className="col-md-12">
                Тут надо придумать что отображать
            </div>
        </div>
    );
};

export default Main;