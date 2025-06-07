import React, { useEffect, useState } from "react";
import { useFetching } from "../hooks/useFetching";
import "../css/OrderTR.module.css";
import { useTitle } from "../hooks/useTitle";
import ObservableRAPI from "../API/ObservableRAPI";
import Moment from "moment";
import { useParams } from "react-router-dom";

const wsStyleTitle = {
  alignment: { horizontal: "center" },
  font: { bold: true },
};

async function tableToXLSX(fileName: string, target: any) {
  // @ts-ignore
  let workbook = window.XLSX.utils.book_new();
  const myDOM = target.cloneNode(true);
  await myDOM
    .querySelectorAll('[data-del="true"]')
    .forEach((elem: any) => elem.remove());
  await myDOM
    .querySelectorAll("[data-del-colspan]")
    .forEach((elem: any) => (elem.colSpan = elem.dataset.delColspan));

  // @ts-ignore
  let ws = window.XLSX.utils.table_to_sheet(myDOM);

  let wsName = ws.A1.v;
  ws.A1.s = ws.B1.s = ws.C1.s = ws.D1.s = ws.E1.s = ws.F1.s = ws.G1.s = wsStyleTitle;

  // ws["!rows"] = [];
  ws["!cols"][0] = { wch: 50 };
  ws["!cols"][1] = { wch: 15 };
  ws["!cols"][4] = { wch: 16 };
  ws["!cols"][5] = { wch: 10 };
  ws["!cols"][6] = { wch: 16 };

  // let titleNumbers = ws["!merges"].map((el:any) => (el.s.r + 1))

  // titleNumbers.forEach((num: number) => {
  //     ws['A' + num].s = wsStyleTitle
  // })

  // @ts-ignore
  window.XLSX.utils.book_append_sheet(workbook, ws, wsName);

  // @ts-ignore
  window.XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

const StatSaleSpeed = () => {
  useTitle("Оборачиваемость");
  let { mp } = useParams();

  const [orders, setOrders] = useState<any[]>([]);

  const [fetchData, isLoading, errorData] = useFetching(async () => {
    const res = await ObservableRAPI.getBySaleSpeed(mp);

    if (!res.error) {
      setOrders(res);
    }
  });
  useEffect(() => {
    setOrders([])
    fetchData();
  }, [mp]);

  return (
    <div className="row">
      <div className="col-md-12">
        <div className="card dataTable-wrapper">
          <div
            className="table-responsive"
            style={{ overflow: "auto", height: "calc(100vh - 230px)" }}
          >
            <table className="table align-items-center mb-0 th-sticky">
              <thead>
                <tr>
                  <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                    Склад
                  </th>
                  <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                    Артикул
                  </th>
                  <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                    Литраж
                  </th>
                  <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                    Максимальные остатки
                  </th>
                  <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                    Остаток на складе
                  </th>
                  <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                    Период достаточности
                  </th>
                  <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                    Скорость продаж
                  </th>
                  <th className="text-center text-uppercase text-secondary text-xxs font-weight-bolder opacity-7">
                    Макс. скорость продаж
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 &&
                  orders.map((el) => (
                    <tr>
                      <td>{el.warehouse_name}</td>
                      <td>{el.offerId}</td>
                      <td>{el.volume}</td>
                      <td>{el.maxAmount}</td>
                      <td>{el.free_to_sell_amount}</td>
                      <td>
                        {Math.round(el.free_to_sell_amount / el.avg_sale)}
                      </td>
                      <td>{el.avg_sale}</td>
                      <td>{el.maxSale}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        <button
          className="btn btn-icon bg-gradient-primary mt-4 me-3 float-end"
          onClick={() =>
            tableToXLSX(
              "Оборачиваемость_" + Moment().format("Y.MM.DD"),
              document.querySelector("table")
            )
          }
        >
          Скачать все
        </button>
      </div>
    </div>
  );
};

export default StatSaleSpeed;
