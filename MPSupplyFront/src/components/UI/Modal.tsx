import React from 'react';

interface ModalT {
    id: string,
    title: string,
    children: React.ReactNode,
    show?: boolean,
    onClose: () => void,
    addClass?: string,
    footerButtons?: React.ReactNode
}

const Modal = (props: ModalT) => {
    return (
        <div className={'modal fade ' + (props.show ? "show" : "")} id={ props.id } tabIndex={-1} role="dialog" style={{maxWidth: '100vw', display: props.show?"block":"none", background: "rgba(0,0,0,0.5)"}} aria-labelledby="exampleModalLabel"
             aria-hidden="true" onClick={props.onClose}>
            <div className={'modal-dialog modal-dialog-centered '+props.addClass} role="document" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title" id="exampleModalLabel">{ props.title }</h5>
                        <button onClick={props.onClose} type="button" className="btn-close text-dark" data-bs-dismiss="modal"
                                aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div className="modal-body" style={{overflowX: 'auto'}}>
                        { props.children }
                    </div>
                    <div className="modal-footer">
                        { props.footerButtons }
                        <button onClick={props.onClose} type="button" className="btn bg-gradient-secondary" data-bs-dismiss="modal">Закрыть
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;