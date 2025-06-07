import React, { useEffect, useState } from "react";
import WarehouseRAPI from "../API/WarehouseRAPI";
import { useTitle } from "../hooks/useTitle";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";

const WarehouseMain = () => {
  let { mp } = useParams();
  useTitle("Склад");
  const [warehouses, SetWarehouses] = useState([]);

  async function getWarehouses() {
    const res = await WarehouseRAPI.all(mp);
    SetWarehouses(
      res.items.map((el) => ({
        ...el,
        priority: el.priority == null ? "" : el.priority,
      }))
    );
  }

  useEffect(
    function() {
      getWarehouses();
    },
    [mp]
  );

  async function saveAllWH(el) {
    const res = await WarehouseRAPI.updateAll({
      items: warehouses,
      mp,
    });
    if (!res.error) {
      toast.success("Изменения сохранены");
    }
  }

  async function changeValue(param, indx, value) {
    const newWarehouses = [...warehouses];
    newWarehouses[indx][param] = value;
    SetWarehouses(newWarehouses);
  }

  useEffect(
    function() {
      checkNormal();
    },
    [warehouses]
  );

  const [msg, setMsg] = useState("");
  const [badPriors, setBadPriors] = useState([]);
  function checkNormal() {
    const messages = [];
    let badPriors = [];
    const priors = warehouses.map((wh) => wh.priority).sort((a, b) => a - b);
    const priorsIdeal = Array.from({ length: priors.length }, (_, i) => i + 1);
    let diff = priors.filter((_, i) => priors[i] !== priorsIdeal[i]);

    if (priors.length !== new Set(priors).size) {
      messages.push("Отсутствует уникальность приоритетов складов");

      let setEntries = priors.reduce((value, value2) => {
        if (value[value2]) {
          ++value[value2];
        } else {
          value[value2] = 1;
        }
        return value;
      }, {});

      let doubles = Object.keys(setEntries)
        .filter((k) => setEntries[k] > 1)
        .map((k) => parseInt(k));
      badPriors = badPriors.concat(doubles);
    }
    if (diff.length > 0) {
      messages.push("Приоритеты должны идти по порядку и начинаться с 1");
      badPriors = badPriors.concat([diff[0]]);
    }

    setMsg(messages.join("\n"));
    setBadPriors(badPriors);

    return messages.length === 0;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header pb-0">
          <div className="d-lg-flex justify-content-between">
            <div>
              <h5 className="mb-0">Склады</h5>
            </div>
            <div className="ms-3">
              <button
                className="btn btn-icon bg-gradient-success"
                onClick={saveAllWH}
                disabled={msg !== ""}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
        <div className="card-body px-0 pb-0">
          <table className="table text-center">
            <thead>
              <tr>
                <th>Склад</th>
                <th style={{ width: "5%" }}>Коротко</th>
                <th>Приоритет</th>
                <th>Видимость</th>
                <th>Период запаса (дней)</th>
                <th>Период доставки (дней)</th>
              </tr>
            </thead>
            <tbody>
              {warehouses &&
                warehouses.length > 0 &&
                warehouses.map((el, indx) => (
                  <tr key={indx}>
                    <td>{el.name}</td>
                    <td>
                      <div className="form-group m-0">
                        <input
                          value={el.shortName ? el.shortName : ""}
                          className="form-control"
                          onChange={(e) =>
                            changeValue("shortName", indx, e.target.value)
                          }
                        />
                      </div>
                    </td>
                    <td>
                      <div
                        className={
                          "form-group m-0" +
                          (badPriors.indexOf(el.priority) !== -1
                            ? " has-danger"
                            : "")
                        }
                      >
                        <input
                          type="number"
                          value={el.priority}
                          className={
                            "form-control" +
                            (badPriors.indexOf(el.priority) !== -1
                              ? " is-invalid"
                              : "")
                          }
                          onChange={(e) =>
                            changeValue(
                              "priority",
                              indx,
                              parseInt(e.target.value)
                            )
                          }
                        />
                      </div>
                    </td>
                    <td>
                      <div
                        className="form-check form-switch"
                        style={{ width: "fit-content", margin: "0 auto" }}
                      >
                        <input
                          className="form-check-input"
                          checked={el.visible}
                          type="checkbox"
                          id="flexSwitchCheckDefault1"
                          onChange={(e) =>
                            changeValue("visible", indx, !el.visible)
                          }
                        />
                      </div>
                    </td>
                    <td>
                      <div className="form-group m-0">
                        <input
                          type="number"
                          value={el.periodStock}
                          className="form-control"
                          onChange={(e) =>
                            changeValue(
                              "periodStock",
                              indx,
                              parseInt(e.target.value)
                            )
                          }
                        />
                      </div>
                    </td>
                    <td>
                      <div className="form-group m-0">
                        <input
                          type="number"
                          value={el.periodDelivery}
                          className="form-control"
                          onChange={(e) =>
                            changeValue(
                              "periodDelivery",
                              indx,
                              parseInt(e.target.value)
                            )
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      {msg !== "" && (
        <div className="Toastify">
          <div className="Toastify__toast-container Toastify__toast-container--top-right">
            <div
              id="4ei510p"
              className="Toastify__toast Toastify__toast-theme--light Toastify__toast--error"
            >
              <div role="alert" className="Toastify__toast-body">
                <div className="Toastify__toast-icon Toastify--animate-icon Toastify__zoom-enter">
                  <svg
                    viewBox="0 0 24 24"
                    width="100%"
                    height="100%"
                    fill="var(--toastify-icon-color-error)"
                  >
                    <path d="M11.983 0a12.206 12.206 0 00-8.51 3.653A11.8 11.8 0 000 12.207 11.779 11.779 0 0011.8 24h.214A12.111 12.111 0 0024 11.791 11.766 11.766 0 0011.983 0zM10.5 16.542a1.476 1.476 0 011.449-1.53h.027a1.527 1.527 0 011.523 1.47 1.475 1.475 0 01-1.449 1.53h-.027a1.529 1.529 0 01-1.523-1.47zM11 12.5v-6a1 1 0 012 0v6a1 1 0 11-2 0z"></path>
                  </svg>
                </div>
                <div>{msg}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseMain;
