import React from 'react';
import {useNavigate} from "react-router-dom";
import Moment from 'moment';
import 'moment/locale/ru';

type OrderListItemProps = {
    order: {
        itemsCNT: number;
        discount: number;
        createdAt: string,
        id: number,
        payedSum: number,
        statuses: any
        totalSum: number
        client: any
    }
}
const OrderTR = (props: OrderListItemProps) => {
    const navigate = useNavigate();

    function handleClick(id: number) {
        navigate('/orders/' + id)
    }
    function statusClass(statuses: any) {
        switch (statuses.join('')) {
            case '0':
            case '01':
            case '012':
            case '013':
            case '02':
            case '03':
            case '3':
            case '13':
            case '23':
                return 'bg-gradient-light'
            case '1':
            case '12':
            case '123':
                return 'bg-gradient-warning'
            case '2':
                return 'bg-gradient-success'
            case '24':
                return 'bg-gradient-info'
            default:
                return 'bg-gradient-danger'
        }
    }
    function statusName(statuses: any) {
        switch (statuses.join('')) {
            case '0':
            case '01':
            case '012':
            case '013':
            case '02':
            case '03':
            case '3':
            case '13':
            case '23':
                return 'В работе'
            case '1':
            case '12':
            case '123':
                return 'Ждет выдачи'
            case '2':
                return 'Закрыт'
            case '24':
                return 'Требует проверки'
            default:
                return 'Ошибка'
        }
    }

    return (
        <tr style={{cursor: "pointer"}} onClick={() => handleClick(props.order.id)}>
            <td>
                <div className="d-flex px-2 py-1">
                    <div className="d-flex flex-column justify-content-center">
                        <h6 className="mb-0">{props.order.id}</h6>
                        <p className="text-secondary mb-0">{Moment(props.order.createdAt).format('D MMMM, H:mm')}</p>
                    </div>
                </div>
            </td>
            <td className="align-middle text-center">
                <span className={"badge " + statusClass(props.order.statuses)}>{statusName(props.order.statuses)}</span>
            </td>
            <td>
                {props.order.client &&
                <>
                    <p className="font-weight-bold mb-0">{[props.order.client.last_name, props.order.client.name, props.order.client.second_name].join(' ')} <span className="badge bg-gradient-warning">{props.order.client.type}</span></p>
                    <p className="text text-secondary mb-0">{props.order.client.phone}</p>
                </>
                }
            </td>
            <td className="align-middle text-center">
                {props.order.itemsCNT}
            </td>
            <td className="align-middle text-center">
                <span className="text-secondary font-weight-bold">{Intl.NumberFormat("ru").format(props.order.totalSum)}</span>
                <p className="text text-secondary mb-0">{props.order.discount != 0 ? props.order.discount + '%' : ''}</p>
            </td>
        </tr>
    );
};

export default OrderTR;