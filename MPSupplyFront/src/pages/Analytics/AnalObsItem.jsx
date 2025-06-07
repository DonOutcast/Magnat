import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ObservableRAPI from '../../API/ObservableRAPI';

const average = arr => arr.reduce((p, c) => p + c, 0) / arr.length;

const AnalObsItem = () => {
    let { id } = useParams();

    const [item, setItem] = useState({});

    async function fetch() {
        const res = await ObservableRAPI.getByIdAnal(id);

        if (!res.error) {
            setItem(res);
        }
    }

    useEffect(
        function() {
            fetch();
        },
        [id],
    );

    return (
        <div>
            {item.id && (
                <div className="row mt-4">
                    <div className="col-md-12">
                        <h5>
                            {item.name} ({item.supplier.name})
                        </h5>
                    </div>
                    <div className="col-md-12">
                        <div className="card" style={{ overflow: 'auto', height: 'calc(100vh - 220px)' }}>
                            <table className="table minipadding text-center align-middle th-sticky" style={{ position: 'relative' }}>
                                <tbody>
                                    <THTR title="Общее" />
                                    <tr>
                                        <td className="text-end td-sticky-left">Продажи</td>
                                        <td>10 400 P</td>
                                        <td>12 400 P</td>
                                        <td>14 400 P</td>
                                        <td>16 400 P</td>
                                        <td>18 400 P</td>
                                        <td>20 400 P</td>
                                        <td>22 400 P</td>
                                        <td>24 400 P</td>
                                        <td>26 400 P</td>
                                        <td>28 400 P</td>
                                        <td>30 400 P</td>
                                        <td>32 400 P</td>
                                        <td>34 400 P</td>
                                        <td>36 400 P</td>
                                        <td>38 400 P</td>
                                        <td>40 400 P</td>
                                        <td>42 400 P</td>
                                        <td>44 400 P</td>
                                        <td>46 400 P</td>
                                        <td>48 400 P</td>
                                        <td>50 400 P</td>
                                        <td>52 400 P</td>
                                        <td>54 400 P</td>
                                        <td>56 400 P</td>
                                        <td>58 400 P</td>
                                        <td>60 400 P</td>
                                        <td>62 400 P</td>
                                        <td>64 400 P</td>
                                        <td>66 400 P</td>
                                        <td>68 400 P</td>
                                        <td className="text-start td-sticky-right">100 500 P</td>
                                    </tr>
                                    <tr>
                                        <td className="text-end td-sticky-left">Перерасход РК в %</td>
                                        <td>1%</td>
                                        <td>2%</td>
                                        <td>3%</td>
                                        <td>4%</td>
                                        <td>5%</td>
                                        <td>6%</td>
                                        <td>7%</td>
                                        <td>8%</td>
                                        <td>9%</td>
                                        <td>8%</td>
                                        <td>7%</td>
                                        <td>6%</td>
                                        <td>5%</td>
                                        <td>4%</td>
                                        <td>3%</td>
                                        <td>2%</td>
                                        <td>1%</td>
                                        <td>2%</td>
                                        <td>3%</td>
                                        <td>4%</td>
                                        <td>5%</td>
                                        <td>6%</td>
                                        <td>7%</td>
                                        <td>8%</td>
                                        <td>9%</td>
                                        <td>8%</td>
                                        <td>7%</td>
                                        <td>6%</td>
                                        <td>5%</td>
                                        <td>4%</td>
                                        <td className="td-sticky-right">7,77%</td>
                                    </tr>

                                    {item.items.map(el => (
                                        <ItemTR item={el} />
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <button className="btn btn-icon bg-gradient-success mt-4 float-end ms-3">Сохранить</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const ItemTR = ({ item }) => (
    <>
        <HRTR />
        <THTR title={item.product.offer_id} />
        <tr>
            <td className="text-end td-sticky-left">Продажи</td>
            <td>10 400 P</td>
            <td>12 400 P</td>
            <td>14 400 P</td>
            <td>16 400 P</td>
            <td>18 400 P</td>
            <td>20 400 P</td>
            <td>22 400 P</td>
            <td>24 400 P</td>
            <td>26 400 P</td>
            <td>28 400 P</td>
            <td>30 400 P</td>
            <td>32 400 P</td>
            <td>34 400 P</td>
            <td>36 400 P</td>
            <td>38 400 P</td>
            <td>40 400 P</td>
            <td>42 400 P</td>
            <td>44 400 P</td>
            <td>46 400 P</td>
            <td>48 400 P</td>
            <td>50 400 P</td>
            <td>52 400 P</td>
            <td>54 400 P</td>
            <td>56 400 P</td>
            <td>58 400 P</td>
            <td>60 400 P</td>
            <td>62 400 P</td>
            <td>64 400 P</td>
            <td>66 400 P</td>
            <td>68 400 P</td>
            <td className="td-sticky-right">100 500 P</td>
        </tr>
        <PHTR title="Соинвест" values={[]} />
        <PHTR title="Маржинальность" values={[]} />
        <PHTR title="Экономия на логистике" values={[]} />
        <PHTR title="ПвП" values={item.analytics.map(el => el.drr)} />
        <PHTR title="Клики (ДРР)" values={[]} />
        <PHTR title="Ставка Клики" values={[]} />
        <PHTR title="ТОП (ДРР)" values={[]} />
        <PHTR title="Ставка ТОП" values={[]} />
        <PHTR title="Общий ДРР" values={[]} />
        <PHTR title="Заложенный ДРР" values={[]} />
        <PHTR title="КП" values={[]} />
        <PHTR title="Место в поиске" values={[]} />
        <PHTR title="Наша цена" values={item.analytics.map(el => el.price)} />
        <PHTR title="Цена рассчетная" values={[]} />
    </>
);

const THTR = ({ title }) => (
    <tr>
        <th className="text-end td-sticky-left" style={{ zIndex: 2 }}>
            {title}
        </th>
        <th>01.10</th>
        <th>02.10</th>
        <th>03.10</th>
        <th>04.10</th>
        <th>05.10</th>
        <th>06.10</th>
        <th>07.10</th>
        <th>08.10</th>
        <th>09.10</th>
        <th>10.10</th>
        <th>11.10</th>
        <th>12.10</th>
        <th>13.10</th>
        <th>14.10</th>
        <th>15.10</th>
        <th>16.10</th>
        <th>17.10</th>
        <th>18.10</th>
        <th>19.10</th>
        <th>20.10</th>
        <th>21.10</th>
        <th>22.10</th>
        <th>23.10</th>
        <th>24.10</th>
        <th>25.10</th>
        <th>26.10</th>
        <th>27.10</th>
        <th>28.10</th>
        <th>29.10</th>
        <th>30.10</th>
        <th className="text-start td-sticky-right">Среднее</th>
    </tr>
);
const HRTR = () => (
    <tr>
        <td>&nbsp;</td>
    </tr>
);

const PHTR = ({ title, values }) => (
    <tr>
        <td className="text-end td-sticky-left">{title}</td>
        {values.map(value => (
            <td>{value}</td>
        ))}
        <td className="td-sticky-right">{average(values)}</td>
    </tr>
);

export default AnalObsItem;
