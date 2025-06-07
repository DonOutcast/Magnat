import React, {useEffect, useState} from 'react';
import Modal from "../UI/Modal";
import {useTypedSelector} from "../../hooks/useTypedSelector";
import {OrderItemType} from "../../models/OrderModels";

const AddItem = (props: {
    orderId: number,
    orderDesiredAt: string,
    modal: boolean,
    closeModal: () => void,
    AddItemF: (Item: any) => void,
    skipSteps: number[],
}) => {
    const maxStep = 6
    const [Step, SetStep] = useState(1)

    const EmptyItem = {
        orderId: props.orderId,
        desiredAt: props.orderDesiredAt,
        comment: null,
        group: null,
        groupId: null,
        type: null,
        material: null,
        color: null,
        sex: null,
        wear: null
    }

    function nextStep(setter = 0, itemProps: any) {
        const next = setter === 0 ? Step + 1 : setter

        if (next <= maxStep && props.skipSteps.length > 0 && props.skipSteps.indexOf(next) !== -1) {
            nextStep(next + 1, itemProps)
            return;
        }

        let itemBuf = {...Item, ...itemProps}

        if (next <= maxStep) {
            SetItem(itemBuf)
            SetStep(next)
        } else {
            props.AddItemF(itemBuf)
            props.closeModal()
            SetItem(EmptyItem)
            SetStep(1)
        }
    }

    const [Item, SetItem] = useState<any>(EmptyItem)

    const ig = useTypedSelector(state => state.item_groups)
    const it = useTypedSelector(state => state.item_types)
    const im = useTypedSelector(state => state.itemRefs)

    return (
        <div>
            <Modal id="add_item" title="Добавить изделие"  onClose={() => {
                SetItem(EmptyItem)
                SetStep(1)
                props.closeModal()
            }} show={props.modal} addClass="modal-lg">
                <h4>Шаг <span>{Step}</span>/{maxStep - props.skipSteps.length}</h4>
                {Step === 1 &&
                    <div className="row service_list">
                        {ig.item_groups.map((el) =>
                            <div className="col-lg-4 col-md-6 mb-4" key={el.id}>
                                <div className="card serviceCard h-100" onClick={() => {
                                    nextStep(0, {group: el.name, groupId: el.id})
                                }} style={{backgroundImage: 'linear-gradient(310deg, rgb(43, 42, 41), rgb(102, 102, 102))', color: 'rgb(204, 204, 204)'}}>
                                    <div className="card-body p-3"><h6 style={{color: 'rgb(255, 255, 255)'}}>{el.name}</h6></div>
                                </div>
                            </div>
                        )}
                    </div>
                }
                {Step === 2 &&
                    <div className="row service_list">
                        {it.item_types[Item.groupId].map((el: any) =>
                            <div className="col-lg-4 col-md-6 mb-4" key={el.id}>
                                <div className="card serviceCard h-100" onClick={() => {
                                    nextStep(0, {type: el.name})
                                }} style={{backgroundImage: 'linear-gradient(310deg, rgb(43, 42, 41), rgb(102, 102, 102))', color: 'rgb(204, 204, 204)'}}>
                                    <div className="card-body p-3"><h6 style={{color: 'rgb(255, 255, 255)'}}>{el.name}</h6></div>
                                </div>
                            </div>
                        )}
                    </div>
                }
                {Step === 3 &&
                <div className="row service_list">
                    {im.materials.map((el: any) =>
                        <div className="col-lg-4 col-md-6 mb-4" key={el.id}>
                            <div className="card serviceCard h-100" onClick={() => {
                                nextStep(0, {material: el.name})
                            }} style={{background: 'url(https://endlessmind.space' + el.bgimg + ')', backgroundSize: 'cover', color: 'rgb(204, 204, 204)'}}>
                                <div className="card-body p-3"><h6 style={{color: 'rgb(255, 255, 255)'}}>{el.name}</h6></div>
                            </div>
                        </div>
                    )}
                </div>
                }
                {Step === 4 &&
                <div className="row service_list">
                    {im.color.map((el: any) =>
                        <div className="col-lg-4 col-md-6 mb-4" key={el.id}>
                            <div className="card serviceCard h-100" onClick={() => {
                                nextStep(0, {color: el.name})
                            }} style={{background: el.bgc, backgroundSize: 'cover', color: 'rgb(204, 204, 204)'}}>
                                <div className="card-body p-3 text-center"><h6 className="px-2" style={{margin: '0 auto', width: 'fit-content', backgroundColor: '#000', color: 'rgb(255, 255, 255)'}}>{el.name}</h6></div>
                            </div>
                        </div>
                    )}
                </div>
                }
                {Step === 5 &&
                <div className="row service_list">
                    {im.sex.map((el: any) =>
                        <div className="col-lg-4 col-md-6 mb-4" key={el.id}>
                            <div className="card serviceCard h-100" onClick={() => {
                                nextStep(0, {sex: el.name})
                            }} style={{backgroundImage: 'linear-gradient(310deg, rgb(43, 42, 41), rgb(102, 102, 102))', color: 'rgb(204, 204, 204)'}}>
                                <div className="card-body p-3"><h6 style={{color: 'rgb(255, 255, 255)'}}>{el.name}</h6></div>
                            </div>
                        </div>
                    )}
                </div>
                }
                {Step === 6 &&
                <div className="row service_list">
                    {im.wears.map((el: any) =>
                        <div className="col-lg-4 col-md-6 mb-4" key={el.id}>
                            <div className="card serviceCard h-100" onClick={() => {
                                nextStep(0, {wear: el.name})
                            }} style={{backgroundImage: 'linear-gradient(310deg, rgb(43, 42, 41), rgb(102, 102, 102))', color: 'rgb(204, 204, 204)'}}>
                                <div className="card-body p-3"><h6 style={{color: 'rgb(255, 255, 255)'}}>{el.name}</h6></div>
                            </div>
                        </div>
                    )}
                </div>
                }
            </Modal>
        </div>
    );
};

export default AddItem;