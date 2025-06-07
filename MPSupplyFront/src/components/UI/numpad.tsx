import React from 'react';

const Numpad = (props: {
    add: (key: string) => void,
    erase: () => void,
    ok: () => void
}) => {

    return (
        <div className="skb">
            <div className="hg-rows">
                <div className="hg-row">
                    <div onClick={() => props.add('1')} className="hg-button hg-standardBtn" data-skbtn="1" data-skbtnuid="default-r0b0"><span>1</span></div>
                    <div onClick={() => props.add('2')} className="hg-button hg-standardBtn" data-skbtn="2" data-skbtnuid="default-r0b1"><span>2</span></div>
                    <div onClick={() => props.add('3')} className="hg-button hg-standardBtn" data-skbtn="3" data-skbtnuid="default-r0b2"><span>3</span></div>
                </div>
                <div className="hg-row">
                    <div onClick={() => props.add('4')} className="hg-button hg-standardBtn" data-skbtn="4" data-skbtnuid="default-r1b0"><span>4</span></div>
                    <div onClick={() => props.add('5')} className="hg-button hg-standardBtn" data-skbtn="5" data-skbtnuid="default-r1b1"><span>5</span></div>
                    <div onClick={() => props.add('6')} className="hg-button hg-standardBtn" data-skbtn="6" data-skbtnuid="default-r1b2"><span>6</span></div>
                </div>
                <div className="hg-row">
                    <div onClick={() => props.add('7')} className="hg-button hg-standardBtn" data-skbtn="7" data-skbtnuid="default-r2b0"><span>7</span></div>
                    <div onClick={() => props.add('8')} className="hg-button hg-standardBtn" data-skbtn="8" data-skbtnuid="default-r2b1"><span>8</span></div>
                    <div onClick={() => props.add('9')} className="hg-button hg-standardBtn" data-skbtn="9" data-skbtnuid="default-r2b2"><span>9</span></div>
                </div>
                <div className="hg-row">
                    <div onClick={props.erase} className="hg-button hg-functionBtn hg-button-shift" data-skbtn="{shift}" data-skbtnuid="default-r3b0"><span>&#9003;</span></div>
                    <div onClick={() => props.add('0')} className="hg-button hg-standardBtn" data-skbtn="0" data-skbtnuid="default-r3b1"><span>0</span></div>
                    <div onClick={props.ok} className="hg-button hg-standardBtn" data-skbtn="_" data-skbtnuid="default-r3b2"><span>OK</span></div>
                </div>
            </div>
        </div>
    );
};

export default Numpad;